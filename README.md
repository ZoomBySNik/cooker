# Cooker Monorepo (MVP+ skeleton)

Монорепозиторий для продукта-помощника по готовке с диалоговым интерфейсом.

## Стек
- **Frontend:** Vue 3 + Vite + TypeScript (SPA)
- **Backend:** Node.js + Fastify + TypeScript
- **Shared package:** общие типы домена
- **Infra:** Cron/Scheduler, LLM API, Push Service (закладывается контрактами)

## Структура

```text
apps/
  web/        # Vue SPA: chat, products, shopping, plans
  api/        # Backend API + timeline/event processing
packages/
  shared/     # Общие доменные типы и контракты
```

## Доменные цели, уже заложенные в архитектуру
- чат + intents;
- события/таймлайн + авто-инициатива;
- продукты + приближённые сроки годности;
- генерация блюд через LLM (без принятия решений моделью);
- shopping list;
- состояние “настроения” ассистента;
- push-уведомления через backend adapter.

## Быстрый старт

```bash
npm install
npm run dev:web
npm run dev:api
```

## Ключевые принципы
1. **Бизнес-решения в backend rules**, LLM только формулирует текст/рецепт.
2. **Слабая связность через порты/адаптеры:** LLM, Push, Scheduler.
3. **Event-driven для инициативы:** `Event` -> Worker/Cron -> Message + Push.
4. **Общие типы домена в `@cooker/shared`** для согласованности web/api.
