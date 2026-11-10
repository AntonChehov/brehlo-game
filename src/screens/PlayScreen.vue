<script setup lang="ts">
import { computed, ref } from 'vue'
import HandoffPrompt from '../components/HandoffPrompt.vue'
import SecretCard from '../components/SecretCard.vue'
import { useGame } from '../composables/useGame'

const game = useGame()
const { state } = game

/** board — основной экран; pick/handoff/card — напоминание слова одному игроку. */
const view = ref<'board' | 'pick' | 'handoff' | 'card'>('board')
const remindFor = ref<number | null>(null)

const order = computed(() => {
  const round = state.round
  if (!round) return []
  return state.players.map((_, i) => (round.starterIndex + i) % state.players.length)
})

const remindCard = computed(() => (remindFor.value === null ? null : game.cardOf(remindFor.value)))

function pick(player: number) {
  remindFor.value = player
  view.value = 'handoff'
}

function closeReminder() {
  remindFor.value = null
  view.value = 'board'
}
</script>

<template>
  <section v-if="state.round" class="screen">
    <p class="eyebrow center">Раунд {{ state.round.number }}</p>

    <template v-if="view === 'board'">
      <div class="screen__body">
        <div class="card center">
          <p class="muted">Ассоциации начинает</p>
          <p class="big-name">{{ game.playerName(state.round.starterIndex) }}</p>
          <p class="muted">и дальше по часовой стрелке</p>
        </div>

        <ol class="order" aria-label="Порядок хода">
          <li
            v-for="(player, i) in order"
            :key="player"
            class="order__item"
            :class="{ 'order__item--first': i === 0 }"
          >
            {{ game.playerName(player) }}
          </li>
        </ol>

        <p class="muted center small">
          Одна ассоциация на ход: понятная своим, бесполезная для брехла. После круга решите — голосовать
          или пройти ещё круг.
        </p>
      </div>

      <div class="screen__actions">
        <button class="btn btn--primary btn--block" type="button" @click="game.goVote">Голосуем</button>
        <button class="btn btn--block" type="button" @click="view = 'pick'">Напомнить слово</button>
      </div>
    </template>

    <template v-else-if="view === 'pick'">
      <div class="screen__body">
        <h2 class="center">Кому напомнить?</h2>
        <div class="names">
          <button
            v-for="(_, index) in state.players"
            :key="index"
            class="btn"
            type="button"
            @click="pick(index)"
          >
            {{ game.playerName(index) }}
          </button>
        </div>
      </div>
      <div class="screen__actions">
        <button class="btn btn--ghost btn--block" type="button" @click="closeReminder">Отмена</button>
      </div>
    </template>

    <HandoffPrompt
      v-else-if="view === 'handoff' && remindFor !== null"
      :name="game.playerName(remindFor)"
      @ready="view = 'card'"
    >
      <button class="btn btn--ghost btn--block" type="button" @click="closeReminder">Отмена</button>
    </HandoffPrompt>

    <template v-else-if="view === 'card' && remindFor !== null && remindCard">
      <div class="screen__centered">
        <p class="muted">{{ game.playerName(remindFor) }}, удерживайте карточку</p>
        <SecretCard :card="remindCard" />
      </div>
      <div class="screen__actions">
        <button class="btn btn--primary btn--block" type="button" @click="closeReminder">Вспомнил — вернуться к игре</button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.center {
  text-align: center;
}

.small {
  font-size: 0.875rem;
}

.order {
  list-style: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.order__item {
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 0.9rem;
}

.order__item + .order__item::before {
  content: '→ ';
  color: var(--muted);
}

.order__item--first {
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 700;
}

.names {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.names .btn {
  word-break: break-word;
}
</style>
