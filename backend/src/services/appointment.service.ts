import type { Role } from '@prisma/client'
import { AppointmentStatus } from '@prisma/client'
import { prisma } from '../config/database'
import { AppError, ForbiddenError, NotFoundError } from '../utils/errors'
import type {
  CreateAppointmentInput,
  UpdateAppointmentStatusInput,
} from '../validators/appointment.validator'

export async function createAppointment(
  clientId: string | undefined,
  input: CreateAppointmentInput,
) {
  const scheduledAt = new Date(input.scheduledAt)
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new AppError('Data/horário inválidos', 400)
  }

  const ps = await prisma.professionalService.findFirst({
    where: {
      id: input.professionalServiceId,
      isActive: true,
      professional: { isActive: true },
    },
    include: { professional: true },
  })
  if (!ps) {
    throw new NotFoundError('Serviço do profissional não encontrado')
  }

  return prisma.appointment.create({
    data: {
      clientId: clientId!,
      professionalId: ps.professionalId,
      professionalServiceId: ps.id,
      clientName: input.clientName,
      clientPhone: input.clientPhone,
      scheduledAt,
      notes: input.notes,
      status: AppointmentStatus.PENDING,
    },
    include: {
      professional: {
        include: {
          user: { select: { name: true, lastName: true } },
        },
      },
      professionalService: {
        include: { service: true },
      },
    },
  })
}

export async function listAppointmentsForClient(clientId: string | undefined) {
  return prisma.appointment.findMany({
    where: { clientId },
    orderBy: { scheduledAt: 'desc' },
    include: {
      professional: {
        include: {
          user: { select: { name: true, lastName: true, avatarUrl: true } },
        },
      },
      professionalService: {
        include: { service: true },
      },
    },
  })
}

export async function updateAppointmentStatus(
  appointmentId: string,
  input: UpdateAppointmentStatusInput,
  userId: string | undefined,
  userRole: Role | undefined,
) {
  const professional = await prisma.professional.findUnique({
    where: { userId },
  })
  if (!professional && userRole !== 'ADMIN') {
    throw new ForbiddenError()
  }

  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } })
  if (!appointment) {
    throw new NotFoundError('Agendamento não encontrado')
  }
  if (userRole === 'BARBER' && appointment.professionalId !== professional?.id) {
    throw new ForbiddenError()
  }

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: input.status },
    include: {
      client: { select: { id: true, name: true, lastName: true, email: true, phone: true } },
      professionalService: { include: { service: true } },
    },
  })
}

export async function listAppointmentsForBarber(userId: string | undefined) {
  const professional = await prisma.professional.findUnique({
    where: { userId },
  })
  if (!professional) {
    throw new NotFoundError('Perfil de barbeiro não encontrado')
  }
  return prisma.appointment.findMany({
    where: { professionalId: professional.id },
    orderBy: { scheduledAt: 'asc' },
    include: {
      client: { select: { id: true, name: true, lastName: true, email: true, phone: true } },
      professionalService: { include: { service: true } },
    },
  })
}

export async function listAllAppointmentsAdmin() {
  return prisma.appointment.findMany({
    orderBy: { scheduledAt: 'desc' },
    take: 200,
    include: {
      client: { select: { id: true, name: true, lastName: true, email: true } },
      professional: {
        include: { user: { select: { name: true, lastName: true } } },
      },
      professionalService: { include: { service: true } },
    },
  })
}

export async function updateAppointmentByClient(
  appointmentId: string,
  clientId: string | undefined,
  input: { action: 'CONFIRM' | 'CANCEL' | 'RESCHEDULE'; scheduledAt?: string },
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  })
  if (!appointment || appointment.clientId !== clientId) {
    throw new NotFoundError('Agendamento não encontrado')
  }

  if (input.action === 'RESCHEDULE') {
    if (!input.scheduledAt) {
      throw new AppError('Nova data/horário é obrigatória para reagendamento', 400)
    }
    const nextDate = new Date(input.scheduledAt)
    if (Number.isNaN(nextDate.getTime())) {
      throw new AppError('Data/horário inválidos', 400)
    }
    return prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.RESCHEDULED, scheduledAt: nextDate },
      include: {
        professional: { include: { user: { select: { name: true, lastName: true, avatarUrl: true } } } },
        professionalService: { include: { service: true } },
      },
    })
  }

  const nextStatus = input.action === 'CANCEL' ? AppointmentStatus.CANCELLED : AppointmentStatus.CONFIRMED
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: nextStatus },
    include: {
      professional: { include: { user: { select: { name: true, lastName: true, avatarUrl: true } } } },
      professionalService: { include: { service: true } },
    },
  })
}

export async function getProfessionalAvailability(professionalId: string, dateIso: string) {
  const start = new Date(`${dateIso}T00:00:00.000Z`)
  const end = new Date(`${dateIso}T23:59:59.999Z`)

  const [appointments, blockedSlots] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        professionalId,
        scheduledAt: { gte: start, lte: end },
        status: { not: AppointmentStatus.CANCELLED },
      },
      select: { scheduledAt: true },
    }),
    prisma.blockedSlot.findMany({
      where: { professionalId, date: start },
      select: { startTime: true, endTime: true },
    }),
  ])

  return {
    takenTimes: appointments.map((a) =>
      a.scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    ),
    blockedRanges: blockedSlots,
  }
}
