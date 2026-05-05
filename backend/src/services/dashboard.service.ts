import { AppointmentStatus } from '@prisma/client'
import { prisma } from '../config/database'
import { NotFoundError } from '../utils/errors'

export async function getAdminDashboardMetrics() {
  const [professionalsCount, servicesCount, appointments] = await Promise.all([
    prisma.professional.count({ where: { isActive: true, user: { isActive: true } } }),
    prisma.service.count({ where: { isActive: true } }),
    prisma.appointment.findMany({
      include: {
        professionalService: true,
        professional: { include: { user: { select: { name: true, lastName: true } } } },
      },
    }),
  ])

  const byStatus = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    rescheduled: 0,
  }
  let totalRevenue = 0
  const perProfessional = new Map<string, { id: string; name: string; completed: number; revenue: number }>()
  for (const a of appointments) {
    if (a.status === AppointmentStatus.PENDING) byStatus.pending++
    if (a.status === AppointmentStatus.CONFIRMED) byStatus.confirmed++
    if (a.status === AppointmentStatus.COMPLETED) byStatus.completed++
    if (a.status === AppointmentStatus.CANCELLED) byStatus.cancelled++
    if (a.status === AppointmentStatus.RESCHEDULED) byStatus.rescheduled++
    if (a.status === AppointmentStatus.COMPLETED) {
      totalRevenue += Number(a.professionalService.price)
      const key = a.professionalId
      const curr = perProfessional.get(key) ?? {
        id: key,
        name: `${a.professional.user.name} ${a.professional.user.lastName}`.trim(),
        completed: 0,
        revenue: 0,
      }
      curr.completed += 1
      curr.revenue += Number(a.professionalService.price)
      perProfessional.set(key, curr)
    }
  }

  const ticket = byStatus.completed > 0 ? totalRevenue / byStatus.completed : 0
  return {
    professionalsCount,
    servicesCount,
    totalAppointments: appointments.length,
    byStatus,
    totalRevenue,
    ticketAverage: ticket,
    byProfessional: Array.from(perProfessional.values()).sort((a, b) => b.revenue - a.revenue),
  }
}

export async function getBarberDashboardMetrics(userId: string | undefined) {
  const professional = await prisma.professional.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!professional) {
    throw new NotFoundError('Perfil de barbeiro não encontrado')
  }

  const appointments = await prisma.appointment.findMany({
    where: { professionalId: professional.id },
    include: { professionalService: true },
  })

  const todayKey = new Date().toISOString().slice(0, 10)
  const byStatus = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    rescheduled: 0,
  }
  let todayCompleted = 0
  let totalRevenue = 0
  for (const a of appointments) {
    if (a.status === AppointmentStatus.PENDING) byStatus.pending++
    if (a.status === AppointmentStatus.CONFIRMED) byStatus.confirmed++
    if (a.status === AppointmentStatus.COMPLETED) byStatus.completed++
    if (a.status === AppointmentStatus.CANCELLED) byStatus.cancelled++
    if (a.status === AppointmentStatus.RESCHEDULED) byStatus.rescheduled++
    if (a.status === AppointmentStatus.COMPLETED) {
      totalRevenue += Number(a.professionalService.price)
      if (a.scheduledAt.toISOString().slice(0, 10) === todayKey) todayCompleted++
    }
  }

  return {
    totalAppointments: appointments.length,
    byStatus,
    todayCompleted,
    totalRevenue,
    ticketAverage: byStatus.completed > 0 ? totalRevenue / byStatus.completed : 0,
  }
}
