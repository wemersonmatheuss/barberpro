import type { Request, Response } from 'express'
import { sendSuccess } from '../utils/response'
import * as dashboardService from '../services/dashboard.service'

export async function adminMetrics(_req: Request, res: Response) {
  const metrics = await dashboardService.getAdminDashboardMetrics()
  return sendSuccess(res, { metrics })
}

export async function barberMetrics(req: Request, res: Response) {
  const metrics = await dashboardService.getBarberDashboardMetrics(req.userId)
  return sendSuccess(res, { metrics })
}
