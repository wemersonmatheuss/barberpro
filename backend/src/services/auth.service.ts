import bcrypt from 'bcryptjs'
import { prisma } from '../config/database'
import { publicUserAuthSelect } from '../constants/user-select'
import { AppError, NotFoundError } from '../utils/errors'
import { signAccessToken } from '../utils/jwt'
import type { LoginInput, RegisterInput } from '../validators/auth.validator'

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new AppError('E-mail já cadastrado', 409)
  }
  const passwordHash = await bcrypt.hash(input.password, 10)
  const user = await prisma.user.create({
    data: {
      name: input.name,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      passwordHash,
    },
    select: publicUserAuthSelect,
  })
  const accessToken = signAccessToken(user.id, user.role)
  return { user, accessToken }
}

export async function login(input: LoginInput) {
  const raw = input.email.trim()
  const looksLikeEmail = raw.includes('@')

  const cpf = raw.replace(/\D/g, '')

  const user = looksLikeEmail
    ? await prisma.user.findUnique({ where: { email: raw } })
    : await prisma.user.findUnique({ where: { cpf } })
  if (!user?.passwordHash) {
    throw new AppError('E-mail ou senha incorretos', 401)
  }
  const ok = await bcrypt.compare(input.password, user.passwordHash)
  if (!ok) {
    throw new AppError('E-mail ou senha incorretos', 401)
  }
  if (!user.isActive) {
    throw new AppError('Conta desativada', 403)
  }
  const publicUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: publicUserAuthSelect,
  })
  const accessToken = signAccessToken(user.id, user.role)
  return { user: publicUser, accessToken }
}

export async function getMe(userId: string | undefined) {
  if (!userId) {
    throw new NotFoundError('Usuário não encontrado')
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserAuthSelect,
  })
  if (!user) {
    throw new NotFoundError('Usuário não encontrado')
  }
  return { user }
}
