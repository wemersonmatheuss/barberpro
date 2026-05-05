import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { requireAuth } from '../middlewares/auth.middleware'
import * as userController from '../controllers/user.controller'

export const usersRoutes = Router()

usersRoutes.patch('/me', requireAuth, asyncHandler(userController.patchMe))
usersRoutes.patch('/me/password', requireAuth, asyncHandler(userController.patchMyPassword))
