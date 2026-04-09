<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

type Page = {
  id: string
  title: string
  subtitle: string
  intro: string
  sections: Array<{ heading: string; text: string }>
}

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

type ProductPayload = {
  emoji: string
  name: string
  theme?: string
  quantityPercent: number
  expiryPercent?: number
  expiresAt?: string
}

const emojiOptions = ['🍎', '🍌', '🥕', '🥔', '🥛', '🧀', '🍞', '🥩', '🐟', '🍗', '🥚', '🍅', '🥬', '🥦', '🫘']

const pages: Page[] = [
  {
    id: 'dashboard',
    title: 'Главная',
    subtitle: 'Быстрый обзор кухни и задач на день',
    intro:
      'Сводка по продуктам, покупкам и запланированным блюдам. Дизайн адаптивный: карточки перестраиваются от 1 до 3 колонок.',
    sections: [
      { heading: 'Сегодня в фокусе', text: 'Подсказки ассистента, быстрые действия и ближайшие напоминания.' },
      { heading: 'Статус продуктов', text: 'Приоритет по продуктам с коротким сроком годности и идеи блюд.' },
      { heading: 'План дня', text: 'Что готовить утром/днём/вечером, чтобы не тратить время на выбор.' }
    ]
  },
  {
    id: 'chat',
    title: 'Чат',
    subtitle: 'Диалоговый интерфейс для рецептов и планирования',
    intro:
      'Страница общения с ассистентом: запросы рецептов, уточнения по продуктам и автоматические follow-up рекомендации.',
    sections: [
      { heading: 'Быстрые intents', text: 'Кнопки «Что приготовить?», «Собери покупки», «План на 3 дня».' },
      { heading: 'Контекст ответов', text: 'Ассистент учитывает остатки, ограничения и активный режим дня.' },
      { heading: 'Карточки блюд', text: 'Результат в виде понятных карточек с ингредиентами и шагами.' }
    ]
  },
  {
    id: 'products',
    title: 'Продукты',
    subtitle: 'Учет запасов и сроков годности без сложной математики',
    intro: 'Добавляйте, обновляйте и удаляйте карточки продуктов. Количество и срок годности отображаются прогресс-барами.',
    sections: []
  },
  {
    id: 'shopping',
    title: 'Покупки',
    subtitle: 'Умный список недостающих ингредиентов',
    intro:
      'Список формируется автоматически при выборе рецептов и может редактироваться вручную в пару касаний.',
    sections: [
      { heading: 'Автодобавление', text: 'Недостающие позиции подтягиваются из выбранного меню.' },
      { heading: 'Группировка', text: 'Сортировка по отделам магазина для быстрого прохода.' },
      { heading: 'Совместный режим', text: 'Возможность делиться списком внутри семьи.' }
    ]
  },
  {
    id: 'timeline',
    title: 'Таймлайн',
    subtitle: 'Напоминания и проактивные предложения ассистента',
    intro:
      'Лента событий с напоминаниями о разморозке, проверке сроков и идеями на «ленивые» дни.',
    sections: [
      { heading: 'Напоминания', text: 'Время готовки, разморозки и контроль остатков.' },
      { heading: 'Инициатива', text: 'Ассистент предлагает варианты блюд в нужный момент.' },
      { heading: 'Push-готовность', text: 'События подготовлены для web push уведомлений в PWA.' }
    ]
  }
]

const initialHash = window.location.hash.replace('#', '')
const currentPageId = ref(pages.some((page) => page.id === initialHash) ? initialHash : pages[0].id)
const currentPage = computed(() => pages.find((page) => page.id === currentPageId.value) ?? pages[0])

const openPage = (id: string): void => {
  currentPageId.value = id
  window.history.replaceState(null, '', `#${id}`)
}

const updateFromHash = (): void => {
  const hash = window.location.hash.replace('#', '')
  if (pages.some((page) => page.id === hash)) {
    currentPageId.value = hash
  }
}

onMounted(() => {
  window.addEventListener('hashchange', updateFromHash)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', updateFromHash)
})

interface DeferredPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const installPrompt = ref<DeferredPromptEvent | null>(null)

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installPrompt.value = event as DeferredPromptEvent
  })
})

