import type { Request } from 'express'
import rateLimit from 'express-rate-limit'

function isAuthRoute(req: Request): boolean {
  const p = req.path || ''
  return p === '/api/auth' || p.startsWith('/api/auth/')
}

/**
 * Em desenvolvimento não aplica limite (evita bloquear login: o Next chama a API a partir do servidor
 * e todas as requisições parecem vir do mesmo IP).
 * Em produção, rotas de auth ficam fora deste limite global — o login via Server Action também
 * concentraria tráfego num único IP no backend; um limiter específico pode ser adicionado depois.
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 600,
  skip: (req) => {
    if (process.env.NODE_ENV !== 'production') {
      return true
    }
    return isAuthRoute(req)
  },
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
