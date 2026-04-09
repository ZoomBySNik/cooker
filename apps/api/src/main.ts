import { buildServer } from './server'

const start = async () => {
  const app = buildServer()
  await app.listen({ port: 3000, host: '0.0.0.0' })
  app.log.info('API started on http://localhost:3000')
}

void start()
