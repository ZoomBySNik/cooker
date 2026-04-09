export type ProductCategory = 'protein' | 'carb' | 'fat' | 'vegetable'
export type QuantityLevel = 'low' | 'medium' | 'high'

export type Product = {
  id: string
  name: string
  category: ProductCategory
  quantity: QuantityLevel
  createdAt: Date
  expiresAt: Date
}

export type MealPlan = {
  id: string
  name: string
  productsUsed: string[]
  createdAt: Date
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: Date
}

export type Intent = {
  id: string
  type: 'cook' | 'buy' | 'plan'
  payload: Record<string, unknown>
  deadline?: Date
  status: 'active' | 'done' | 'expired'
}

export type TimelineEvent = {
  id: string
  type: 'reminder' | 'product_expiring' | 'lazy_day'
  triggerAt: Date
  payload: Record<string, unknown>
  processed: boolean
}

export type AssistantMood = {
  clinginess: number
  strictness: number
  energy: number
}

export type AssistantState = {
  mood: AssistantMood
}
