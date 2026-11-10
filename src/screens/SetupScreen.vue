<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import BaseDialog from '../components/BaseDialog.vue'
import RulesDialog from '../components/RulesDialog.vue'
import ToggleRow from '../components/ToggleRow.vue'
import { useGame } from '../composables/useGame'
import { PACKS } from '../data/packs'
import { MAX_PLAYERS, MIN_PLAYERS } from '../game/engine'
import type { WordPack } from '../game/types'

const game = useGame()
const { state } = game

const showAgeGate = ref(false)
const showRules = ref(false)
const list = ref<HTMLOListElement>()

const hint = computed({
  get: () => state.settings.hintForBrehlo,
  set: (value) => game.setSetting('hintForBrehlo', value),
})
const surprises = computed({
  get: () => state.settings.surpriseRounds,
  set: (value) => game.setSetting('surpriseRounds', value),
})

const isSelected = (pack: WordPack) => state.settings.packIds.includes(pack.id)

function onPackClick(pack: WordPack) {
  if (pack.adult && !isSelected(pack) && !state.adultConfirmed) {
    showAgeGate.value = true
    return
  }
  game.togglePack(pack.id)
}

function confirmAge() {
  game.confirmAdult()
  game.togglePack('adult')
  showAgeGate.value = false
}

async function addPlayer() {
  game.addPlayer()
  await nextTick()
  list.value?.querySelector<HTMLInputElement>('li:last-child input')?.focus()
}

const startHint = computed(() => {
  if (state.settings.packIds.length === 0) return 'Выберите хотя бы одну категорию'
  return ''
})
</script>

<template>
  <section class="screen">
    <header class="hero">
      <h1 class="hero__title">Брехло</h1>
      <p class="muted">Игра для компании на одном телефоне — без ведущего</p>
      <button class="btn btn--ghost hero__rules" type="button" @click="showRules = true">
        Как играть?
      </button>
    </header>

    <div class="screen__body">
      <section class="card">
        <div class="section-head">
          <h2>Игроки</h2>
          <span class="muted">{{ state.players.length }} / {{ MAX_PLAYERS }}</span>
        </div>
        <p class="muted small">Впишите по кругу, по часовой стрелке — в этом порядке будет идти ход.</p>
        <ol ref="list" class="players">
          <li v-for="(name, index) in state.players" :key="index" class="players__row">
            <span class="players__num">{{ index + 1 }}</span>
            <input
              class="players__input"
              :value="name"
              :placeholder="`Игрок ${index + 1}`"
              :aria-label="`Имя игрока ${index + 1}`"
              maxlength="20"
              autocomplete="off"
              enterkeyhint="next"
              @input="game.setPlayerName(index, ($event.target as HTMLInputElement).value)"
            />
            <button
              class="btn btn--icon"
              type="button"
              :disabled="state.players.length <= MIN_PLAYERS"
              :aria-label="`Удалить игрока ${index + 1}`"
              @click="game.removePlayer(index)"
            >
              ✕
            </button>
          </li>
        </ol>
        <button
          class="btn btn--block"
          type="button"
          :disabled="state.players.length >= MAX_PLAYERS"
          @click="addPlayer"
        >
          + Добавить игрока
        </button>
      </section>

      <section class="card">
        <div class="section-head">
          <h2>Категории</h2>
          <span class="muted">можно несколько</span>
        </div>
        <div class="packs" role="group" aria-label="Категории слов">
          <button
            v-for="pack in PACKS"
            :key="pack.id"
            class="pack"
            :class="{ 'pack--on': isSelected(pack) }"
            type="button"
            :aria-pressed="isSelected(pack)"
            @click="onPackClick(pack)"
          >
            <span class="pack__emoji" aria-hidden="true">{{ pack.emoji }}</span>
            <span class="pack__title">{{ pack.title }}</span>
            <span class="pack__count">{{ pack.words.length }} слов</span>
          </button>
        </div>
      </section>

      <section class="card">
        <ToggleRow
          v-model="hint"
          label="Подсказка для брехла"
          hint="Брехло видит категорию загаданного слова"
        />
        <ToggleRow
          v-model="surprises"
          label="Раунды-сюрпризы"
          hint="Изредка брехла нет вовсе — или брехло все"
        />
      </section>
    </div>

    <div class="screen__actions sticky">
      <p v-if="startHint" class="muted small center">{{ startHint }}</p>
      <button class="btn btn--primary btn--block" type="button" :disabled="!game.canStart.value" @click="game.startGame">
        Начать игру
      </button>
    </div>

    <BaseDialog
      v-if="showAgeGate"
      title="Вам есть 18 лет?"
      confirm-label="Да, мне есть 18"
      cancel-label="Нет"
      @confirm="confirmAge"
      @cancel="showAgeGate = false"
    >
      Категория «18+» содержит слова на темы алкоголя, свиданий и интима. Выбирайте её, только если всем
      игрокам есть 18.
    </BaseDialog>

    <RulesDialog v-if="showRules" @close="showRules = false" />
  </section>
</template>

<style scoped>
.hero {
  text-align: center;
  padding-top: 12px;
}

.hero__title {
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--accent);
}

.hero__rules {
  min-height: 40px;
  margin-top: 4px;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.section-head h2 {
  font-size: 1.2rem;
}

.small {
  font-size: 0.875rem;
}

.center {
  text-align: center;
}

.players {
  list-style: none;
  padding: 0;
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.players__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.players__num {
  width: 24px;
  text-align: center;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.players__input {
  flex: 1;
  min-width: 0;
  height: 48px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg);
  font-size: 1rem;
}

.players__input::placeholder {
  color: var(--muted);
  opacity: 0.7;
}

.packs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 12px;
}

.pack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px;
  border: 2px solid var(--border);
  border-radius: 14px;
  background: var(--bg);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.pack--on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, var(--bg));
}

.pack__emoji {
  font-size: 1.6rem;
}

.pack__title {
  font-weight: 700;
}

.pack__count {
  color: var(--muted);
  font-size: 0.8rem;
}

.sticky {
  position: sticky;
  bottom: 0;
  padding: 12px 0 max(4px, env(safe-area-inset-bottom));
  background: linear-gradient(to top, var(--bg) 70%, transparent);
}
</style>
