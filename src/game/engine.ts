import type { Accusation, Card, Outcome, Rng, Round, RoundKind, WordPack } from './types'

export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 12
/** Вероятность каждого из раундов-сюрпризов. Вместе — примерно каждый десятый раунд. */
export const SURPRISE_CHANCE = 0.05

export const cryptoRng: Rng = () => {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0]! / 2 ** 32
}

export function randomInt(rng: Rng, max: number): number {
  return Math.floor(rng() * max)
}

export function wordKey(packId: string, word: string): string {
  return `${packId}:${word}`
}

export function pickRoundKind(rng: Rng, surpriseRounds: boolean, previous: RoundKind | null): RoundKind {
  // Два сюрприза подряд ломают ощущение «редкого» события.
  if (!surpriseRounds || (previous !== null && previous !== 'normal')) return 'normal'
  const roll = rng()
  if (roll < SURPRISE_CHANCE) return 'noBrehlo'
  if (roll < SURPRISE_CHANCE * 2) return 'allBrehlo'
  return 'normal'
}

export interface PickedWord {
  word: string
  packId: string
  /** Все слова выбранных наборов уже были — список использованных сброшен. */
  reshuffled: boolean
}

export function pickWord(packs: WordPack[], used: ReadonlySet<string>, rng: Rng): PickedWord {
  const all = packs.flatMap((pack) => pack.words.map((word) => ({ word, packId: pack.id })))
  if (all.length === 0) throw new Error('Не выбрано ни одного набора слов')
  const fresh = all.filter(({ word, packId }) => !used.has(wordKey(packId, word)))
  const pool = fresh.length > 0 ? fresh : all
  const picked = pool[randomInt(rng, pool.length)]!
  return { ...picked, reshuffled: fresh.length === 0 }
}

export interface CreateRoundInput {
  playerCount: number
  packs: WordPack[]
  surpriseRounds: boolean
  used: ReadonlySet<string>
  previous: Round | null
  rng?: Rng
}

export function createRound(input: CreateRoundInput): { round: Round; reshuffled: boolean } {
  const { playerCount, packs, surpriseRounds, used, previous, rng = cryptoRng } = input
  if (playerCount < MIN_PLAYERS) throw new Error(`Нужно минимум ${MIN_PLAYERS} игрока`)

  const kind = pickRoundKind(rng, surpriseRounds, previous?.kind ?? null)
  const { word, packId, reshuffled } = pickWord(packs, used, rng)
  // Первый раунд — случайный игрок, дальше ход переходит по часовой стрелке.
  const starterIndex = previous ? (previous.starterIndex + 1) % playerCount : randomInt(rng, playerCount)

  return {
    round: {
      number: (previous?.number ?? 0) + 1,
      kind,
      word,
      packId,
      brehloIndex: kind === 'normal' ? randomInt(rng, playerCount) : null,
      starterIndex,
    },
    reshuffled,
  }
}

/** Порядок раздачи карточек: по часовой стрелке, начиная с первого ходящего. */
export function dealOrder(round: Round, playerCount: number): number[] {
  return Array.from({ length: playerCount }, (_, i) => (round.starterIndex + i) % playerCount)
}

export function isBrehlo(round: Round, playerIndex: number): boolean {
  return round.kind === 'allBrehlo' || round.brehloIndex === playerIndex
}

export function cardFor(round: Round, playerIndex: number, category: string, hintForBrehlo: boolean): Card {
  if (isBrehlo(round, playerIndex)) return { type: 'brehlo', category: hintForBrehlo ? category : null }
  return { type: 'word', word: round.word, category }
}

export function resolveAccusation(round: Round, accusation: Accusation): Outcome {
  switch (round.kind) {
    case 'allBrehlo':
      return { type: 'allBrehlo' }
    case 'noBrehlo':
      return accusation.type === 'nobody'
        ? { type: 'playersWin', reason: 'spottedNoBrehlo' }
        : { type: 'everyoneLoses' }
    case 'normal':
      if (accusation.type === 'nobody') return { type: 'brehloWins', reason: 'nobodyAccused' }
      return accusation.index === round.brehloIndex
        ? { type: 'caught' }
        : { type: 'brehloWins', reason: 'wrongAccused' }
  }
}

export function resolveGuess(guessedWord: boolean): Outcome {
  return guessedWord ? { type: 'brehloWins', reason: 'guessedWord' } : { type: 'playersWin', reason: 'caught' }
}
