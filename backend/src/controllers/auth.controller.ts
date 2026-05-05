import type { Request, Response } from 'express'
import { sendSuccess } from '../utils/response'
import * as authService from '../services/auth.service'
import { loginSchema, registerSchema } from '../validators/auth.validator'

export async function register(req: Request, res: Response) {
  const body = registerSchema.parse(req.body)
  const result = await authService.register(body)
  return sendSuccess(res, result, 'Conta criada', 201)
}

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body)
  const result = await authService.login(body)
  return sendSuccess(res, result, 'Login ok')
}

export async function me(req: Request, res: Response) {
  const result = await authService.getMe(req.userId)
  return sendSuccess(res, result)
}
