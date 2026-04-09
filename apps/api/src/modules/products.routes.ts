import type { FastifyInstance } from 'fastify'

type ProductNutrition = {
  kcalPer100g: number
  proteinPer100g: number
  fatPer100g: number
  carbsPer100g: number
}

type ProductCard = {
  id: string
  emoji: string
  name: string
  theme?: string
  quantityInput?: string
  imageUrl?: string
  nutrition?: ProductNutrition
  quantityPercent: number
  expiryPercent?: number
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

type UpsertProductPayload = {
  emoji?: string
  name?: string
  quantityInput?: string
  theme?: string
  imageUrl?: string
  nutrition?: ProductNutrition
  quantityPercent?: number
  expiryPercent?: number
  expiresAt?: string
}

type EnrichRequest = {
  name?: string
  quantityInput?: string
  expiresAt?: string
}

type OpenFoodFactsSearchResponse = {
  products?: Array<{
    product_name?: string
    product_name_ru?: string
    image_front_url?: string
    image_url?: string
    nutriments?: {
      'energy-kcal_100g'?: number
      proteins_100g?: number
      fat_100g?: number
      carbohydrates_100g?: number
    }
    categories_tags?: string[]
    conservation_conditions?: string
    storage_conditions?: string
  }>
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
      theme: 'Молочные продукты',
      quantityInput: '1 л',
      quantityPercent: 70,
      expiryPercent: 45,
      nutrition: {
        kcalPer100g: 60,
        proteinPer100g: 3,
        fatPer100g: 3,
        carbsPer100g: 5
      },
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      createdAt,
      updatedAt: createdAt
    },
    {
      id: crypto.randomUUID(),
      emoji: '🍅',
      name: 'Томаты',
      theme: 'Овощи и фрукты',
      quantityInput: '600 г',
      quantityPercent: 40,
      expiryPercent: 30,
      nutrition: {
        kcalPer100g: 18,
        proteinPer100g: 0.9,
        fatPer100g: 0.2,
        carbsPer100g: 3.9
      },
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

const pickProductFromOpenFoodFacts = (payload: OpenFoodFactsSearchResponse) => {
  const product = payload.products?.find((item) => {
    const n = item.nutriments
    return n && typeof n['energy-kcal_100g'] === 'number'
  })

  const nutrients = product?.nutriments

  return {
    nutrition: {
      kcalPer100g: nutrients?.['energy-kcal_100g'] ?? 60,
      proteinPer100g: nutrients?.proteins_100g ?? 1,
      fatPer100g: nutrients?.fat_100g ?? 1,
      carbsPer100g: nutrients?.carbohydrates_100g ?? 5
    },
    categories: product?.categories_tags ?? [],
    storage: product?.conservation_conditions || product?.storage_conditions || '',
    imageUrl: product?.image_front_url || product?.image_url || undefined
  }
}

const detectStoreSection = (categories: string[]): string => {
  const joined = categories.join(' ').toLowerCase()

  if (/milk|dairy|cheese|yogurt|молок|сыр|йогурт/.test(joined)) return 'Молочные продукты'
  if (/meat|poultry|beef|pork|мяс/.test(joined)) return 'Мясо и птица'
  if (/fish|seafood|рыб|морепродукт/.test(joined)) return 'Рыба и морепродукты'
  if (/vegetable|fruit|tomato|greens|овощ|фрукт|зелень/.test(joined)) return 'Овощи и фрукты'
  if (/bakery|bread|biscuit|хлеб|выпечк/.test(joined)) return 'Хлеб и выпечка'
  if (/cereal|pasta|rice|круп|макарон|рис/.test(joined)) return 'Крупы и бакалея'
  if (/drink|juice|water|напит/.test(joined)) return 'Напитки'

  return 'Прочее'
}

const parseQuantityToGrams = (value: string): number => {
  const normalized = value.toLowerCase().replace(',', '.').trim()
  const match = normalized.match(/(\d+(?:\.\d+)?)/)
  if (!match) return 250

  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return 250

  if (/кг|kg/.test(normalized)) return amount * 1000
  if (/г|гр|gram|g\b/.test(normalized)) return amount
  if (/л|liter|litre|l\b/.test(normalized)) return amount * 1000
  if (/мл|ml/.test(normalized)) return amount
  if (/шт|piece|pcs|упак|pack/.test(normalized)) return amount * 180

  return amount
}

const quantityPercentForOnePerson = (quantityGrams: number, kcalPer100g: number): number => {
  const totalKcal = (quantityGrams / 100) * Math.max(kcalPer100g, 1)
  const oneDayNeedKcal = 2000
  return clampPercent((totalKcal / oneDayNeedKcal) * 100)
}

const parseStorageDays = (storageText: string): number | undefined => {
  if (!storageText) return undefined

  const normalized = storageText.toLowerCase()
  const value = normalized.match(/(\d+(?:\.\d+)?)\s*(day|days|дн|день|дня|дней|week|weeks|нед|месяц|month)/)
  if (!value) return undefined

  const amount = Number(value[1])
  if (!Number.isFinite(amount)) return undefined

  if (/week|weeks|нед/.test(value[2])) return amount * 7
  if (/месяц|month/.test(value[2])) return amount * 30

  return amount
}

const fallbackShelfLifeDays = (name: string): number => {
  const normalized = name.toLowerCase()
  if (/молок|milk|йогурт|yogurt|кефир/.test(normalized)) return 5
  if (/рыб|fish|морепродукт/.test(normalized)) return 2
  if (/мяс|chicken|beef|pork/.test(normalized)) return 3
  if (/сыр|cheese/.test(normalized)) return 14
  if (/томат|огур|салат|зелень|apple|banana|овощ|фрукт/.test(normalized)) return 7
  return 10
}

const deriveExpiry = (inputExpiresAt: string | undefined, storageText: string, productName: string) => {
  if (inputExpiresAt?.trim()) {
    const target = new Date(inputExpiresAt)
    const daysLeft = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return {
      expiresAt: target.toISOString(),
      expiryPercent: clampPercent((daysLeft / 30) * 100)
    }
  }

  const shelfLifeDays = parseStorageDays(storageText) ?? fallbackShelfLifeDays(productName)
  const expiresAt = new Date(Date.now() + shelfLifeDays * 24 * 60 * 60 * 1000).toISOString()
  return {
    expiresAt,
    expiryPercent: clampPercent((shelfLifeDays / 30) * 100)
  }
}

const enrichFromOpenFoodFacts = async (name: string, quantityInput: string, expiresAt?: string) => {
  const endpoint = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    name
  )}&search_simple=1&action=process&json=1&page_size=12`

  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error('Failed to query OpenFoodFacts')
  }

  const payload = (await response.json()) as OpenFoodFactsSearchResponse
  const off = pickProductFromOpenFoodFacts(payload)
  const quantityGrams = parseQuantityToGrams(quantityInput)
  const quantityPercent = quantityPercentForOnePerson(quantityGrams, off.nutrition.kcalPer100g)
  const expiry = deriveExpiry(expiresAt, off.storage, name)

  return {
    quantityPercent,
    expiryPercent: expiry.expiryPercent,
    expiresAt: expiry.expiresAt,
    theme: detectStoreSection(off.categories),
    imageUrl: off.imageUrl,
    nutrition: off.nutrition,
    source: 'OpenFoodFacts'
  }
}

export const registerProductsRoutes = (app: FastifyInstance) => {
  seedProducts()

  app.get('/products', async () => toProductResponse())

  app.post<{ Body: EnrichRequest }>('/products/enrich', async (request, reply) => {
    const name = request.body.name?.trim()
    const quantityInput = request.body.quantityInput?.trim()

    if (!name || !quantityInput) {
      return reply.status(400).send({ message: 'Fields "name" and "quantityInput" are required.' })
    }

    return enrichFromOpenFoodFacts(name, quantityInput, request.body.expiresAt)
  })

  app.post<{ Body: UpsertProductPayload }>('/products', async (request, reply) => {
    const { emoji, name, theme, imageUrl, nutrition, quantityPercent, expiryPercent, expiresAt, quantityInput } = request.body

    if (!name?.trim()) {
      return reply.status(400).send({ message: 'Field "name" is required.' })
    }

    const createdAt = nowIso()
    const item: ProductCard = {
      id: crypto.randomUUID(),
      emoji: emoji?.trim() || "🛒",
      name: name.trim(),
      theme: theme?.trim() || undefined,
      quantityInput: quantityInput?.trim() || undefined,
      imageUrl: imageUrl?.trim() || undefined,
      nutrition,
      quantityPercent: clampPercent(quantityPercent ?? (quantityInput ? parseQuantityToGrams(quantityInput) / 10 : 0)),
      expiryPercent: expiryPercent === undefined ? undefined : clampPercent(expiryPercent),
      expiresAt: expiresAt?.trim() || undefined,
      createdAt,
      updatedAt: createdAt
    }

    products.set(item.id, item)
    return reply.status(201).send(item)
  })

  app.patch<{ Params: { id: string }; Body: UpsertProductPayload }>('/products/:id', async (request, reply) => {
    const existing = products.get(request.params.id)
    if (!existing) {
      return reply.status(404).send({ message: 'Product not found.' })
    }

    const next: ProductCard = {
      ...existing,
      ...('emoji' in request.body ? { emoji: request.body.emoji?.trim() || existing.emoji } : {}),
      ...('name' in request.body ? { name: request.body.name?.trim() || existing.name } : {}),
      ...('theme' in request.body ? { theme: request.body.theme?.trim() || undefined } : {}),
      ...('quantityInput' in request.body ? { quantityInput: request.body.quantityInput?.trim() || undefined } : {}),
      ...('imageUrl' in request.body ? { imageUrl: request.body.imageUrl?.trim() || undefined } : {}),
      ...('nutrition' in request.body ? { nutrition: request.body.nutrition } : {}),
      ...('quantityPercent' in request.body
        ? { quantityPercent: clampPercent(request.body.quantityPercent ?? existing.quantityPercent) }
        : {}),
      ...('expiryPercent' in request.body
        ? { expiryPercent: request.body.expiryPercent === undefined ? undefined : clampPercent(request.body.expiryPercent) }
        : {}),
      ...('expiresAt' in request.body ? { expiresAt: request.body.expiresAt?.trim() || undefined } : {}),
      updatedAt: nowIso()
    }

    products.set(request.params.id, next)
    return next
  })

  app.delete<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    if (!products.delete(request.params.id)) {
      return reply.status(404).send({ message: 'Product not found.' })
    }

    return reply.status(204).send()
  })
}
