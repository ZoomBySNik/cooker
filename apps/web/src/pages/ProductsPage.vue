<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  createProduct,
  enrichProduct,
  fetchProducts,
  removeProduct,
  updateProduct,
  type ProductCard,
  type ProductPayload,
  type ProductEnrichmentResult
} from '../api/products'

const emojiOptions = ['🍎', '🍌', '🥕', '🥔', '🥛', '🧀', '🍞', '🥩', '🐟', '🍗', '🥚', '🍅', '🥬', '🥦', '🫘']

const products = ref<ProductCard[]>([])
const isLoading = ref(false)
const isEnriching = ref(false)
const errorMessage = ref('')
const activeEditId = ref<string | null>(null)
const enrichmentInfo = ref<ProductEnrichmentResult | null>(null)

const form = ref<ProductPayload>({
  emoji: emojiOptions[0],
  name: '',
  quantityInput: '',
  theme: '',
  expiresAt: ''
})

const resetForm = () => {
  form.value = {
    emoji: emojiOptions[0],
    name: '',
    quantityInput: '',
    theme: '',
    expiresAt: ''
  }
  enrichmentInfo.value = null
  activeEditId.value = null
  errorMessage.value = ''
}

const loadProducts = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    products.value = await fetchProducts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Ошибка загрузки продуктов'
  } finally {
    isLoading.value = false
  }
}

const buildPayload = (): ProductPayload => ({
  emoji: form.value.emoji,
  name: form.value.name.trim(),
  quantityInput: form.value.quantityInput.trim(),
  ...(form.value.theme?.trim() ? { theme: form.value.theme.trim() } : {}),
  ...(form.value.expiresAt ? { expiresAt: new Date(form.value.expiresAt).toISOString() } : {})
})

const saveProduct = async () => {
  errorMessage.value = ''

  if (!form.value.name.trim() || !form.value.quantityInput.trim()) {
    errorMessage.value = 'Укажите продукт и количество в свободном формате (например, 750 г или 2 пачки)'
    return
  }

  const payload = buildPayload()

  try {
    isEnriching.value = true
    const enrichment = await enrichProduct({
      name: payload.name,
      quantityInput: payload.quantityInput,
      expiresAt: payload.expiresAt
    })
    enrichmentInfo.value = enrichment

    const enrichedPayload: ProductPayload = {
      ...payload,
      theme: payload.theme || enrichment.theme,
      quantityPercent: enrichment.quantityPercent,
      expiryPercent: enrichment.expiryPercent,
      expiresAt: enrichment.expiresAt ?? payload.expiresAt
    }

    if (activeEditId.value) {
      await updateProduct(activeEditId.value, enrichedPayload)
    } else {
      await createProduct(enrichedPayload)
    }

    await loadProducts()
    resetForm()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Ошибка сохранения продукта'
  } finally {
    isEnriching.value = false
  }
}

const startEdit = (product: ProductCard) => {
  activeEditId.value = product.id
  form.value = {
    emoji: product.emoji,
    name: product.name,
    quantityInput: `${product.quantityPercent}% от дневной нормы`,
    theme: product.theme ?? '',
    expiresAt: product.expiresAt ? product.expiresAt.slice(0, 10) : ''
  }
  enrichmentInfo.value = null
}

const deleteProduct = async (id: string) => {
  errorMessage.value = ''

  try {
    await removeProduct(id)
    if (activeEditId.value === id) {
      resetForm()
    }
    await loadProducts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Ошибка удаления продукта'
  }
}

const expiryLabel = (product: ProductCard): string => {
  if (product.expiresAt) {
    return `Годен до ${new Date(product.expiresAt).toLocaleDateString('ru-RU')}`
  }

  return 'Срок годности не задан'
}

