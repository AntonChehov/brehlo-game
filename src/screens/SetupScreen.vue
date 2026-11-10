<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import BaseDialog from '../components/BaseDialog.vue'
import InstallButton from '../components/InstallButton.vue'
import RulesDialog from '../components/RulesDialog.vue'
import ToggleRow from '../components/ToggleRow.vue'
import { useGame } from '../composables/useGame'
import { PACKS } from '../data/packs'
import { MAX_PLAYERS, MIN_PLAYERS } from '../game/engine'
import type { WordPack } from '../game/types'

const game = useGame()
const { state } = game

/** Настройка разбита на два шага, чтобы каждый помещался на экран телефона без прокрутки. */
const step = ref<'players' | 'options'>('players')
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
  <section v-if="step === 'players'" class="screen screen--fit">
    <header class="hero">
      <h1 class="hero__title">Брехло</h1>
      <p class="muted small hero__subtitle">Игра для компании на одном телефоне без ведущего</p>
      <div class="hero__links">
        <button class="btn btn--ghost hero__rules" type="button" @click="showRules = true">
          Как играть?
        </button>
        <InstallButton />
      </div>
    </header>

    <div class="screen__body">
      <section class="card players-card">
        <div class="section-head">
          <h2>Игроки</h2>
          <span class="muted">{{ state.players.length }} / {{ MAX_PLAYERS }}</span>
        </div>
        <p class="muted small players__hint">Впишите по часовой стрелке — в этом порядке пойдёт ход.</p>
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
          class="btn btn--block players__add"
          type="button"
          :disabled="state.players.length >= MAX_PLAYERS"
          @click="addPlayer"
        >
          + Добавить игрока
        </button>
      </section>
    </div>

    <div class="screen__actions">
      <button class="btn btn--primary btn--block" type="button" @click="step = 'options'">
        Дальше — категории
      </button>
    </div>
  </section>

  <section v-else class="screen screen--fit">
    <header class="step-head">
      <button class="btn btn--ghost step-head__back" type="button" @click="step = 'players'">← Игроки</button>
      <h2 class="step-head__title">Категории</h2>
    </header>

    <div class="screen__body">
      <section>
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
            <span class="pack__text">
              <span class="pack__title">{{ pack.title }}</span>
              <span class="pack__count">{{ pack.words.length }} слов</span>
            </span>
          </button>
        </div>
      </section>

      <section class="card options">
        <ToggleRow
          v-model="hint"
          label="Подсказка для брехла"
          hint="Брехло видит категорию слова"
        />
        <ToggleRow
          v-model="surprises"
          label="Раунды-сюрпризы"
          hint="Иногда брехла нет — или брехло все"
        />
      </section>
    </div>

    <div class="screen__actions">
      <p v-if="startHint" class="muted small center">{{ startHint }}</p>
      <button class="btn btn--primary btn--block" type="button" :disabled="!game.canStart.value" @click="game.startGame">
        Начать игру
      </button>
    </div>
  </section>

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
</template>

<style scoped>
.hero {
  text-align: center;
}

.hero__title {
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--accent);
}

.hero__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px 8px;
  margin-top: 4px;
}

.hero__rules {
  min-height: 40px;
  padding: 0 12px;
  font-size: 0.95rem;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.step-head {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}

.step-head__back {
  justify-self: start;
  min-height: 40px;
  padding: 0 8px;
  font-size: 0.95rem;
}

.step-head__title {
  font-size: 1.2rem;
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

/* Карточка сжимается под экран: при большом числе игроков прокручивается только список. */
.players-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.players {
  min-height: 0;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  height: 44px;
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

.players__add {
  flex-shrink: 0;
  min-height: 44px;
  font-size: 1rem;
}

.section-head + .small {
  margin-top: -4px;
}

.packs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.pack {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 56px;
  padding: 6px 10px;
  border: 2px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.pack--on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, var(--surface));
}

.pack__emoji {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.pack__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pack__title {
  overflow-wrap: break-word;
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.2;
}

.pack__count {
  color: var(--muted);
  font-size: 0.8rem;
}

.options {
  padding-block: 2px;
}

/* Узкие телефоны (320 px): уменьшаем плитки, чтобы названия не переносились посреди слова. */
@media (max-width: 340px) {
  .pack {
    gap: 6px;
    padding: 6px 8px;
  }

  .pack__emoji {
    font-size: 1.2rem;
  }

  .pack__title {
    font-size: 0.85rem;
  }
}

/* Невысокие экраны (браузер с панелями на обычном телефоне): ужимаем отступы. */
@media (max-height: 700px) {
  .screen--fit,
  .screen__body {
    gap: 12px;
  }
}

/* Совсем низкие (iPhone SE в браузере, альбомная ориентация): убираем второстепенный текст. */
@media (max-height: 600px) {
  .hero__subtitle,
  .players__hint,
  .options :deep(.toggle__hint) {
    display: none;
  }

  .hero__title {
    font-size: 1.9rem;
  }
}
</style>
