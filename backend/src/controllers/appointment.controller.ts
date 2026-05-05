import type { Request, Response } from 'express'
import { z } from 'zod'
import { sendSuccess } from '../utils/response'
import * as appointmentService from '../services/appointment.service'
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../validators/appointment.validator'

export async function create(req: Request, res: Response) {
  const body = createAppointmentSchema.parse(req.body)
  const appointment = await appointmentService.createAppointment(req.userId, body)
  return sendSuccess(res, { appointment }, 'Agendamento criado', 201)
}

export async function listMine(req: Request, res: Response) {
  const appointments = await appointmentService.listAppointmentsForClient(req.userId)
  return sendSuccess(res, { appointments })
}

export async function patchStatus(req: Request, res: Response) {
  const id = req.params.id as string
  const body = updateAppointmentStatusSchema.parse(req.body)
  const appointment = await appointmentService.updateAppointmentStatus(
    id,
    body,
    req.userId,
    req.userRole,
  )
  return sendSuccess(res, { appointment }, 'Status atualizado')
}

export async function listBarber(req: Request, res: Response) {
  const appointments = await appointmentService.listAppointmentsForBarber(req.userId)
  return sendSuccess(res, { appointments })
}

export async function listAllAdmin(_req: Request, res: Response) {
  const appointments = await appointmentService.listAllAppointmentsAdmin()
  return sendSuccess(res, { appointments })
}

const clientUpdateSchema = z.object({
  action: z.enum(['CONFIRM', 'CANCEL', 'RESCHEDULE']),
  scheduledAt: z.string().optional(),
})

export async function patchClient(req: Request, res: Response) {
  const id = req.params.id as string
  const body = clientUpdateSchema.parse(req.body)
  const appointment = await appointmentService.updateAppointmentByClient(id, req.userId, body)
  return sendSuccess(res, { appointment }, 'Agendamento atualizado')
}

const availabilityQuerySchema = z.object({
  professionalId: z.uuid(),
  date: z.string().date(),
})

export async function availability(req: Request, res: Response) {
  const query = availabilityQuerySchema.parse(req.query)
  const data = await appointmentService.getProfessionalAvailability(query.professionalId, query.date)
  return sendSuccess(res, data)
}
