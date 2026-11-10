<script setup lang="ts">
import { ref } from 'vue'
import BaseDialog from './components/BaseDialog.vue'
import { useGame } from './composables/useGame'
import DealScreen from './screens/DealScreen.vue'
import PlayScreen from './screens/PlayScreen.vue'
import ResultScreen from './screens/ResultScreen.vue'
import SetupScreen from './screens/SetupScreen.vue'
import VoteScreen from './screens/VoteScreen.vue'

const game = useGame()
const { state } = game
const confirmExit = ref(false)

function exit() {
  confirmExit.value = false
  game.toMenu()
}
</script>

<template>
  <header v-if="state.screen !== 'setup'" class="topbar">
    <span class="topbar__logo">Брехло</span>
    <button class="btn btn--ghost topbar__exit" type="button" @click="confirmExit = true">Выйти</button>
  </header>

  <SetupScreen v-if="state.screen === 'setup'" />
  <DealScreen v-else-if="state.screen === 'deal'" />
  <PlayScreen v-else-if="state.screen === 'play'" />
  <VoteScreen v-else-if="state.screen === 'vote'" />
  <ResultScreen v-else-if="state.screen === 'result'" />

  <BaseDialog
    v-if="confirmExit"
    title="Выйти в меню?"
    confirm-label="Выйти"
    danger
    @confirm="exit"
    @cancel="confirmExit = false"
  >
    Текущий раунд закончится, игроки и настройки сохранятся.
  </BaseDialog>
</template>

<style scoped>
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.topbar__logo {
  font-weight: 900;
  color: var(--accent);
  font-size: 1.2rem;
}

.topbar__exit {
  min-height: 40px;
  padding: 0 12px;
}
</style>
