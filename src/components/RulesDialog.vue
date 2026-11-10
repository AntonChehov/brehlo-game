<script setup lang="ts">
import { onMounted, ref } from 'vue'

const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement>()

onMounted(() => {
  dialog.value?.showModal()
  // Фокус уходит на кнопку внизу и прокручивает окно — возвращаем к началу правил.
  dialog.value?.scrollTo({ top: 0 })
})
</script>

<template>
  <dialog ref="dialog" class="rules" aria-labelledby="rules-title" @cancel.prevent="emit('close')">
    <h2 id="rules-title">Как играть</h2>
    <ol>
      <li>
        Телефон идёт по кругу. Каждый тайком смотрит своё слово. У всех оно одинаковое, а у одного —
        <b>«БРЕХЛО»</b>: он слова не знает.
      </li>
      <li>
        Начиная с первого игрока, каждый называет <b>одну ассоциацию</b> к слову. Она должна быть понятна
        своим, но не выдавать слово брехлу. Брехло тоже говорит ассоциацию и делает вид, что всё знает.
      </li>
      <li>
        После круга обсудите, кто брехло. Если большинство готово — голосуйте. Если нет — ещё круг.
      </li>
      <li>
        Вычислили брехло? У него последний шанс — назвать слово. Угадал — брехло побеждает, не угадал —
        побеждают остальные. Обвинили невиновного — брехло побеждает сразу.
      </li>
      <li>Каждый следующий раунд начинает следующий игрок по часовой стрелке.</li>
    </ol>
    <p class="muted">
      <b>Раунды-сюрпризы:</b> изредка брехла нет вовсе — или брехлами оказываются все. Не спешите
      обвинять!
    </p>
    <button class="btn btn--primary btn--block" type="button" @click="emit('close')">Понятно</button>
  </dialog>
</template>

<style scoped>
.rules {
  width: min(440px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  overflow-y: auto;
  overscroll-behavior: contain;
  /* Прокрутка остаётся на маленьких экранах, но без полосы прокрутки. */
  scrollbar-width: none;
}

.rules::-webkit-scrollbar {
  display: none;
}

.rules::backdrop {
  background: rgb(0 0 0 / 0.65);
  backdrop-filter: blur(4px);
}

h2 {
  margin-bottom: 16px;
}

ol {
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  line-height: 1.45;
}

p {
  margin: 16px 0 20px;
}
</style>
