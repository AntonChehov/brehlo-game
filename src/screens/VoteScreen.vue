<script setup lang="ts">
import { ref } from 'vue'
import { useGame } from '../composables/useGame'
import type { Accusation } from '../game/types'

const game = useGame()
const { state } = game

const NOBODY = -1
const choice = ref<number | null>(null)

function reveal() {
  if (choice.value === null) return
  const accusation: Accusation = choice.value === NOBODY ? { type: 'nobody' } : { type: 'player', index: choice.value }
  game.accuse(accusation)
}
</script>

<template>
  <section class="screen">
    <header class="center">
      <p class="eyebrow">Голосование</p>
      <h2 class="title">Кого выбрало большинство?</h2>
      <p class="muted">Проголосуйте вслух или поднятием рук, затем отметьте результат</p>
    </header>

    <div class="screen__body">
      <div class="options" role="radiogroup" aria-label="Подозреваемый">
        <label v-for="(_, index) in state.players" :key="index" class="option" :class="{ 'option--on': choice === index }">
          <input v-model="choice" class="visually-hidden" type="radio" name="suspect" :value="index" />
          {{ game.playerName(index) }}
        </label>
        <label v-if="state.settings.surpriseRounds" class="option option--wide" :class="{ 'option--on': choice === NOBODY }">
          <input v-model="choice" class="visually-hidden" type="radio" name="suspect" :value="NOBODY" />
          🤔 Брехла нет
        </label>
      </div>
    </div>

    <div class="screen__actions">
      <button class="btn btn--primary btn--block" type="button" :disabled="choice === null" @click="reveal">
        Вскрываемся!
      </button>
      <button class="btn btn--ghost btn--block" type="button" @click="game.backToPlay">Не готовы — ещё круг</button>
    </div>
  </section>
</template>

<style scoped>
.center {
  text-align: center;
}

.title {
  font-size: 1.6rem;
  margin: 6px 0;
}

.options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.option {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 64px;
  padding: 8px 12px;
  border: 2px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  font-weight: 700;
  text-align: center;
  word-break: break-word;
  cursor: pointer;
}

.option:has(:focus-visible) {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.option--wide {
  grid-column: 1 / -1;
}

.option--on {
  border-color: var(--danger);
  background: color-mix(in srgb, var(--danger) 16%, var(--surface));
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
