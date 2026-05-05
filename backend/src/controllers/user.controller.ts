import type { Request, Response } from 'express'
import { sendSuccess } from '../utils/response'
import * as userService from '../services/user.service'
import { updateMeSchema, updateMyPasswordSchema } from '../validators/user.validator'

export async function patchMe(req: Request, res: Response) {
  const body = updateMeSchema.parse(req.body)
  const user = await userService.updateProfile(req.userId, body)
  return sendSuccess(res, { user }, 'Perfil atualizado')
}

export async function patchMyPassword(req: Request, res: Response) {
  const body = updateMyPasswordSchema.parse(req.body)
  await userService.updateMyPassword(req.userId, body)
  return sendSuccess(res, { updated: true }, 'Senha atualizada')
}
