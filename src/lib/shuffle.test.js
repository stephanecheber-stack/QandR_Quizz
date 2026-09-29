import { describe, expect, it } from 'vitest'
import { createSeed, deriveSeed, mulberry32, seededShuffle, shuffle } from './shuffle'

const items = Array.from({ length: 20 }, (_, i) => i + 1)

describe('mulberry32', () => {
  it('produit la même suite de nombres pour le même seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 10; i += 1) expect(a()).toBe(b())
  })

  it('renvoie des nombres dans [0, 1)', () => {
    const random = mulberry32(7)
    for (let i = 0; i < 1000; i += 1) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('shuffle', () => {
  it('ne modifie pas le tableau d’origine', () => {
    const copy = [...items]
    shuffle(items)
    expect(items).toEqual(copy)
  })

  it('garde exactement les mêmes éléments', () => {
    const result = shuffle(items)
    expect(result).toHaveLength(items.length)
    expect([...result].sort((a, b) => a - b)).toEqual(items)
  })

  it('gère les tableaux vides et à un élément', () => {
    expect(shuffle([])).toEqual([])
    expect(shuffle(['seul'])).toEqual(['seul'])
  })

  it('est à peu près uniforme (chaque élément finit partout)', () => {
    // Sur 3 éléments, il y a 6 ordres possibles : chacun doit apparaître
    // environ 1/6 du temps. On tolère un large écart pour éviter les faux échecs.
    const random = mulberry32(123)
    const counts = {}
    const runs = 6000
    for (let i = 0; i < runs; i += 1) {
      const key = shuffle(['a', 'b', 'c'], random).join('')
      counts[key] = (counts[key] ?? 0) + 1
    }
    expect(Object.keys(counts)).toHaveLength(6)
    for (const count of Object.values(counts)) {
      expect(count).toBeGreaterThan(runs / 6 * 0.85)
      expect(count).toBeLessThan(runs / 6 * 1.15)
    }
  })
})

describe('seededShuffle', () => {
  it('même seed ⇒ même ordre (rechargement de page sans surprise)', () => {
    expect(seededShuffle(items, 2026)).toEqual(seededShuffle(items, 2026))
  })

  it('seeds différents ⇒ ordres différents', () => {
    expect(seededShuffle(items, 1)).not.toEqual(seededShuffle(items, 2))
  })
})

describe('deriveSeed', () => {
  it('est déterministe', () => {
    expect(deriveSeed(99, 5)).toBe(deriveSeed(99, 5))
  })

  it('donne un seed différent par question', () => {
    const seeds = new Set(items.map((id) => deriveSeed(99, id)))
    expect(seeds.size).toBe(items.length)
  })

  it('renvoie un entier positif sur 32 bits', () => {
    const seed = deriveSeed(-5, 'pas-un-nombre')
    expect(Number.isInteger(seed)).toBe(true)
    expect(seed).toBeGreaterThanOrEqual(0)
    expect(seed).toBeLessThan(2 ** 32)
  })
})

describe('createSeed', () => {
  it('renvoie un entier dans [0, 2^31)', () => {
    const seed = createSeed()
    expect(Number.isInteger(seed)).toBe(true)
    expect(seed).toBeGreaterThanOrEqual(0)
    expect(seed).toBeLessThan(2 ** 31)
  })
})
