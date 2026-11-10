<script setup lang="ts">
defineProps<{ name: string }>()
const emit = defineEmits<{ ready: [] }>()
</script>

<template>
  <div class="screen__centered">
    <p class="icon" aria-hidden="true">📱</p>
    <p class="muted">Передайте телефон</p>
    <p class="big-name">{{ name }}</p>
    <p class="muted">Убедитесь, что экран никто не видит</p>
  </div>
  <div class="screen__actions">
    <slot />
    <button class="btn btn--primary btn--block" type="button" @click="emit('ready')">Я {{ name }}, показать</button>
  </div>
</template>

<style scoped>
.icon {
  font-size: 4rem;
}
</style>
