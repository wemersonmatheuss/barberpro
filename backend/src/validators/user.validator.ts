import { z } from 'zod'

export const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
})

export type UpdateMeInput = z.infer<typeof updateMeSchema>

export const updateMyPasswordSchema = z.object({
  newPassword: z.string().min(6),
})

export type UpdateMyPasswordInput = z.infer<typeof updateMyPasswordSchema>
