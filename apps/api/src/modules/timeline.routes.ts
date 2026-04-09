import type { FastifyInstance } from 'fastify'

export const registerTimelineRoutes = (app: FastifyInstance) => {
  app.get('/timeline/events', async () => {
    return {
      items: [],
      note: 'Timeline includes reminders, expiring products, and lazy-day nudges.'
    }
  })
}
