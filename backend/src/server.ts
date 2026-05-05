import { env } from './config/env'
import app from './app'

const PORT = Number(env.PORT) || 3001

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📦 Environment: ${env.NODE_ENV}`)
})
