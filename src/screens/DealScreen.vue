<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import HandoffPrompt from '../components/HandoffPrompt.vue'
import SecretCard from '../components/SecretCard.vue'
import { useGame } from '../composables/useGame'

const game = useGame()
const { state } = game

/** handoff — передать телефон; card — игрок смотрит карточку. */
const phase = ref<'handoff' | 'card'>('handoff')
const peeked = ref(false)

const player = computed(() => game.currentDealPlayer.value)
const card = computed(() => (player.value === null ? null : game.cardOf(player.value)))
const isLast = computed(() => state.dealStep === state.players.length - 1)
const nextName = computed(() => {
  const next = game.order.value[state.dealStep + 1]
  return next === undefined ? '' : game.playerName(next)
})

watch(
  () => state.dealStep,
  () => {
    phase.value = 'handoff'
    peeked.value = false
  },
)
</script>

<template>
  <section v-if="player !== null && card" :key="state.dealStep" class="screen">
    <p class="eyebrow center">Раунд {{ state.round?.number }} · карточка {{ state.dealStep + 1 }} из {{ state.players.length }}</p>

    <HandoffPrompt v-if="phase === 'handoff'" :name="game.playerName(player)" @ready="phase = 'card'" />

    <template v-else>
      <div class="screen__centered">
        <p class="muted">{{ game.playerName(player) }}, удерживайте карточку</p>
        <SecretCard :card="card" @peek="peeked = true" />
      </div>
      <div class="screen__actions">
        <button class="btn btn--primary btn--block" type="button" :disabled="!peeked" @click="game.cardSeen">
          {{ isLast ? 'Все посмотрели — играем!' : `Запомнил. Дальше — ${nextName}` }}
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.center {
  text-align: center;
}
</style>
