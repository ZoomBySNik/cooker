<template>
  <main class="layout">
    <header>
      <h1>Cooker MVP+</h1>
      <p>Диалоговый ассистент, который помогает готовить без лишнего стресса.</p>
    </header>

    <section class="grid">
      <article class="card">
        <h2>Чат</h2>
        <p>Главный вход: сообщения, intents, карточки блюд, typing state.</p>
      </article>
      <article class="card">
        <h2>Продукты</h2>
        <p>Rough-учёт запасов и сроков без граммов и весов.</p>
      </article>
      <article class="card">
        <h2>Покупки</h2>
        <p>Недостающее добавляется автоматически при выборе блюда.</p>
      </article>
      <article class="card">
        <h2>Таймлайн</h2>
        <p>Reminders, expiring events и lazy-day инициативы.</p>
      </article>
    </section>
  </main>
</template>

<style scoped>
.layout {
  margin: 0 auto;
  max-width: 980px;
  padding: 2rem;
  font-family: Inter, system-ui, sans-serif;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.card {
  padding: 1rem;
  border: 1px solid #d0d7de;
  border-radius: 12px;
  background: #fff;
}
</style>