const enrichmentHint = computed(() => {
  if (!enrichmentInfo.value) {
    return ''
  }

  const n = enrichmentInfo.value.nutrition
  const expiryText = enrichmentInfo.value.expiresAt
    ? `авто-срок до ${new Date(enrichmentInfo.value.expiresAt).toLocaleDateString('ru-RU')}`
    : 'авто-срок не удалось вычислить'

  return `КБЖУ (на 100 г): ${Math.round(n.kcalPer100g)} ккал / Б ${n.proteinPer100g.toFixed(1)} / Ж ${n.fatPer100g.toFixed(1)} / У ${n.carbsPer100g.toFixed(1)}. ${expiryText}.`
})

onMounted(() => {
  void loadProducts()
})
</script>

<template>
  <section class="page-card">
    <h2>Продукты</h2>
    <p class="subtitle">Добавляйте продукт + количество, остальное рассчитывается автоматически</p>
    <p class="intro">
      Форма отправляет запрос во внешние источники: получает КБЖУ и категорию продукта, пересчитывает количество в
      относительный объём для 1 человека и, если дата не указана, пробует рассчитать срок годности по условиям хранения.
    </p>

    <form class="product-form" @submit.prevent="saveProduct">
      <div class="field-grid">
        <label>
          Эмодзи продукта
          <select v-model="form.emoji">
            <option v-for="emoji in emojiOptions" :key="emoji" :value="emoji">{{ emoji }}</option>
          </select>
        </label>

        <label>
          Продукт
          <input v-model="form.name" type="text" placeholder="Например, Греческий йогурт" required />
        </label>

        <label>
          Количество (свободный формат)
          <input v-model="form.quantityInput" type="text" placeholder="например, 1.2 кг / 2 упаковки / 750 мл" required />
        </label>

        <label>
          Тематика (необязательно)
          <input v-model="form.theme" type="text" placeholder="Оставьте пустым для автоопределения" />
        </label>

        <label>
          Годен до (опционально)
          <input v-model="form.expiresAt" type="date" />
        </label>
      </div>

      <div class="form-actions">
        <button type="submit" class="primary-btn" :disabled="isEnriching">
          {{ isEnriching ? 'Ищем КБЖУ и хранение…' : activeEditId ? 'Обновить продукт' : 'Добавить продукт' }}
        </button>
        <button v-if="activeEditId" type="button" class="secondary-btn" @click="resetForm">Отменить</button>
      </div>

      <p v-if="enrichmentHint" class="hint-text">{{ enrichmentHint }}</p>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    </form>

    <p v-if="isLoading" class="status-text">Загрузка продуктов...</p>
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
            <span>Обеспеченность 1 человека</span>
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

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.product-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.85rem;
  background: #f8fafc;
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
  font-size: 0.88rem;
  color: #0f172a;
}

input,
select,
button {
  font: inherit;
}

input,
select {
  border: 1px solid #94a3b8;
  border-radius: 0.55rem;
  padding: 0.5rem 0.6rem;
}

.form-actions,
.card-actions {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

button {
  border: none;
  border-radius: 0.55rem;
  padding: 0.5rem 0.8rem;
  cursor: pointer;
}

.primary-btn {
  background: #2563eb;
  color: #fff;
}

.primary-btn:disabled {
  opacity: 0.75;
  cursor: wait;
}

.secondary-btn {
  background: #e2e8f0;
  color: #1e293b;
}

.danger-btn {
  background: #dc2626;
  color: #fff;
}

.product-header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.product-header h3 {
  margin: 0;
  font-size: 1rem;
}

.product-theme {
  margin: 0.15rem 0 0;
  color: #475569;
  font-size: 0.84rem;
}

.emoji {
  font-size: 1.6rem;
}

.metric {
  margin-top: 0.65rem;
}

.metric-title {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #1e293b;
}

progress {
  width: 100%;
  height: 0.75rem;
}

.expiry-date {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  color: #475569;
}

.status-text {
  color: #334155;
  font-size: 0.92rem;
}

.error-text {
  color: #b91c1c;
  margin-top: 0.6rem;
}

.hint-text {
  color: #0f172a;
  margin-top: 0.6rem;
  background: #dbeafe;
  border-radius: 0.5rem;
  padding: 0.5rem;
  font-size: 0.85rem;
}
</style>
