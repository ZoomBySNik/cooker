import Fastify from 'fastify'
import { registerChatRoutes } from './modules/chat.routes'
import { registerProductsRoutes } from './modules/products.routes'
import { registerTimelineRoutes } from './modules/timeline.routes'

export const buildServer = () => {
  const app = Fastify({ logger: true })

  app.get('/health', async () => ({ ok: true }))

  registerChatRoutes(app)
  registerProductsRoutes(app)
  registerTimelineRoutes(app)

  return app
}
