<script setup lang="ts">
import { ref } from 'vue'
import type { Card } from '../game/types'

defineProps<{ card: Card }>()
const emit = defineEmits<{ peek: [] }>()

const holding = ref(false)

function press() {
  holding.value = true
  emit('peek')
  navigator.vibrate?.(15)
}

function release() {
  holding.value = false
}
</script>

<template>
  <button
    class="secret"
    :class="{ 'secret--open': holding, 'secret--brehlo': holding && card.type === 'brehlo' }"
    type="button"
    aria-live="polite"
    @pointerdown.prevent="press"
    @pointerup="release"
    @pointerleave="release"
    @pointercancel="release"
    @keydown.space.prevent="press"
    @keyup.space="release"
    @contextmenu.prevent
  >
    <template v-if="!holding">
      <span class="secret__icon" aria-hidden="true">👆</span>
      <span class="secret__label">Нажмите и держите</span>
    </template>
    <template v-else-if="card.type === 'word'">
      <span class="secret__category">{{ card.category }}</span>
      <span class="secret__word">{{ card.word }}</span>
    </template>
    <template v-else>
      <span class="secret__word">БРЕХЛО</span>
      <span v-if="card.category" class="secret__category">Категория: {{ card.category }}</span>
      <span v-else class="secret__category">Слово вам неизвестно — выкручивайтесь!</span>
    </template>
  </button>
</template>

<style scoped>
.secret {
  width: 100%;
  aspect-ratio: 3 / 4;
  max-height: 55dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  border: 2px dashed var(--border);
  border-radius: 28px;
  background: var(--surface);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: none;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.secret--open {
  border-style: solid;
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, var(--surface));
}

.secret--brehlo {
  border-color: var(--danger);
  background: color-mix(in srgb, var(--danger) 18%, var(--surface));
}

.secret__icon {
  font-size: 3rem;
}

.secret__label {
  color: var(--muted);
  font-weight: 600;
}

.secret__word {
  font-size: clamp(2rem, 11vw, 3rem);
  font-weight: 900;
  line-height: 1.1;
  word-break: break-word;
}

.secret__category {
  color: var(--muted);
  font-weight: 600;
}
</style>
