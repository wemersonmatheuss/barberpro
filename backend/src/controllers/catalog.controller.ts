import type { Request, Response } from 'express'
import { sendSuccess } from '../utils/response'
import * as catalogService from '../services/catalog.service'
import { createServiceSchema, updateServiceSchema } from '../validators/service.validator'

export async function listServices(_req: Request, res: Response) {
  const services = await catalogService.listActiveServices()
  return sendSuccess(res, { services })
}

export async function listServicesAdmin(_req: Request, res: Response) {
  const services = await catalogService.listServicesForAdmin()
  return sendSuccess(res, { services })
}

export async function createServiceAdmin(req: Request, res: Response) {
  const body = createServiceSchema.parse(req.body)
  const service = await catalogService.createService(body)
  return sendSuccess(res, { service }, 'Serviço criado', 201)
}

export async function updateServiceAdmin(req: Request, res: Response) {
  const id = req.params.id as string
  const body = updateServiceSchema.parse(req.body)
  const service = await catalogService.updateService(id, body)
  return sendSuccess(res, { service }, 'Serviço atualizado')
}

export async function deleteServiceAdmin(req: Request, res: Response) {
  const id = req.params.id as string
  await catalogService.deleteService(id)
  return sendSuccess(res, { deleted: true }, 'Serviço removido')
}
