export type ProductCard = {
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

export type ProductPayload = {
  emoji: string
  name: string
  theme?: string
  quantityPercent: number
  expiryPercent?: number
  expiresAt?: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

const jsonHeaders = { 'Content-Type': 'application/json' }

export const fetchProducts = async (): Promise<ProductCard[]> => {
  const response = await fetch(`${apiBaseUrl}/products`)
  if (!response.ok) {
    throw new Error('Не удалось загрузить продукты')
  }

  const data = (await response.json()) as { items: ProductCard[] }
  return data.items
}

export const createProduct = async (payload: ProductPayload): Promise<void> => {
  const response = await fetch(`${apiBaseUrl}/products`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error('Не удалось сохранить продукт')
  }
}

export const updateProduct = async (id: string, payload: ProductPayload): Promise<void> => {
  const response = await fetch(`${apiBaseUrl}/products/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error('Не удалось обновить продукт')
  }
}

export const removeProduct = async (id: string): Promise<void> => {
  const response = await fetch(`${apiBaseUrl}/products/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw new Error('Не удалось удалить продукт')
  }
}
