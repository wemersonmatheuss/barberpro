import { prisma } from '../config/database'
import { NotFoundError } from '../utils/errors'
import type { CreateServiceInput, UpdateServiceInput } from '../validators/service.validator'

/** Catálogo global (model Service). */
export async function listActiveServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

export async function listServicesForAdmin() {
  return prisma.service.findMany({
    orderBy: { name: 'asc' },
    include: {
      professionalServices: {
        where: { isActive: true },
        select: { professionalId: true, price: true, isActive: true },
      },
    },
  })
}

export async function createService(input: CreateServiceInput) {
  return prisma.$transaction(async (tx) => {
    const service = await tx.service.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        durationMinutes: input.durationMinutes,
        isActive: true,
      },
    })

    if (input.professionalIds.length > 0) {
      await tx.professionalService.createMany({
        data: input.professionalIds.map((professionalId) => ({
          professionalId,
          serviceId: service.id,
          price: input.price,
          isActive: true,
        })),
        skipDuplicates: true,
      })
    }

    return tx.service.findUniqueOrThrow({
      where: { id: service.id },
      include: {
        professionalServices: {
          where: { isActive: true },
          select: { professionalId: true, price: true, isActive: true },
        },
      },
    })
  })
}

export async function updateService(id: string, input: UpdateServiceInput) {
  const current = await prisma.service.findUnique({ where: { id } })
  if (!current) {
    throw new NotFoundError('Serviço não encontrado')
  }

  return prisma.$transaction(async (tx) => {
    await tx.service.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    })

    if (input.professionalIds) {
      const existing = await tx.professionalService.findMany({
        where: { serviceId: id },
        select: { id: true, professionalId: true },
      })

      const keep = new Set(input.professionalIds)
      const removeIds = existing.filter((ps) => !keep.has(ps.professionalId)).map((ps) => ps.id)

      if (removeIds.length) {
        await tx.professionalService.deleteMany({ where: { id: { in: removeIds } } })
      }

      const existingMap = new Map(existing.map((ps) => [ps.professionalId, ps.id]))
      const price = input.price ?? 0
      for (const professionalId of input.professionalIds) {
        if (existingMap.has(professionalId)) {
          if (input.price !== undefined) {
            await tx.professionalService.update({
              where: { id: existingMap.get(professionalId)! },
              data: { price: input.price, isActive: true },
            })
          }
        } else {
          await tx.professionalService.create({
            data: {
              serviceId: id,
              professionalId,
              price,
              isActive: true,
            },
          })
        }
      }
    } else if (input.price !== undefined) {
      await tx.professionalService.updateMany({
        where: { serviceId: id, isActive: true },
        data: { price: input.price },
      })
    }

    return tx.service.findUniqueOrThrow({
      where: { id },
      include: {
        professionalServices: {
          where: { isActive: true },
          select: { professionalId: true, price: true, isActive: true },
        },
      },
    })
  })
}

export async function deleteService(id: string) {
  const current = await prisma.service.findUnique({ where: { id }, select: { id: true } })
  if (!current) {
    throw new NotFoundError('Serviço não encontrado')
  }

  await prisma.$transaction(async (tx) => {
    await tx.professionalService.deleteMany({ where: { serviceId: id } })
    await tx.service.delete({ where: { id } })
  })
}
