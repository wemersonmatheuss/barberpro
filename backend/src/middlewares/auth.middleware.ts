import type { Request, Response, NextFunction } from 'express'
import type { Role } from '@prisma/client'
import { ForbiddenError, UnauthorizedError } from '../utils/errors'
import { verifyAccessToken } from '../utils/jwt'

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header')
  }
  const token = header.slice(7).trim()
  if (!token) {
    throw new UnauthorizedError('Missing token')
  }
  try {
    const payload = verifyAccessToken(token)
    req.userId = payload.sub
    req.userRole = payload.role
    next()
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}

export function requireRoles(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userRole || !allowed.includes(req.userRole)) {
      throw new ForbiddenError('Insufficient permissions')
    }
    next()
  }
}
