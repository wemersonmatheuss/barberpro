import type { Request, Response } from 'express'
import { z } from 'zod'
import { sendSuccess } from '../utils/response'
import * as professionalService from '../services/professional.service'
import { createProfessionalSchema, updateProfessionalSchema } from '../validators/professional.validator'

export async function list(_req: Request, res: Response) {
  const professionals = await professionalService.listProfessionals()
  return sendSuccess(res, { professionals })
}

export async function getById(req: Request, res: Response) {
  const id = req.params.id as string
  const professional = await professionalService.getProfessionalById(id)
  return sendSuccess(res, { professional })
}

export async function blockedSlots(req: Request, res: Response) {
  const id = req.params.id as string
  const blockedSlots = await professionalService.listBlockedSlots(id)
  return sendSuccess(res, { blockedSlots })
}

export async function listAdmin(_req: Request, res: Response) {
  const professionals = await professionalService.listProfessionalsForAdmin()
  return sendSuccess(res, { professionals })
}

export async function createAdmin(req: Request, res: Response) {
  const body = createProfessionalSchema.parse(req.body)
  const professional = await professionalService.createProfessional(body)
  return sendSuccess(res, { professional }, 'Profissional criado', 201)
}

export async function updateAdmin(req: Request, res: Response) {
  const id = req.params.id as string
  const body = updateProfessionalSchema.parse(req.body)
  const professional = await professionalService.updateProfessional(id, body)
  return sendSuccess(res, { professional }, 'Profissional atualizado')
}

export async function deleteAdmin(req: Request, res: Response) {
  const id = req.params.id as string
  await professionalService.deleteProfessional(id)
  return sendSuccess(res, { deleted: true }, 'Profissional removido')
}

const createBlockedSlotSchema = z.object({
  date: z.string().date(),
  startTime: z.string().min(4),
  endTime: z.string().min(4),
  reason: z.string().optional().nullable(),
})

export async function listMyBlockedSlots(req: Request, res: Response) {
  const blockedSlots = await professionalService.listMyBlockedSlots(req.userId)
  return sendSuccess(res, { blockedSlots })
}

export async function createMyBlockedSlot(req: Request, res: Response) {
  const body = createBlockedSlotSchema.parse(req.body)
  const blockedSlot = await professionalService.createMyBlockedSlot(req.userId, body)
  return sendSuccess(res, { blockedSlot }, 'Bloqueio criado', 201)
}

export async function deleteMyBlockedSlot(req: Request, res: Response) {
  const id = req.params.id as string
  await professionalService.deleteMyBlockedSlot(req.userId, id)
  return sendSuccess(res, { deleted: true }, 'Bloqueio removido')
}
