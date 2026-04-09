import type { FastifyInstance } from 'fastify'

type ProductCard = {
  id: string
  emoji: string
  name: string
  theme?: string
  quantityPercent: number
  expiryPercent?: number
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

type UpsertProductPayload = {
  emoji?: string
  name?: string
  theme?: string
  quantityPercent?: number
  expiryPercent?: number
  expiresAt?: string
}

const products = new Map<string, ProductCard>()

const nowIso = () => new Date().toISOString()

const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)))

const seedProducts = () => {
  if (products.size > 0) {
    return
  }

  const createdAt = nowIso()
  const initial: ProductCard[] = [
    {
      id: crypto.randomUUID(),
      emoji: '🥛',
      name: 'Молоко',
      theme: 'Завтрак',
      quantityPercent: 70,
      expiryPercent: 45,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      createdAt,
      updatedAt: createdAt
    },
    {
      id: crypto.randomUUID(),
      emoji: '🍅',
      name: 'Томаты',
      theme: 'Салаты',
      quantityPercent: 40,
      expiryPercent: 30,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
      createdAt,
      updatedAt: createdAt
    }
  ]

  initial.forEach((item) => products.set(item.id, item))
}

const toProductResponse = () => ({
  items: Array.from(products.values()).sort((a, b) => a.name.localeCompare(b.name, 'ru'))
})

export const registerProductsRoutes = (app: FastifyInstance) => {
  seedProducts()

  app.get('/products', async () => {
    return toProductResponse()
  })

  app.post<{ Body: UpsertProductPayload }>('/products', async (request, reply) => {
    const { emoji, name, theme, quantityPercent, expiryPercent, expiresAt } = request.body

    if (!name?.trim() || !emoji?.trim()) {
      return reply.status(400).send({ message: 'Fields "name" and "emoji" are required.' })
    }

    const createdAt = nowIso()
    const item: ProductCard = {
      id: crypto.randomUUID(),
      emoji: emoji.trim(),
      name: name.trim(),
      theme: theme?.trim() || undefined,
      quantityPercent: clampPercent(quantityPercent ?? 0),
      expiryPercent: expiryPercent === undefined ? undefined : clampPercent(expiryPercent),
      expiresAt: expiresAt?.trim() || undefined,
      createdAt,
      updatedAt: createdAt
    }

    products.set(item.id, item)

    return reply.status(201).send(item)
  })

  app.patch<{ Params: { id: string }; Body: UpsertProductPayload }>('/products/:id', async (request, reply) => {
    const { id } = request.params
    const existing = products.get(id)

    if (!existing) {
      return reply.status(404).send({ message: 'Product not found.' })
    }

    const next: ProductCard = {
      ...existing,
      ...('emoji' in request.body ? { emoji: request.body.emoji?.trim() || existing.emoji } : {}),
      ...('name' in request.body ? { name: request.body.name?.trim() || existing.name } : {}),
      ...('theme' in request.body ? { theme: request.body.theme?.trim() || undefined } : {}),
      ...('quantityPercent' in request.body
        ? { quantityPercent: clampPercent(request.body.quantityPercent ?? existing.quantityPercent) }
        : {}),
      ...('expiryPercent' in request.body
        ? {
            expiryPercent:
              request.body.expiryPercent === undefined ? undefined : clampPercent(request.body.expiryPercent)
          }
        : {}),
      ...('expiresAt' in request.body ? { expiresAt: request.body.expiresAt?.trim() || undefined } : {}),
      updatedAt: nowIso()
    }

    products.set(id, next)
    return next
  })

  app.delete<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    const removed = products.delete(request.params.id)

    if (!removed) {
      return reply.status(404).send({ message: 'Product not found.' })
    }

    return reply.status(204).send()
  })
}
