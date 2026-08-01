/**
 * Règles de correction, indépendantes de React et de Firestore.
 *
 * Deux formes de questions :
 *  - QCM        : { options: {A: '…'}, correct_answers: ['A', 'C'] }  (multi-sélection)
 *  - Association: { type: 'matching', pairs: { gauche: 'droite' } }
 */

export const MATCHING = 'matching'

export function isMatching(question) {
  return question?.type === MATCHING
}

/** Réponse vide adaptée au type de question (objet pour l'association, tableau sinon). */
export function emptyAnswer(question) {
  return isMatching(question) ? {} : []
}

/** L'utilisateur a-t-il saisi quelque chose ? Sert à activer le bouton « Vérifier ». */
export function hasAnswer(question, answer) {
  if (isMatching(question)) {
    return Object.keys(answer ?? {}).length > 0
  }
  return Array.isArray(answer) && answer.length > 0
}

/**
 * Une réponse est correcte si elle couvre exactement l'ensemble attendu :
 * ni oubli, ni sélection en trop.
 */
export function isAnswerCorrect(question, answer) {
  if (!question) return false

  if (isMatching(question)) {
    const expected = question.pairs ?? {}
    const given = answer ?? {}
    const keys = Object.keys(expected)
    return (
      keys.length > 0 &&
      Object.keys(given).length === keys.length &&
      keys.every((key) => given[key] === expected[key])
    )
  }

  const expected = question.correct_answers ?? []
  const given = Array.isArray(answer) ? answer : []
  return (
    expected.length > 0 &&
    given.length === expected.length &&
    given.every((value) => expected.includes(value))
  )
}
