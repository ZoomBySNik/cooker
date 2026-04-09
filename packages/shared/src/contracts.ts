import type { AssistantMood, Product, TimelineEvent } from './domain'

export type MealCandidate = {
  name: string
  summary: string
  productsUsed: string[]
  missingProducts: string[]
  cookTimeMinutes: number
  simplicityScore: number
}

export type RecipeGenerationInput = {
  goal: 'cook'
  products: Product[]
  mood: AssistantMood
  userContext?: string
}

export type EventMessageInput = {
  event: TimelineEvent['type']
  productName?: string
  mood: AssistantMood
}

export interface LlmGateway {
  generateRecipe(input: RecipeGenerationInput): Promise<MealCandidate[]>
  generateAssistantMessage(input: EventMessageInput): Promise<string>
}

export interface PushGateway {
  send(userId: string, title: string, body: string): Promise<void>
}
