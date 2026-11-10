import type { WordPack } from '../../game/types'
import { adult } from './adult'
import { animals } from './animals'
import { items } from './items'
import { memes } from './memes'
import { movies } from './movies'
import { places } from './places'
import { professions } from './professions'

export const PACKS: WordPack[] = [animals, places, professions, items, movies, memes, adult]

export const packById = (id: string): WordPack | undefined => PACKS.find((pack) => pack.id === id)
