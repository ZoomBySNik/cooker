# Architecture blueprint (MVP+)

## Bounded contexts
- **Conversation**: Message, Intent, AssistantState
- **Inventory**: Product, expiry policies
- **Planning**: MealPlan, shopping list
- **Timeline**: Event orchestration + initiative

## Backend layers
1. `modules/*` — API route boundary.
2. `core/*` — deterministic domain rules (e.g., meal scoring).
3. `workers/*` — cron/event handlers; invokes LLM/Push adapters.

## Integration ports
- `LlmGateway` — only wording/recipes, not decision state.
- `PushGateway` — web push dispatch.

## Scheduler flow
1. Query active `TimelineEvent` where `triggerAt <= now` and `processed = false`.
2. For each event run worker.
3. Worker asks LLM for message text.
4. Persist assistant message + mark event processed + send push.

## Frontend composition targets
- `ChatView`
- `ProductsView`
- `ShoppingListView`
- `PlansView`

Current commit creates a thin shell for these screens and contracts.
