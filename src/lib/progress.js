import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Accès Firestore à la progression : document `users/{uid}`, champ
 * `progress[moduleId]`.
 *
 * Toute la logique réseau est isolée ici pour que QuizApp ne manipule que des
 * objets JavaScript simples.
 */

/** Forme d'une progression vide — sert aussi de garde-fou au chargement. */
export const EMPTY_PROGRESS = {
  currentIndex: 0,
  score: 0,
  errorIds: [],
  timings: {},
  orderSeed: null,
  finished: false,
}

function userRef(uid) {
  return doc(db, 'users', uid)
}

/**
 * Lit la progression d'un module.
 * Renvoie `null` si aucune progression n'est enregistrée.
 * Lève l'erreur Firestore en cas d'échec réseau (l'appelant décide quoi afficher).
 */
export async function loadProgress(uid, moduleId) {
  const snapshot = await getDoc(userRef(uid))
  const stored = snapshot.exists() ? snapshot.data()?.progress?.[moduleId] : null
  if (!stored) return null

  // Les documents anciens ou partiels sont normalisés ici, une bonne fois pour
  // toutes : l'appelant reçoit toujours des types exploitables.
  return {
    currentIndex: toPositiveInt(stored.currentIndex),
    score: toPositiveInt(stored.score),
    errorIds: normaliseErrorIds(stored),
    timings: typeof stored.timings === 'object' && stored.timings !== null ? stored.timings : {},
    orderSeed: Number.isFinite(stored.orderSeed) ? stored.orderSeed : null,
    finished: Boolean(stored.finished),
  }
}

function toPositiveInt(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0
}

/** Compatibilité avec l'ancien format `sessionErrors: [{ id, question }]`. */
function normaliseErrorIds(stored) {
  if (Array.isArray(stored.errorIds)) return stored.errorIds
  if (Array.isArray(stored.sessionErrors)) {
    return stored.sessionErrors.map((entry) => (typeof entry === 'object' ? entry?.id : entry)).filter((id) => id != null)
  }
  return []
}

/** Écrit (en fusion) la progression d'un module. */
export async function saveProgress(uid, moduleId, progress) {
  await setDoc(
    userRef(uid),
    {
      progress: {
        [moduleId]: {
          currentIndex: progress.currentIndex,
          score: progress.score,
          errorIds: progress.errorIds,
          timings: progress.timings,
          orderSeed: progress.orderSeed,
          finished: Boolean(progress.finished),
          updatedAt: Date.now(),
        },
      },
    },
    { merge: true },
  )
}

/** Remet à zéro la progression d'un module (nouveau seed = nouvel ordre). */
export async function resetProgress(uid, moduleId, orderSeed) {
  await saveProgress(uid, moduleId, { ...EMPTY_PROGRESS, orderSeed })
}
