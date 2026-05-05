import { Router } from 'express'
import { authRoutes } from './auth.routes'
import { usersRoutes } from './users.routes'
import { appointmentsRoutes } from './appointments.routes'
import { professionalsRoutes } from './professionals.routes'
import { servicesRoutes } from './services.routes'
import { dashboardRoutes } from './dashboard.routes'

export const router = Router()

router.get('/', (_req, res) => {
  res.json({ message: '✂️ BarberPro API is running!' })
})

router.use('/auth', authRoutes)
router.use('/users', usersRoutes)
router.use('/appointments', appointmentsRoutes)
router.use('/professionals', professionalsRoutes)
router.use('/services', servicesRoutes)
router.use('/dashboard', dashboardRoutes)
