import Fastify from 'fastify'
import { registerChatRoutes } from './modules/chat.routes'
import { registerProductsRoutes } from './modules/products.routes'
import { registerTimelineRoutes } from './modules/timeline.routes'

export const buildServer = () => {
  const app = Fastify({ logger: true })

  app.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*')
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
    reply.header('Access-Control-Allow-Headers', 'Content-Type')

    if (request.method === 'OPTIONS') {
      return reply.status(204).send()
    }
  })

  app.get('/health', async () => ({ ok: true }))

  registerChatRoutes(app)
  registerProductsRoutes(app)
  registerTimelineRoutes(app)

  return app
}
