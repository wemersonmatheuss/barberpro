import { prisma } from '../config/database'
import bcrypt from 'bcryptjs'
import { publicUserProfileSelect } from '../constants/user-select'
import { UnauthorizedError } from '../utils/errors'
import type { UpdateMeInput, UpdateMyPasswordInput } from '../validators/user.validator'

export async function updateProfile(userId: string | undefined, input: UpdateMeInput) {
  if (!userId) {
    throw new UnauthorizedError()
  }
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.lastName !== undefined && { lastName: input.lastName }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
    },
    select: publicUserProfileSelect,
  })
}

export async function updateMyPassword(userId: string | undefined, input: UpdateMyPasswordInput) {
  if (!userId) {
    throw new UnauthorizedError()
  }
  const passwordHash = await bcrypt.hash(input.newPassword, 10)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
    select: { id: true },
  })
}
