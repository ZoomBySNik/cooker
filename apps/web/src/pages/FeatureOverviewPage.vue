<script setup lang="ts">
import type { PageInfo } from './page-content'

defineProps<{
  page: PageInfo
}>()
</script>

<template>
  <section class="page-card">
    <h2>{{ page.title }}</h2>
    <p class="subtitle">{{ page.subtitle }}</p>
    <p class="intro">{{ page.intro }}</p>

    <div class="content-grid">
      <article v-for="block in page.sections" :key="block.heading" class="feature-card">
        <h3>{{ block.heading }}</h3>
        <p>{{ block.text }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
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
</style>
