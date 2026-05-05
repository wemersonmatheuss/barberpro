import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { requireAuth, requireRoles } from '../middlewares/auth.middleware'
import * as dashboardController from '../controllers/dashboard.controller'

export const dashboardRoutes = Router()

dashboardRoutes.get('/admin', requireAuth, requireRoles('ADMIN'), asyncHandler(dashboardController.adminMetrics))
dashboardRoutes.get('/barber', requireAuth, requireRoles('BARBER'), asyncHandler(dashboardController.barberMetrics))
