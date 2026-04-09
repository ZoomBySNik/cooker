import type { FastifyInstance } from 'fastify'

export const registerProductsRoutes = (app: FastifyInstance) => {
  app.get('/products', async () => {
    return {
      items: [],
      note: 'List products with rough quantity and expiry dates.'
    }
  })
}
