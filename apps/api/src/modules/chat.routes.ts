import type { FastifyInstance } from 'fastify'

export const registerChatRoutes = (app: FastifyInstance) => {
  app.post('/chat/messages', async () => {
    return {
      status: 'accepted',
      note: 'Create user message, resolve intent, and reply via assistant orchestrator.'
    }
  })
}
