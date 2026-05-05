import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware'
import * as appointmentController from '../controllers/appointment.controller'

export const appointmentsRoutes = Router()

appointmentsRoutes.get('/availability', requireAuth, asyncHandler(appointmentController.availability))

appointmentsRoutes.post(
  '/',
  requireAuth,
  requireRoles('CLIENT'),
  asyncHandler(appointmentController.create),
)

appointmentsRoutes.get(
  '/me',
  requireAuth,
  requireRoles('CLIENT'),
  asyncHandler(appointmentController.listMine),
)

appointmentsRoutes.patch(
  '/:id/client',
  requireAuth,
  requireRoles('CLIENT'),
  asyncHandler(appointmentController.patchClient),
)

appointmentsRoutes.patch(
  '/:id/status',
  requireAuth,
  requireRoles('BARBER', 'ADMIN'),
  asyncHandler(appointmentController.patchStatus),
)

appointmentsRoutes.get(
  '/barber',
  requireAuth,
  requireRoles('BARBER'),
  asyncHandler(appointmentController.listBarber),
)

appointmentsRoutes.get(
  '/all',
  requireAuth,
  requireRoles('ADMIN'),
  asyncHandler(appointmentController.listAllAdmin),
)
