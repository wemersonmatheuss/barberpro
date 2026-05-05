/** Campos de usuário expostos na API (sem hash de senha). */
export const publicUserAuthSelect = {
  id: true,
  name: true,
  lastName: true,
  email: true,
  phone: true,
  avatarUrl: true,
  role: true,
  provider: true,
  createdAt: true,
} as const

export const publicUserProfileSelect = {
  id: true,
  name: true,
  lastName: true,
  email: true,
  phone: true,
  avatarUrl: true,
  role: true,
  provider: true,
  updatedAt: true,
} as const
