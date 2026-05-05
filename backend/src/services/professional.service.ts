import bcrypt from 'bcryptjs'
import { prisma } from '../config/database'
import { AppError, NotFoundError } from '../utils/errors'
import type { CreateProfessionalInput, UpdateProfessionalInput } from '../validators/professional.validator'
import { normalizeCpf, normalizeWhatsapp } from '../validators/professional.validator'

export async function listProfessionals() {
  return prisma.professional.findMany({
    where: { isActive: true, user: { isActive: true } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          lastName: true,
          avatarUrl: true,
          email: true,
          phone: true,
          cpf: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProfessionalById(id: string) {
  const professional = await prisma.professional.findFirst({
    where: { id, isActive: true, user: { isActive: true } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          lastName: true,
          avatarUrl: true,
          email: true,
          phone: true,
          cpf: true,
        },
      },
      professionalServices: {
        where: { isActive: true },
        include: {
          service: true,
        },
      },
    },
  })
  if (!professional) {
    throw new NotFoundError('Profissional não encontrado')
  }
  return professional
}

export async function listBlockedSlots(professionalId: string) {
  const exists = await prisma.professional.findFirst({
    where: { id: professionalId, isActive: true },
    select: { id: true },
  })
  if (!exists) {
    throw new NotFoundError('Profissional não encontrado')
  }
  return prisma.blockedSlot.findMany({
    where: { professionalId },
    orderBy: { date: 'asc' },
  })
}

export async function listProfessionalsForAdmin() {
  return prisma.professional.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          lastName: true,
          email: true,
          phone: true,
          cpf: true,
          avatarUrl: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createProfessional(input: CreateProfessionalInput) {
  const cpf = normalizeCpf(input.cpf)
  const phone = normalizeWhatsapp(input.whatsapp)
  const email = `barber.${cpf}@barberpro.local`

  const cpfExists = await prisma.user.findUnique({ where: { cpf } })
  if (cpfExists) {
    throw new AppError('CPF já cadastrado', 409)
  }

  const passwordHash = await bcrypt.hash(input.password, 10)

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.firstName,
        lastName: input.lastName,
        email,
        cpf,
        phone,
        role: 'BARBER',
        passwordHash,
        avatarUrl: input.avatarUrl ?? null,
      },
    })

    const professional = await tx.professional.create({
      data: {
        userId: user.id,
        commissionPct: input.commissionPct,
        bio: input.bio ?? null,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            phone: true,
            cpf: true,
            avatarUrl: true,
            isActive: true,
          },
        },
      },
    })

    return professional
  })
}

export async function updateProfessional(id: string, input: UpdateProfessionalInput) {
  const current = await prisma.professional.findUnique({
    where: { id },
    include: { user: true },
  })
  if (!current) {
    throw new NotFoundError('Profissional não encontrado')
  }

  if (input.cpf) {
    const cpf = normalizeCpf(input.cpf)
    const existing = await prisma.user.findFirst({
      where: { cpf, id: { not: current.userId } },
      select: { id: true },
    })
    if (existing) {
      throw new AppError('CPF já cadastrado', 409)
    }
  }

  return prisma.$transaction(async (tx) => {
    const nextCpf = input.cpf ? normalizeCpf(input.cpf) : current.user.cpf
    const nextName = input.firstName ?? current.user.name
    const nextLastName = input.lastName ?? current.user.lastName

    await tx.user.update({
      where: { id: current.userId },
      data: {
        ...(input.firstName !== undefined && { name: input.firstName }),
        ...(input.lastName !== undefined && { lastName: input.lastName }),
        ...(input.whatsapp !== undefined && { phone: normalizeWhatsapp(input.whatsapp) }),
        ...(input.cpf !== undefined && { cpf: nextCpf }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.password !== undefined && { passwordHash: await bcrypt.hash(input.password, 10) }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        email: `barber.${nextCpf}@barberpro.local`,
      },
    })

    return tx.professional.update({
      where: { id },
      data: {
        ...(input.commissionPct !== undefined && { commissionPct: input.commissionPct }),
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            phone: true,
            cpf: true,
            avatarUrl: true,
            isActive: true,
          },
        },
      },
    })
  })
}

export async function deleteProfessional(id: string) {
  const current = await prisma.professional.findUnique({ where: { id } })
  if (!current) {
    throw new NotFoundError('Profissional não encontrado')
  }

  await prisma.$transaction(async (tx) => {
    await tx.professionalService.deleteMany({ where: { professionalId: id } })
    await tx.blockedSlot.deleteMany({ where: { professionalId: id } })
    await tx.professional.delete({ where: { id } })
    await tx.user.delete({ where: { id: current.userId } })
  })
}

export async function listMyBlockedSlots(userId: string | undefined) {
  const professional = await prisma.professional.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!professional) {
    throw new NotFoundError('Perfil de barbeiro não encontrado')
  }
  return prisma.blockedSlot.findMany({
    where: { professionalId: professional.id },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })
}

export async function createMyBlockedSlot(
  userId: string | undefined,
  input: { date: string; startTime: string; endTime: string; reason?: string | null },
) {
  const professional = await prisma.professional.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!professional) {
    throw new NotFoundError('Perfil de barbeiro não encontrado')
  }
  return prisma.blockedSlot.create({
    data: {
      professionalId: professional.id,
      date: new Date(input.date),
      startTime: input.startTime,
      endTime: input.endTime,
      reason: input.reason ?? null,
    },
  })
}

export async function deleteMyBlockedSlot(userId: string | undefined, slotId: string) {
  const professional = await prisma.professional.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!professional) {
    throw new NotFoundError('Perfil de barbeiro não encontrado')
  }
  const slot = await prisma.blockedSlot.findFirst({
    where: { id: slotId, professionalId: professional.id },
    select: { id: true },
  })
  if (!slot) {
    throw new NotFoundError('Bloqueio não encontrado')
  }
  await prisma.blockedSlot.delete({ where: { id: slotId } })
}
