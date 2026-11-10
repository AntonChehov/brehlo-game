import { computed, reactive, readonly, watch } from 'vue'
import { PACKS, packById } from '../data/packs'
import {
  cardFor,
  createRound,
  dealOrder,
  MAX_PLAYERS,
  MIN_PLAYERS,
  resolveAccusation,
  resolveGuess,
  wordKey,
} from '../game/engine'
import type { Accusation, Card, Outcome, Round, Settings } from '../game/types'

export type Screen = 'setup' | 'deal' | 'play' | 'vote' | 'result'

interface GameState {
  screen: Screen
  players: string[]
  settings: Settings
  /** Игрок однажды подтвердил, что ему есть 18. */
  adultConfirmed: boolean
  /** Ключи уже сыгранных слов, чтобы не повторяться между раундами и сессиями. */
  used: string[]
  round: Round | null
  /** Сколько игроков уже посмотрели карточку. */
  dealStep: number
  accusation: Accusation | null
  outcome: Outcome | null
}

const STORAGE_KEY = 'brehlo:v1'

const defaultState = (): GameState => ({
  screen: 'setup',
  players: ['', '', '', ''],
  settings: {
    packIds: PACKS.filter((p) => !p.adult).map((p) => p.id),
    hintForBrehlo: true,
    surpriseRounds: true,
  },
  adultConfirmed: false,
  used: [],
  round: null,
  dealStep: 0,
  accusation: null,
  outcome: null,
})

function load(): GameState {
  const fallback = defaultState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const saved = { ...fallback, ...(JSON.parse(raw) as Partial<GameState>) }
    saved.settings = { ...fallback.settings, ...saved.settings }
    saved.settings.packIds = saved.settings.packIds.filter((id) => {
      const pack = packById(id)
      return pack && (!pack.adult || saved.adultConfirmed)
    })
    // Игру посреди раунда восстанавливаем, но без незавершённой партии экран — настройки.
    if (!saved.round) saved.screen = 'setup'
    return saved
  } catch {
    return fallback
  }
}

const state = reactive<GameState>(load())

watch(
  state,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // Приватный режим или переполненное хранилище — игра работает и без сохранения.
    }
  },
  { deep: true },
)

const playerName = (index: number) => state.players[index]?.trim() || `Игрок ${index + 1}`

const selectedPacks = computed(() => PACKS.filter((p) => state.settings.packIds.includes(p.id)))

const canStart = computed(
  () =>
    state.players.length >= MIN_PLAYERS &&
    state.players.length <= MAX_PLAYERS &&
    selectedPacks.value.length > 0,
)

const order = computed(() => (state.round ? dealOrder(state.round, state.players.length) : []))

/** Игрок, которому сейчас нужно передать телефон. */
const currentDealPlayer = computed(() => order.value[state.dealStep] ?? null)

function cardOf(playerIndex: number): Card | null {
  const round = state.round
  if (!round) return null
  return cardFor(round, playerIndex, categoryOf(round), state.settings.hintForBrehlo)
}

function categoryOf(round: Round): string {
  const pack = packById(round.packId)
  return pack ? `${pack.emoji} ${pack.title}` : ''
}

function startRound() {
  const { round, reshuffled } = createRound({
    playerCount: state.players.length,
    packs: selectedPacks.value,
    surpriseRounds: state.settings.surpriseRounds,
    used: new Set(state.used),
    previous: state.round,
  })
  if (reshuffled) {
    const packIds = new Set(state.settings.packIds)
    state.used = state.used.filter((key) => !packIds.has(key.split(':')[0]!))
  }
  state.used.push(wordKey(round.packId, round.word))
  state.round = round
  state.dealStep = 0
  state.accusation = null
  state.outcome = null
  state.screen = 'deal'
}

export function useGame() {
  return {
    state: readonly(state),
    playerName,
    canStart,
    currentDealPlayer,
    cardOf,
    categoryOf,

    setPlayerName(index: number, name: string) {
      state.players[index] = name
    },
    addPlayer() {
      if (state.players.length < MAX_PLAYERS) state.players.push('')
    },
    removePlayer(index: number) {
      if (state.players.length > MIN_PLAYERS) state.players.splice(index, 1)
    },
    togglePack(id: string) {
      const ids = state.settings.packIds
      state.settings.packIds = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    },
    confirmAdult() {
      state.adultConfirmed = true
    },
    setSetting<K extends 'hintForBrehlo' | 'surpriseRounds'>(key: K, value: boolean) {
      state.settings[key] = value
    },

    startGame() {
      if (!canStart.value) return
      state.round = null
      startRound()
    },
    nextRound: startRound,
    cardSeen() {
      state.dealStep += 1
      if (state.dealStep >= state.players.length) state.screen = 'play'
    },
    goVote() {
      state.screen = 'vote'
    },
    backToPlay() {
      state.screen = 'play'
    },
    accuse(accusation: Accusation) {
      if (!state.round) return
      state.accusation = accusation
      state.outcome = resolveAccusation(state.round, accusation)
      state.screen = 'result'
    },
    brehloGuessed(guessed: boolean) {
      state.outcome = resolveGuess(guessed)
    },
    toMenu() {
      state.round = null
      state.outcome = null
      state.screen = 'setup'
    },
  }
}
