import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import * as catalogController from '../controllers/catalog.controller'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware'

export const servicesRoutes = Router()

servicesRoutes.get('/', asyncHandler(catalogController.listServices))

servicesRoutes.get('/admin/list', requireAuth, requireRoles('ADMIN'), asyncHandler(catalogController.listServicesAdmin))
servicesRoutes.post('/admin', requireAuth, requireRoles('ADMIN'), asyncHandler(catalogController.createServiceAdmin))
servicesRoutes.patch('/admin/:id', requireAuth, requireRoles('ADMIN'), asyncHandler(catalogController.updateServiceAdmin))
servicesRoutes.delete('/admin/:id', requireAuth, requireRoles('ADMIN'), asyncHandler(catalogController.deleteServiceAdmin))