const requestInstall = async (): Promise<void> => {
  if (!installPrompt.value) {
    return
  }

  await installPrompt.value.prompt()
  await installPrompt.value.userChoice
  installPrompt.value = null
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
const products = ref<ProductCard[]>([])
const isLoadingProducts = ref(false)
const saveError = ref('')
const activeEditId = ref<string | null>(null)

const form = ref<ProductPayload>({
  emoji: emojiOptions[0],
  name: '',
  quantityPercent: 50,
  theme: '',
  expiryPercent: 50,
  expiresAt: ''
})

const resetForm = () => {
  form.value = {
    emoji: emojiOptions[0],
    name: '',
    quantityPercent: 50,
    theme: '',
    expiryPercent: 50,
    expiresAt: ''
  }
  activeEditId.value = null
  saveError.value = ''
}

const normalizePayload = (): ProductPayload => ({
  emoji: form.value.emoji,
  name: form.value.name.trim(),
  quantityPercent: form.value.quantityPercent,
  ...(form.value.theme?.trim() ? { theme: form.value.theme.trim() } : {}),
  ...(form.value.expiryPercent === undefined ? {} : { expiryPercent: form.value.expiryPercent }),
  ...(form.value.expiresAt ? { expiresAt: new Date(form.value.expiresAt).toISOString() } : {})
})

const fetchProducts = async (): Promise<void> => {
  isLoadingProducts.value = true

  try {
    const response = await fetch(`${apiBaseUrl}/products`)
    if (!response.ok) {
      throw new Error('Не удалось загрузить продукты')
    }

    const data = (await response.json()) as { items: ProductCard[] }
    products.value = data.items
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Ошибка загрузки продуктов'
  } finally {
    isLoadingProducts.value = false
  }
}

const saveProduct = async (): Promise<void> => {
  saveError.value = ''

  if (!form.value.name.trim()) {
    saveError.value = 'Укажите название продукта'
    return
  }

  const payload = normalizePayload()
  const method = activeEditId.value ? 'PATCH' : 'POST'
  const target = activeEditId.value ? `${apiBaseUrl}/products/${activeEditId.value}` : `${apiBaseUrl}/products`

  try {
    const response = await fetch(target, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error('Не удалось сохранить продукт')
    }

    await fetchProducts()
    resetForm()
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Ошибка сохранения продукта'
  }
}

const startEdit = (product: ProductCard) => {
  activeEditId.value = product.id
  form.value = {
    emoji: product.emoji,
    name: product.name,
    theme: product.theme ?? '',
    quantityPercent: product.quantityPercent,
    expiryPercent: product.expiryPercent,
    expiresAt: product.expiresAt ? product.expiresAt.slice(0, 10) : ''
  }
}

const deleteProduct = async (id: string): Promise<void> => {
  saveError.value = ''

  try {
    const response = await fetch(`${apiBaseUrl}/products/${id}`, { method: 'DELETE' })

    if (!response.ok) {
      throw new Error('Не удалось удалить продукт')
    }

    if (activeEditId.value === id) {
      resetForm()
    }

    await fetchProducts()
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Ошибка удаления продукта'
  }
}

const expiryLabel = (product: ProductCard): string => {
  if (product.expiresAt) {
    return `Годен до ${new Date(product.expiresAt).toLocaleDateString('ru-RU')}`
  }

  return 'Срок годности не задан'
}

onMounted(() => {
  void fetchProducts()
})
</script>

<template>
  <main class="app-shell">
    <header class="hero">
      <div>
        <p class="eyebrow">Cooker MVP+</p>
        <h1>Основные страницы продукта</h1>
        <p class="lead">SPA-структура с адаптивным интерфейсом и базовой PWA-поддержкой.</p>
      </div>

      <button v-if="installPrompt" class="install-btn" type="button" @click="requestInstall">
        Установить приложение
      </button>
    </header>

    <nav class="tabs" aria-label="Навигация по страницам">
      <button
        v-for="page in pages"
        :key="page.id"
        type="button"
        class="tab"
        :class="{ active: page.id === currentPageId }"
        @click="openPage(page.id)"
      >
        {{ page.title }}
      </button>
    </nav>

    <section class="page-card">
      <h2>{{ currentPage.title }}</h2>
      <p class="subtitle">{{ currentPage.subtitle }}</p>
      <p class="intro">{{ currentPage.intro }}</p>

      <template v-if="currentPage.id === 'products'">
        <form class="product-form" @submit.prevent="saveProduct">
          <div class="field-grid">
            <label>
              Эмодзи продукта
              <select v-model="form.emoji">
                <option v-for="emoji in emojiOptions" :key="emoji" :value="emoji">{{ emoji }}</option>
              </select>
            </label>

            <label>
              Наименование
              <input v-model="form.name" type="text" placeholder="Например, Огурцы" required />
            </label>

            <label>
              Тематика (опционально)
              <input v-model="form.theme" type="text" placeholder="Салат / Завтрак / Суп" />
            </label>

            <label>
              Количество: {{ form.quantityPercent }}%
              <input v-model.number="form.quantityPercent" type="range" min="0" max="100" step="5" />
            </label>

            <label>
              Годность: {{ form.expiryPercent ?? 0 }}%
              <input v-model.number="form.expiryPercent" type="range" min="0" max="100" step="5" />
            </label>

            <label>
              Годен до (опционально)
              <input v-model="form.expiresAt" type="date" />
            </label>
          </div>

          <div class="form-actions">
            <button type="submit" class="primary-btn">
              {{ activeEditId ? 'Обновить продукт' : 'Добавить продукт' }}
            </button>
            <button v-if="activeEditId" type="button" class="secondary-btn" @click="resetForm">Отменить</button>
          </div>

          <p v-if="saveError" class="error-text">{{ saveError }}</p>
        </form>

        <p v-if="isLoadingProducts" class="status-text">Загрузка продуктов...</p>
        <p v-else-if="products.length === 0" class="status-text">Список пуст — добавьте первый продукт.</p>

        <div v-else class="products-grid">
          <article v-for="product in products" :key="product.id" class="product-card">
            <header class="product-header">
              <div class="emoji">{{ product.emoji }}</div>
              <div>
                <h3>{{ product.name }}</h3>
                <p class="product-theme">{{ product.theme || 'Тематика не указана' }}</p>
              </div>
            </header>

            <div class="metric">
              <div class="metric-title">
                <span>Количество</span>
                <strong>{{ product.quantityPercent }}%</strong>
              </div>
              <progress :value="product.quantityPercent" max="100"></progress>
            </div>

            <div class="metric">
              <div class="metric-title">
                <span>Срок годности</span>
                <strong>{{ product.expiryPercent ?? 0 }}%</strong>
              </div>
              <progress :value="product.expiryPercent ?? 0" max="100"></progress>
              <p class="expiry-date">{{ expiryLabel(product) }}</p>
            </div>

            <div class="card-actions">
              <button type="button" class="secondary-btn" @click="startEdit(product)">Редактировать</button>
              <button type="button" class="danger-btn" @click="deleteProduct(product.id)">Удалить</button>
            </div>
          </article>
        </div>
      </template>

      <div v-else class="content-grid">
        <article v-for="block in currentPage.sections" :key="block.heading" class="feature-card">
          <h3>{{ block.heading }}</h3>
          <p>{{ block.text }}</p>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: Inter, system-ui, -apple-system, sans-serif;
  background: #f4f6fb;
  color: #1a202c;
}

