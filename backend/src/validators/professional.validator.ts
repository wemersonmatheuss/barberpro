import { z } from 'zod'

const digitsOnly = (value: string) => value.replace(/\D/g, '')

export const createProfessionalSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  cpf: z.string().min(11),
  whatsapp: z.string().min(8),
  commissionPct: z.number().min(0).max(100),
  password: z.string().min(6),
  bio: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
})

export const updateProfessionalSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  cpf: z.string().min(11).optional(),
  whatsapp: z.string().min(8).optional(),
  commissionPct: z.number().min(0).max(100).optional(),
  bio: z.string().optional().nullable(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().optional().nullable(),
})

export function normalizeCpf(cpf: string) {
  return digitsOnly(cpf)
}

export function normalizeWhatsapp(whatsapp: string) {
  return digitsOnly(whatsapp)
}

export type CreateProfessionalInput = z.infer<typeof createProfessionalSchema>
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>
