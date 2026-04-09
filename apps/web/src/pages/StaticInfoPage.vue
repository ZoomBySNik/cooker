<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FeatureOverviewPage from './FeatureOverviewPage.vue'
import { pageInfos } from './page-content'

const route = useRoute()

const page = computed(() => {
  const key = String(route.name)
  if (key in pageInfos) {
    return pageInfos[key as keyof typeof pageInfos]
  }

  return pageInfos.dashboard
})
</script>

<template>
  <FeatureOverviewPage :page="page" />
</template>
