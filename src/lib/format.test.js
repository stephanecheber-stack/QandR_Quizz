import { describe, expect, it } from 'vitest'
import { formatDuration } from './format'

describe('formatDuration', () => {
  it('affiche les secondes sous la minute', () => {
    expect(formatDuration(0)).toBe('0s')
    expect(formatDuration(59)).toBe('59s')
  })

  it('affiche minutes et secondes sur deux chiffres', () => {
    expect(formatDuration(60)).toBe('1m 00s')
    expect(formatDuration(125)).toBe('2m 05s')
  })

  it('arrondit à la seconde la plus proche', () => {
    expect(formatDuration(59.6)).toBe('1m 00s')
  })

  it('traite les valeurs absentes ou négatives comme 0', () => {
    expect(formatDuration(undefined)).toBe('0s')
    expect(formatDuration(null)).toBe('0s')
    expect(formatDuration(-10)).toBe('0s')
  })
})
