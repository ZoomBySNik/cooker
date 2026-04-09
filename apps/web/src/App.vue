<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { topNavItems } from './pages/page-content'

interface DeferredPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const route = useRoute()
const installPrompt = ref<DeferredPromptEvent | null>(null)

const captureInstallPrompt = (event: Event) => {
  event.preventDefault()
  installPrompt.value = event as DeferredPromptEvent
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', captureInstallPrompt)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
})

const requestInstall = async (): Promise<void> => {
  if (!installPrompt.value) {
    return
  }

  await installPrompt.value.prompt()
  await installPrompt.value.userChoice
  installPrompt.value = null
}

const isRouteActive = (to: string) => route.path === to
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
      <RouterLink
        v-for="item in topNavItems"
        :key="item.id"
        :to="item.to"
        class="tab"
        :class="{ active: isRouteActive(item.to) }"
      >
        {{ item.title }}
      </RouterLink>
    </nav>

    <RouterView />
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
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab.active {
  border-color: #1d4ed8;
  color: #1d4ed8;
  box-shadow: 0 0 0 2px #dbeafe inset;
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
