import { z } from 'zod'

export const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  durationMinutes: z.number().int().min(5),
  price: z.number().positive(),
  professionalIds: z.array(z.uuid()).default([]),
})

export const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  durationMinutes: z.number().int().min(5).optional(),
  price: z.number().positive().optional(),
  professionalIds: z.array(z.uuid()).optional(),
  isActive: z.boolean().optional(),
})

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
