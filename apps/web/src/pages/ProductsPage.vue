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

const products = ref<ProductCard[]>([])
const isLoading = ref(false)
const isEnriching = ref(false)
const errorMessage = ref('')
const activeEditId = ref<string | null>(null)
const enrichmentInfo = ref<ProductEnrichmentResult | null>(null)

const form = ref<ProductPayload>({
  name: '',
  quantityInput: '',
  expiresAt: ''
})

const resetForm = () => {
  form.value = {
    name: '',
    quantityInput: '',
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
  name: form.value.name.trim(),
  quantityInput: form.value.quantityInput.trim(),
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
      theme: enrichment.theme,
      imageUrl: enrichment.imageUrl,
      nutrition: enrichment.nutrition,
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
    name: product.name,
    quantityInput: product.quantityInput ?? '',
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
  return `Open Food Facts: раздел "${enrichmentInfo.value.theme ?? 'Прочее'}", КБЖУ/100г — ${Math.round(n.kcalPer100g)} ккал, Б ${n.proteinPer100g.toFixed(1)}, Ж ${n.fatPer100g.toFixed(1)}, У ${n.carbsPer100g.toFixed(1)}.`
})

onMounted(() => {
  void loadProducts()
})
</script>

<template>
  <section class="page-card">
    <h2>Продукты</h2>
    <p class="subtitle">Вводите только продукт и количество, остальное подтягивается из Open Food Facts</p>

    <form class="product-form" @submit.prevent="saveProduct">
      <div class="field-grid">
        <label>
          Продукт
          <input v-model="form.name" type="text" placeholder="Например, Греческий йогурт" required />
        </label>

        <label>
          Количество (свободный формат)
          <input v-model="form.quantityInput" type="text" placeholder="например, 1.2 кг / 2 упаковки / 750 мл" required />
        </label>

        <label>
          Годен до (опционально)
          <input v-model="form.expiresAt" type="date" />
        </label>
      </div>

      <div class="form-actions">
        <button type="submit" class="primary-btn" :disabled="isEnriching">
          {{ isEnriching ? 'Ищем КБЖУ и изображение…' : activeEditId ? 'Обновить продукт' : 'Добавить продукт' }}
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
        <div class="media-wrap">
          <img v-if="product.imageUrl" class="product-image" :src="product.imageUrl" :alt="product.name" loading="lazy" />
          <div v-else class="emoji-fallback">{{ product.emoji }}</div>

          <div class="image-actions">
            <button type="button" class="icon-btn" title="Редактировать" @click="startEdit(product)">✏️</button>
            <button type="button" class="icon-btn danger" title="Удалить" @click="deleteProduct(product.id)">🗑️</button>
          </div>
        </div>

        <h3 class="product-name">{{ product.name }}</h3>
        <p class="product-section">{{ product.theme || 'Прочее' }}</p>

        <p class="kbju">
          {{ Math.round(product.nutrition?.kcalPer100g ?? 0) }} ккал · Б {{ (product.nutrition?.proteinPer100g ?? 0).toFixed(1) }} · Ж {{ (product.nutrition?.fatPer100g ?? 0).toFixed(1) }} · У {{ (product.nutrition?.carbsPer100g ?? 0).toFixed(1) }}
        </p>

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

.subtitle {
  margin: 0.35rem 0 0.75rem;
  color: #334155;
  font-weight: 600;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.product-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
  overflow: hidden;
  background: #f8fafc;
}

.media-wrap {
  position: relative;
  width: 100%;
  height: 180px;
  background: #e2e8f0;
}

.product-image,
.emoji-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.emoji-fallback {
  display: grid;
  place-items: center;
  font-size: 3rem;
  background: linear-gradient(180deg, #dbeafe, #bfdbfe);
}

.image-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.4rem;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.product-card:hover .image-actions {
  opacity: 1;
  transform: translateY(0);
}

.icon-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.6rem;
  background: rgb(255 255 255 / 92%);
  cursor: pointer;
}

.icon-btn.danger {
  background: rgb(254 226 226 / 95%);
}

.product-name {
  margin: 0.7rem 0.75rem 0;
  font-size: 1rem;
}

.product-section {
  margin: 0.3rem 0.75rem 0;
  color: #475569;
  font-size: 0.85rem;
}

.kbju {
  margin: 0.55rem 0.75rem 0;
  color: #334155;
  font-size: 0.82rem;
}

.metric {
  margin: 0.7rem 0.75rem 0;
}

.metric-title {
  display: flex;
  justify-content: space-between;
  font-size: 0.84rem;
}

progress {
  width: 100%;
  height: 0.72rem;
}

.expiry-date {
  margin: 0.35rem 0 0.8rem;
  font-size: 0.78rem;
  color: #475569;
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
}

input,
button {
  font: inherit;
}

input {
  border: 1px solid #94a3b8;
  border-radius: 0.55rem;
  padding: 0.5rem 0.6rem;
}

.form-actions {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.primary-btn,
.secondary-btn {
  border: none;
  border-radius: 0.55rem;
  padding: 0.5rem 0.8rem;
  cursor: pointer;
}

.primary-btn {
  background: #2563eb;
  color: #fff;
}

.secondary-btn {
  background: #e2e8f0;
}

.status-text,
.error-text,
.hint-text {
  margin-top: 0.6rem;
}

.error-text {
  color: #b91c1c;
}

.hint-text {
  color: #0f172a;
  background: #dbeafe;
  border-radius: 0.5rem;
  padding: 0.5rem;
  font-size: 0.85rem;
}
</style>
