import { describe, expect, it } from 'vitest'
import {
  cardFor,
  createRound,
  dealOrder,
  pickRoundKind,
  pickWord,
  resolveAccusation,
  resolveGuess,
  SURPRISE_CHANCE,
  wordKey,
} from './engine'
import type { Round, WordPack } from './types'

const seq = (...values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]!
}

const packs: WordPack[] = [
  { id: 'a', title: 'A', emoji: '', words: ['кот', 'пёс'] },
  { id: 'b', title: 'B', emoji: '', words: ['баня'] },
]

const round = (patch: Partial<Round> = {}): Round => ({
  number: 1,
  kind: 'normal',
  word: 'кот',
  packId: 'a',
  brehloIndex: 1,
  starterIndex: 0,
  ...patch,
})

describe('pickRoundKind', () => {
  it('всегда обычный раунд без сюрпризов', () => {
    expect(pickRoundKind(() => 0, false, null)).toBe('normal')
  })

  it('выбирает сюрпризы по вероятности', () => {
    expect(pickRoundKind(() => 0, true, null)).toBe('noBrehlo')
    expect(pickRoundKind(() => SURPRISE_CHANCE + 0.001, true, 'normal')).toBe('allBrehlo')
    expect(pickRoundKind(() => 0.5, true, 'normal')).toBe('normal')
  })

  it('не делает два сюрприза подряд', () => {
    expect(pickRoundKind(() => 0, true, 'noBrehlo')).toBe('normal')
    expect(pickRoundKind(() => 0, true, 'allBrehlo')).toBe('normal')
  })
})

describe('pickWord', () => {
  it('берёт слова из всех выбранных наборов', () => {
    expect(pickWord(packs, new Set(), () => 0.99)).toEqual({ word: 'баня', packId: 'b', reshuffled: false })
  })

  it('не повторяет использованные слова', () => {
    const used = new Set([wordKey('a', 'кот'), wordKey('b', 'баня')])
    expect(pickWord(packs, used, () => 0).word).toBe('пёс')
  })

  it('начинает заново, когда слова закончились', () => {
    const used = new Set(['a:кот', 'a:пёс', 'b:баня'])
    expect(pickWord(packs, used, () => 0)).toMatchObject({ word: 'кот', reshuffled: true })
  })

  it('падает без наборов', () => {
    expect(() => pickWord([], new Set(), () => 0)).toThrow('Не выбрано ни одного набора слов')
  })
})

describe('createRound', () => {
  it('первый ходящий случайный, дальше — следующий по часовой', () => {
    const first = createRound({ playerCount: 4, packs, surpriseRounds: false, used: new Set(), previous: null, rng: seq(0, 0.6, 0.3) })
    expect(first.round.starterIndex).toBe(2)
    expect(first.round.brehloIndex).toBe(1)

    const second = createRound({ playerCount: 4, packs, surpriseRounds: false, used: new Set(), previous: round({ starterIndex: 3, number: 1 }), rng: () => 0 })
    expect(second.round.starterIndex).toBe(0)
    expect(second.round.number).toBe(2)
  })

  it('в сюрприз-раунде нет конкретного брехла', () => {
    const { round: r } = createRound({ playerCount: 3, packs, surpriseRounds: true, used: new Set(), previous: null, rng: () => 0 })
    expect(r.kind).toBe('noBrehlo')
    expect(r.brehloIndex).toBeNull()
  })

  it('не стартует меньше чем с тремя игроками', () => {
    expect(() => createRound({ playerCount: 2, packs, surpriseRounds: false, used: new Set(), previous: null })).toThrow('Нужно минимум 3 игрока')
  })
})

describe('dealOrder', () => {
  it('раздаёт по кругу с первого ходящего', () => {
    expect(dealOrder(round({ starterIndex: 2 }), 4)).toEqual([2, 3, 0, 1])
  })
})

describe('cardFor', () => {
  it('показывает слово мирным и подсказку брехлу', () => {
    expect(cardFor(round(), 0, 'Животные', true)).toEqual({ type: 'word', word: 'кот', category: 'Животные' })
    expect(cardFor(round(), 1, 'Животные', true)).toEqual({ type: 'brehlo', category: 'Животные' })
    expect(cardFor(round(), 1, 'Животные', false)).toEqual({ type: 'brehlo', category: null })
  })

  it('в раунде «все брехло» слово не видит никто', () => {
    const r = round({ kind: 'allBrehlo', brehloIndex: null })
    expect([0, 1, 2].map((i) => cardFor(r, i, 'X', false).type)).toEqual(['brehlo', 'brehlo', 'brehlo'])
  })

  it('в раунде без брехла слово видят все', () => {
    const r = round({ kind: 'noBrehlo', brehloIndex: null })
    expect([0, 1, 2].map((i) => cardFor(r, i, 'X', true).type)).toEqual(['word', 'word', 'word'])
  })
})

describe('resolveAccusation / resolveGuess', () => {
  it('обычный раунд', () => {
    expect(resolveAccusation(round(), { type: 'player', index: 1 })).toEqual({ type: 'caught' })
    expect(resolveAccusation(round(), { type: 'player', index: 0 })).toEqual({ type: 'brehloWins', reason: 'wrongAccused' })
    expect(resolveAccusation(round(), { type: 'nobody' })).toEqual({ type: 'brehloWins', reason: 'nobodyAccused' })
  })

  it('раунд без брехла', () => {
    const r = round({ kind: 'noBrehlo', brehloIndex: null })
    expect(resolveAccusation(r, { type: 'nobody' })).toEqual({ type: 'playersWin', reason: 'spottedNoBrehlo' })
    expect(resolveAccusation(r, { type: 'player', index: 0 })).toEqual({ type: 'everyoneLoses' })
  })

  it('раунд «все брехло»', () => {
    const r = round({ kind: 'allBrehlo', brehloIndex: null })
    expect(resolveAccusation(r, { type: 'player', index: 0 })).toEqual({ type: 'allBrehlo' })
  })

  it('пойманное брехло может отыграться словом', () => {
    expect(resolveGuess(true)).toEqual({ type: 'brehloWins', reason: 'guessedWord' })
    expect(resolveGuess(false)).toEqual({ type: 'playersWin', reason: 'caught' })
  })
})
