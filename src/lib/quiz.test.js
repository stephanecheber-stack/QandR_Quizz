import { describe, expect, it } from 'vitest'
import { emptyAnswer, hasAnswer, isAnswerCorrect, isMatching } from './quiz'

// Questions d'exemple, au même format que les fichiers de src/data/
const mcqSingle = {
  id: 1,
  question: 'Question à une réponse',
  options: { A: 'a', B: 'b', C: 'c' },
  correct_answers: ['B'],
}

const mcqMulti = {
  id: 2,
  question: 'Question à plusieurs réponses (Choose two.)',
  options: { A: 'a', B: 'b', C: 'c', D: 'd' },
  correct_answers: ['A', 'C'],
}

const matching = {
  id: 3,
  question: 'Associez',
  type: 'matching',
  pairs: { 'In stock': 'Disponible', Retired: 'Retiré' },
}

describe('isMatching', () => {
  it('reconnaît une question d’association', () => {
    expect(isMatching(matching)).toBe(true)
  })

  it('renvoie false pour un QCM ou une valeur absente', () => {
    expect(isMatching(mcqSingle)).toBe(false)
    expect(isMatching(undefined)).toBe(false)
  })
})

describe('emptyAnswer', () => {
  it('renvoie un tableau vide pour un QCM', () => {
    expect(emptyAnswer(mcqMulti)).toEqual([])
  })

  it('renvoie un objet vide pour une association', () => {
    expect(emptyAnswer(matching)).toEqual({})
  })
})

describe('hasAnswer', () => {
  it('QCM : faux sans sélection, vrai avec au moins une lettre', () => {
    expect(hasAnswer(mcqMulti, [])).toBe(false)
    expect(hasAnswer(mcqMulti, ['A'])).toBe(true)
  })

  it('association : faux sans choix, vrai dès un choix', () => {
    expect(hasAnswer(matching, {})).toBe(false)
    expect(hasAnswer(matching, undefined)).toBe(false)
    expect(hasAnswer(matching, { Retired: 'Retiré' })).toBe(true)
  })
})

describe('isAnswerCorrect — QCM', () => {
  it('accepte la bonne réponse unique', () => {
    expect(isAnswerCorrect(mcqSingle, ['B'])).toBe(true)
  })

  it('refuse une mauvaise réponse', () => {
    expect(isAnswerCorrect(mcqSingle, ['A'])).toBe(false)
  })

  it('accepte les bonnes réponses quel que soit l’ordre de sélection', () => {
    expect(isAnswerCorrect(mcqMulti, ['A', 'C'])).toBe(true)
    expect(isAnswerCorrect(mcqMulti, ['C', 'A'])).toBe(true)
  })

  it('refuse une réponse incomplète (tout ou rien)', () => {
    expect(isAnswerCorrect(mcqMulti, ['A'])).toBe(false)
  })

  it('refuse une sélection en trop', () => {
    expect(isAnswerCorrect(mcqMulti, ['A', 'B', 'C'])).toBe(false)
  })

  it('refuse une lettre en double qui masque une réponse manquante', () => {
    // Bug corrigé : ['A', 'A'] était compté juste pour ['A', 'C']
    expect(isAnswerCorrect(mcqMulti, ['A', 'A'])).toBe(false)
  })

  it('refuse une réponse vide ou invalide', () => {
    expect(isAnswerCorrect(mcqMulti, [])).toBe(false)
    expect(isAnswerCorrect(mcqMulti, undefined)).toBe(false)
    expect(isAnswerCorrect(mcqMulti, 'A')).toBe(false)
  })

  it('refuse tout si la question n’a pas de bonne réponse définie', () => {
    expect(isAnswerCorrect({ ...mcqSingle, correct_answers: [] }, [])).toBe(false)
  })

  it('refuse tout si la question est absente', () => {
    expect(isAnswerCorrect(undefined, ['A'])).toBe(false)
  })
})

describe('isAnswerCorrect — association', () => {
  it('accepte toutes les paires correctes', () => {
    expect(isAnswerCorrect(matching, { 'In stock': 'Disponible', Retired: 'Retiré' })).toBe(true)
  })

  it('refuse une association incomplète', () => {
    expect(isAnswerCorrect(matching, { 'In stock': 'Disponible' })).toBe(false)
  })

  it('refuse des valeurs inversées', () => {
    expect(isAnswerCorrect(matching, { 'In stock': 'Retiré', Retired: 'Disponible' })).toBe(false)
  })

  it('refuse une réponse absente', () => {
    expect(isAnswerCorrect(matching, undefined)).toBe(false)
  })
})
