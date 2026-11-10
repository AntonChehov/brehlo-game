<script setup lang="ts">
import { ref, watch } from 'vue'
import { useInstall } from '../composables/useInstall'

const { platform, isStandalone, installed, promptInstall, resetInstalled } = useInstall()
const showHelp = ref(false)
const dialog = ref<HTMLDialogElement>()

async function onClick() {
  if (platform.value === 'prompt') {
    await promptInstall()
    return
  }
  showHelp.value = true
}

watch(showHelp, (open) => {
  if (open) requestAnimationFrame(() => dialog.value?.showModal())
})
</script>

<template>
  <div v-if="!isStandalone" class="install">
    <template v-if="installed">
      <p class="install__done">✓ Игра установлена — теперь её можно запускать без интернета</p>
      <button class="install__again" type="button" @click="resetInstalled">Удалили игру? Установить снова</button>
    </template>
    <button v-else class="btn install__btn" type="button" @click="onClick">📲 Установить игру</button>

    <dialog
      v-if="showHelp"
      ref="dialog"
      class="install__dialog"
      aria-labelledby="install-title"
      @cancel.prevent="showHelp = false"
    >
      <h2 id="install-title">Установка на телефон</h2>

      <ol v-if="platform === 'ios'">
        <li>Откройте игру в <b>Safari</b>.</li>
        <li>Нажмите <b>«Поделиться»</b> — квадрат со стрелкой вверх.</li>
        <li>Выберите <b>«На экран „Домой“»</b> и подтвердите.</li>
      </ol>
      <ol v-else-if="platform === 'manual'">
        <li>Откройте меню браузера (⋮ или ☰).</li>
        <li>Выберите <b>«Установить приложение»</b> или <b>«Добавить на главный экран»</b>.</li>
      </ol>
      <p v-else>
        Установка доступна только по защищённому адресу (https). Откройте игру по её публичной ссылке —
        и кнопка заработает.
      </p>

      <p class="muted">
        После установки игра открывается с иконки на экране, как обычное приложение, и работает без интернета.
      </p>
      <button class="btn btn--primary btn--block" type="button" @click="showHelp = false">Понятно</button>
    </dialog>
  </div>
</template>

<style scoped>
.install {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.install__btn {
  min-height: 40px;
  padding: 0 16px;
  font-size: 0.95rem;
}

.install__done {
  color: var(--success);
  font-weight: 600;
  font-size: 0.9rem;
  text-align: center;
}

.install__again {
  border: 0;
  background: none;
  color: var(--muted);
  font-size: 0.8rem;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  padding: 4px;
}

.install__dialog {
  width: min(400px, calc(100vw - 32px));
  margin: auto;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
}

.install__dialog::backdrop {
  background: rgb(0 0 0 / 0.65);
  backdrop-filter: blur(4px);
}

.install__dialog h2 {
  margin-bottom: 16px;
}

.install__dialog ol {
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  line-height: 1.45;
}

.install__dialog p {
  margin: 16px 0 20px;
}
</style>
