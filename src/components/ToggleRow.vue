<script setup lang="ts">
defineProps<{ label: string; hint?: string }>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="toggle">
    <span class="toggle__text">
      <span class="toggle__label">{{ label }}</span>
      <span v-if="hint" class="toggle__hint">{{ hint }}</span>
    </span>
    <input v-model="model" class="toggle__input" type="checkbox" role="switch" />
  </label>
</template>

<style scoped>
.toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  cursor: pointer;
}

.toggle + .toggle {
  border-top: 1px solid var(--border);
}

.toggle__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle__label {
  font-weight: 600;
}

.toggle__hint {
  color: var(--muted);
  font-size: 0.875rem;
}

.toggle__input {
  appearance: none;
  flex-shrink: 0;
  width: 52px;
  height: 32px;
  border-radius: 16px;
  background: var(--border);
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle__input::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--text);
  transition: transform 0.2s;
}

.toggle__input:checked {
  background: var(--accent);
}

.toggle__input:checked::after {
  transform: translateX(20px);
  background: var(--accent-text);
}
</style>