.app-shell {
  margin: 0 auto;
  max-width: 1040px;
  min-height: 100dvh;
  padding: 1rem;
  box-sizing: border-box;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  background: linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%);
  color: #f8fafc;
  border-radius: 1rem;
  padding: 1rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
}

h1 {
  margin: 0.25rem 0;
  font-size: clamp(1.25rem, 3vw, 2rem);
}

.lead {
  margin: 0;
  max-width: 52ch;
}

.install-btn {
  border: 0;
  border-radius: 0.75rem;
  background: #f8fafc;
  color: #1e3a8a;
  font-weight: 700;
  padding: 0.65rem 1rem;
  cursor: pointer;
}

.tabs {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.tab {
  border: 1px solid #cbd5e1;
  border-radius: 0.75rem;
  background: #fff;
  min-height: 2.5rem;
  font-weight: 600;
  color: #1e293b;
}

.tab.active {
  border-color: #1d4ed8;
  color: #1d4ed8;
  box-shadow: 0 0 0 2px #dbeafe inset;
}

.page-card {
  margin-top: 1rem;
  background: #fff;
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 4px 28px rgb(15 23 42 / 8%);
}

.page-card h2 {
  margin: 0;
}

.subtitle {
  margin: 0.35rem 0 0;
  color: #334155;
  font-weight: 600;
}

.intro {
  color: #475569;
}

.content-grid,
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.feature-card,
.product-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.85rem;
  background: #f8fafc;
}

.feature-card h3 {
  margin: 0;
  font-size: 1rem;
}

.feature-card p {
  margin: 0.45rem 0 0;
  color: #334155;
}

.product-form {
  border: 1px solid #dbeafe;
  background: #eff6ff;
  border-radius: 0.85rem;
  padding: 0.85rem;
  margin-bottom: 1rem;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.7rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: #1f2937;
}

input,
select,
button {
  font: inherit;
}

input,
select {
  border: 1px solid #cbd5e1;
  border-radius: 0.55rem;
  padding: 0.45rem 0.6rem;
  background: #fff;
}

.form-actions,
.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.primary-btn,
.secondary-btn,
.danger-btn {
  border-radius: 0.65rem;
  border: 1px solid transparent;
  padding: 0.45rem 0.85rem;
  cursor: pointer;
}

.primary-btn {
  background: #1d4ed8;
  color: #fff;
}

.secondary-btn {
  border-color: #94a3b8;
  background: #fff;
  color: #1f2937;
}

.danger-btn {
  border-color: #dc2626;
  background: #fff5f5;
  color: #b91c1c;
}

.status-text,
.error-text {
  margin-top: 0.75rem;
}

.error-text {
  color: #b91c1c;
  font-weight: 600;
}

.product-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.emoji {
  font-size: 2rem;
  line-height: 1;
}

.product-header h3 {
  margin: 0;
}

.product-theme {
  margin: 0.25rem 0 0;
  color: #475569;
  font-size: 0.9rem;
}

.metric {
  margin-top: 0.7rem;
}

.metric-title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
}

progress {
  width: 100%;
  height: 0.7rem;
}

.expiry-date {
  margin: 0.35rem 0 0;
  color: #475569;
  font-size: 0.85rem;
}

@media (max-width: 640px) {
  .hero {
    flex-direction: column;
  }

  .install-btn {
    width: 100%;
  }
}
</style>
