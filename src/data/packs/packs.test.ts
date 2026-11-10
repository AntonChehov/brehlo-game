import { describe, expect, it } from 'vitest'
import { PACKS } from '.'

const normalize = (word: string) => word.toLowerCase().replaceAll('ё', 'е').trim()

describe('наборы слов', () => {
  it('у наборов уникальные id и непустые слова', () => {
    expect(new Set(PACKS.map((p) => p.id)).size).toBe(PACKS.length)
    for (const pack of PACKS) {
      expect(pack.words.length).toBeGreaterThanOrEqual(30)
      expect(pack.words.every((w) => w.trim() === w && w.length > 0)).toBe(true)
    }
  })

  it('нет дублей между наборами', () => {
    const all = PACKS.flatMap((p) => p.words.map(normalize))
    const dupes = all.filter((w, i) => all.indexOf(w) !== i)
    expect(dupes).toEqual([])
  })

  it('18+ помечен как взрослый, остальные — нет', () => {
    expect(PACKS.filter((p) => p.adult).map((p) => p.id)).toEqual(['adult'])
  })
})
