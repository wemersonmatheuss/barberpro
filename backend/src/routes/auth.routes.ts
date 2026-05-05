import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { requireAuth } from '../middlewares/auth.middleware'
import * as authController from '../controllers/auth.controller'

export const authRoutes = Router()

authRoutes.post('/register', asyncHandler(authController.register))
authRoutes.post('/login', asyncHandler(authController.login))
authRoutes.get('/me', requireAuth, asyncHandler(authController.me))
