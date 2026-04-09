import type { LlmGateway, PushGateway, TimelineEvent } from '@cooker/shared'

export type TimelineWorkerDeps = {
  llm: LlmGateway
  push: PushGateway
}

export const processEvent = async (
  deps: TimelineWorkerDeps,
  event: TimelineEvent,
  userId: string
) => {
  const text = await deps.llm.generateAssistantMessage({
    event: event.type,
    mood: { clinginess: 0.6, strictness: 0.3, energy: 0.8 },
    productName: String(event.payload.productName ?? '') || undefined
  })

  await deps.push.send(userId, 'Cooker', text)

  return {
    messageText: text,
    processed: true
  }
}
