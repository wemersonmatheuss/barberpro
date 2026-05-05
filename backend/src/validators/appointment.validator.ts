import { z } from 'zod'
import { AppointmentStatus } from '@prisma/client'

export const createAppointmentSchema = z.object({
  professionalServiceId: z.uuid(),
  scheduledAt: z.string().datetime(),
  clientName: z.string().min(1),
  clientPhone: z.string().min(1),
  notes: z.string().optional(),
})

export const updateAppointmentStatusSchema = z.object({
  status: z.enum([
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.RESCHEDULED,
  ]),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>
