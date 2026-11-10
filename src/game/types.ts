export interface WordPack {
  id: string
  title: string
  emoji: string
  /** Набор только для взрослых: перед выбором показывается проверка возраста. */
  adult?: boolean
  words: string[]
}

export interface Settings {
  packIds: string[]
  /** Брехло видит категорию загаданного слова. */
  hintForBrehlo: boolean
  /** Изредка раунд без брехла или где брехло все. */
  surpriseRounds: boolean
}

/**
 * normal    — у одного игрока «БРЕХЛО», у остальных слово;
 * noBrehlo  — слово у всех;
 * allBrehlo — «БРЕХЛО» у всех.
 */
export type RoundKind = 'normal' | 'noBrehlo' | 'allBrehlo'

export interface Round {
  number: number
  kind: RoundKind
  word: string
  packId: string
  /** Индекс брехла в списке игроков; null, если раунд не normal. */
  brehloIndex: number | null
  /** С кого начинаются ассоциации и раздача карточек. */
  starterIndex: number
}

export type Card =
  | { type: 'word'; word: string; category: string }
  | { type: 'brehlo'; category: string | null }

export type Accusation = { type: 'player'; index: number } | { type: 'nobody' }

export type Outcome =
  /** Брехло вычислили — у него есть шанс назвать слово. */
  | { type: 'caught' }
  | { type: 'brehloWins'; reason: 'wrongAccused' | 'nobodyAccused' | 'guessedWord' }
  | { type: 'playersWin'; reason: 'caught' | 'spottedNoBrehlo' }
  /** Брехла не было, а группа кого-то обвинила. */
  | { type: 'everyoneLoses' }
  /** Брехлами были все. */
  | { type: 'allBrehlo' }

export type Rng = () => number
