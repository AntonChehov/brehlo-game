<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGame } from '../composables/useGame'
import type { Outcome } from '../game/types'

type Reason<T extends Outcome['type']> = Extract<Outcome, { type: T; reason: string }>['reason']

const game = useGame()
const { state } = game

const wordShown = ref(false)

const brehloName = computed(() =>
  state.round?.brehloIndex != null ? game.playerName(state.round.brehloIndex) : '',
)
const accusedName = computed(() =>
  state.accusation?.type === 'player' ? game.playerName(state.accusation.index) : '',
)

const brehloWinsText = computed<Record<Reason<'brehloWins'>, string>>(() => ({
  guessedWord: `${brehloName.value} раскусили, но слово угадано.`,
  wrongAccused: `${accusedName.value} — не брехло. Настоящее брехло — ${brehloName.value}.`,
  nobodyAccused: `Брехло было: ${brehloName.value}.`,
}))

const playersWinText = computed<Record<Reason<'playersWin'>, string>>(() => ({
  caught: `${brehloName.value} так и не угадал(а) слово.`,
  spottedNoBrehlo: 'Брехла в этом раунде не было — и вы это поняли!',
}))

const verdict = computed(() => {
  const outcome = state.outcome
  if (!outcome || outcome.type === 'caught') return null
  switch (outcome.type) {
    case 'brehloWins':
      return {
        tone: 'danger',
        emoji: '🤥',
        title: 'Брехло победило!',
        text: brehloWinsText.value[outcome.reason],
      }
    case 'playersWin':
      return {
        tone: 'success',
        emoji: '🎉',
        title: 'Брехло разоблачено!',
        text: playersWinText.value[outcome.reason],
      }
    case 'everyoneLoses':
      return {
        tone: 'neutral',
        emoji: '🙈',
        title: 'Брехла не было!',
        text: `Слово знали все, а ${accusedName.value} пострадал(а) зря.`,
      }
    case 'allBrehlo':
      return {
        tone: 'neutral',
        emoji: '🤡',
        title: 'Брехлами были все!',
        text: 'Слова не знал никто — вы просто врали друг другу.',
      }
  }
  return null
})
</script>

<template>
  <section v-if="state.round && state.outcome" class="screen">
    <template v-if="state.outcome.type === 'caught'">
      <div class="screen__centered">
        <p class="emoji" aria-hidden="true">🕵️</p>
        <h2 class="title">{{ brehloName }} — брехло!</h2>
        <p class="muted">Последний шанс: пусть брехло назовёт слово вслух.</p>
        <div v-if="wordShown" class="word card">
          <span class="muted">Загаданное слово</span>
          <strong>{{ state.round.word }}</strong>
        </div>
      </div>
      <div class="screen__actions">
        <button v-if="!wordShown" class="btn btn--primary btn--block" type="button" @click="wordShown = true">
          Назвал(а) — показать слово
        </button>
        <template v-else>
          <button class="btn btn--danger btn--block" type="button" @click="game.brehloGuessed(true)">Угадал(а)</button>
          <button class="btn btn--block" type="button" @click="game.brehloGuessed(false)">Не угадал(а)</button>
        </template>
      </div>
    </template>

    <template v-else-if="verdict">
      <div class="screen__centered">
        <p class="emoji" aria-hidden="true">{{ verdict.emoji }}</p>
        <h2 class="title" :class="`title--${verdict.tone}`">{{ verdict.title }}</h2>
        <p class="muted">{{ verdict.text }}</p>
        <div v-if="state.round.kind !== 'allBrehlo'" class="word card">
          <span class="muted">{{ game.categoryOf(state.round) }}</span>
          <strong>{{ state.round.word }}</strong>
        </div>
      </div>
      <div class="screen__actions">
        <button class="btn btn--primary btn--block" type="button" @click="game.nextRound">Следующий раунд</button>
        <button class="btn btn--ghost btn--block" type="button" @click="game.toMenu">В меню</button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.emoji {
  font-size: 4.5rem;
  animation: pop 0.4s cubic-bezier(0.2, 1.6, 0.4, 1);
}

.title {
  font-size: 2rem;
  font-weight: 900;
}

.title--success {
  color: var(--success);
}

.title--danger {
  color: var(--danger);
}

.word {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;
  margin-top: 8px;
}

.word strong {
  font-size: 1.8rem;
}

@keyframes pop {
  from {
    transform: scale(0.3);
    opacity: 0;
  }
}
</style>
