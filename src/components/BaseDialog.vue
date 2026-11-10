<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{
  title: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
}>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()
const dialog = ref<HTMLDialogElement>()

onMounted(() => dialog.value?.showModal())
</script>

<template>
  <dialog ref="dialog" class="dialog" @cancel.prevent="emit('cancel')">
    <h2 class="dialog__title">{{ title }}</h2>
    <div class="dialog__body"><slot /></div>
    <div class="dialog__actions">
      <button class="btn" type="button" @click="emit('cancel')">{{ cancelLabel ?? 'Отмена' }}</button>
      <button
        class="btn"
        :class="danger ? 'btn--danger' : 'btn--primary'"
        type="button"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(400px, calc(100vw - 32px));
  margin: auto;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
}

.dialog::backdrop {
  background: rgb(0 0 0 / 0.65);
  backdrop-filter: blur(4px);
}

.dialog__title {
  font-size: 1.35rem;
  margin-bottom: 12px;
}

.dialog__body {
  color: var(--muted);
  margin-bottom: 24px;
}

.dialog__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
