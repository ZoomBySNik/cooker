<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

type Page = {
  id: string
  title: string
  subtitle: string
  intro: string
  sections: Array<{ heading: string; text: string }>
}

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
    intro:
      'Каталог продуктов с простыми единицами, приоритетом на списание и быстрым добавлением в покупки.',
    sections: [
      { heading: 'Остатки', text: 'Форматы «есть / мало / почти закончилось» вместо граммов.' },
      { heading: 'Сроки', text: 'Маркировка «скоро испортится», чтобы минимизировать списания.' },
      { heading: 'Связь с блюдами', text: 'Рекомендации рецептов, где можно использовать текущие запасы.' }
    ]
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

      <div class="content-grid">
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

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.feature-card {
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

@media (max-width: 640px) {
  .hero {
    flex-direction: column;
  }

  .install-btn {
    width: 100%;
  }
}
</style>
