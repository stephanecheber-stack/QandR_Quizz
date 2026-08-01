/**
 * Mélange déterministe.
 *
 * `Array.prototype.sort(() => Math.random() - 0.5)` est un mélange biaisé : le
 * comparateur n'est pas cohérent, donc certaines permutations sortent bien plus
 * souvent que d'autres. On utilise Fisher-Yates, qui est uniforme.
 *
 * Le générateur est « seedé » (mulberry32) pour que le même seed produise
 * toujours le même ordre : au rechargement de la page, l'utilisateur retrouve
 * exactement les questions et les options dans le même ordre qu'avant.
 */

/** PRNG rapide et déterministe. Renvoie une fonction () => nombre dans [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates. Ne modifie pas le tableau d'origine. */
export function shuffle(items, random = Math.random) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Mélange reproductible : même (items, seed) => même résultat. */
export function seededShuffle(items, seed) {
  return shuffle(items, mulberry32(seed))
}

/** Combine un seed de session et un identifiant de question en un seed unique. */
export function deriveSeed(baseSeed, key) {
  return (Math.imul(baseSeed >>> 0, 0x9e3779b1) ^ Math.imul(Number(key) || 0, 0x85ebca6b)) >>> 0
}

/** Nouveau seed aléatoire pour démarrer une session. */
export function createSeed() {
  return Math.floor(Math.random() * 2 ** 31)
}
