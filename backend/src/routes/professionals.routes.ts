import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import * as professionalController from '../controllers/professional.controller'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware'

export const professionalsRoutes = Router()

professionalsRoutes.get('/admin/list', requireAuth, requireRoles('ADMIN'), asyncHandler(professionalController.listAdmin))
professionalsRoutes.post('/admin', requireAuth, requireRoles('ADMIN'), asyncHandler(professionalController.createAdmin))
professionalsRoutes.patch('/admin/:id', requireAuth, requireRoles('ADMIN'), asyncHandler(professionalController.updateAdmin))
professionalsRoutes.delete('/admin/:id', requireAuth, requireRoles('ADMIN'), asyncHandler(professionalController.deleteAdmin))
professionalsRoutes.get('/me/blocked-slots', requireAuth, requireRoles('BARBER'), asyncHandler(professionalController.listMyBlockedSlots))
professionalsRoutes.post('/me/blocked-slots', requireAuth, requireRoles('BARBER'), asyncHandler(professionalController.createMyBlockedSlot))
professionalsRoutes.delete('/me/blocked-slots/:id', requireAuth, requireRoles('BARBER'), asyncHandler(professionalController.deleteMyBlockedSlot))

professionalsRoutes.get('/', asyncHandler(professionalController.list))
professionalsRoutes.get('/:id/blocked-slots', asyncHandler(professionalController.blockedSlots))
professionalsRoutes.get('/:id', asyncHandler(professionalController.getById))
