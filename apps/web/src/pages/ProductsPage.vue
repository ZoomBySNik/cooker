<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createProduct, fetchProducts, removeProduct, updateProduct, type ProductCard, type ProductPayload } from '../api/products'

const emojiOptions = ['🍎', '🍌', '🥕', '🥔', '🥛', '🧀', '🍞', '🥩', '🐟', '🍗', '🥚', '🍅', '🥬', '🥦', '🫘']

const products = ref<ProductCard[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
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
  errorMessage.value = ''
}

const toPayload = (): ProductPayload => ({
  emoji: form.value.emoji,
  name: form.value.name.trim(),
  quantityPercent: form.value.quantityPercent,
  ...(form.value.theme?.trim() ? { theme: form.value.theme.trim() } : {}),
  ...(form.value.expiryPercent === undefined ? {} : { expiryPercent: form.value.expiryPercent }),
  ...(form.value.expiresAt ? { expiresAt: new Date(form.value.expiresAt).toISOString() } : {})
})

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

const saveProduct = async () => {
  errorMessage.value = ''

  if (!form.value.name.trim()) {
    errorMessage.value = 'Укажите название продукта'
    return
  }

  const payload = toPayload()

  try {
    if (activeEditId.value) {
      await updateProduct(activeEditId.value, payload)
    } else {
      await createProduct(payload)
    }

    await loadProducts()
    resetForm()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Ошибка сохранения продукта'
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

onMounted(() => {
  void loadProducts()
})
</script>

<template>
  <section class="page-card">
    <h2>Продукты</h2>
    <p class="subtitle">Учет запасов и сроков годности без сложной математики</p>
    <p class="intro">
      Добавляйте, обновляйте и удаляйте карточки продуктов. Количество и срок годности отображаются прогресс-барами.
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
</style>
