import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimiter } from './middlewares/rateLimiter.middleware'
import { errorMiddleware } from './middlewares/error.middleware'
import { router } from './routes/index'

const app = express()

// ─── SEGURANÇA ────────────────────────────────────────────────
app.use(helmet())
app.use(rateLimiter)

// ─── CORS ─────────────────────────────────────────────────────
// Em dev, `origin: true` espelha o Origin da requisição — evita "Failed to fetch" quando o cliente abre
// `http://127.0.0.1:3000` mas FRONTEND_URL só tinha `http://localhost:3000` (origens diferentes).
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || 'http://localhost:3000'
        : true,
    credentials: true,
  }),
)

// ─── PARSE ────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── ROTAS ────────────────────────────────────────────────────
app.use('/api', router)

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── ERROS ────────────────────────────────────────────────────
app.use(errorMiddleware)

export default app
