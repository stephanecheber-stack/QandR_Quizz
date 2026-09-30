/**
 * Analyse du texte copié depuis les pages de discussion d'ExamTopics.
 *
 * Fonctions pures (aucun accès disque) : elles sont testées dans
 * import-parser.test.mjs et utilisées par scripts/import-questions.mjs.
 *
 * Format attendu, pour chaque question (plusieurs questions peuvent se suivre
 * dans le même fichier) :
 *
 *   Question #: 210
 *   Topic #: 1
 *   [[All CIS-ITSM Questions]](…)
 *   Énoncé de la question…
 *   A. premier choix
 *   B. deuxième choix
 *   by <auteur> at <date>
 *   Comments
 *   …
 *   Selected Answer: E        <- un vote par commentaire
 */

// Seuils utilisés pour le rapport
// Calibrés sur la banque ITSM : ExamTopics publie des variantes qui ne diffèrent
// que d'un choix (ex. #52 / #159, 80 % de similarité). Ce sont de vraies
// questions distinctes : on ne les écarte pas, on les signale.
export const DUPLICATE_THRESHOLD = 0.95 // au-dessus : question identique, écartée
export const SIMILAR_THRESHOLD = 0.6 // entre les deux : ajoutée mais signalée, à vérifier
export const LOW_CONSENSUS = 0.6 // part de votes du gagnant sous laquelle on alerte

const OPTION_LINE = /^([A-H])\.\s+(.*)$/
// Lignes qui marquent la fin des choix de réponse
const END_OF_OPTIONS = [
  /^by\s+\S+.*\bat\b/i,
  /^Comments\s*$/i,
  /^Chosen Answer:/i,
  /^Show Suggested Answer/i,
  /^Hide Answer/i,
  /^Reveal Solution/i,
  /^Suggested Answer:/i,
]
// Lignes d'en-tête à ignorer avant l'énoncé
const HEADER_LINE = [/^Topic #:/i, /^\[\[All .* Questions\]\]/i, /^Actual exam question/i]
// Indices qu'une question dépend d'une image absente du texte copié
const EXHIBIT_HINT = /\b(shown below|exhibit|screenshot|image|refer to the|following diagram|see below)\b/i

/** Découpe le texte collé en blocs, un par « Question #: N ». */
export function splitBlocks(text) {
  const normalized = text.replace(/\r\n?/g, '\n')
  const parts = normalized.split(/^(?=Question #:\s*\d+)/m)
  return parts.filter((part) => /^Question #:\s*\d+/.test(part))
}

/** Normalise une réponse votée : lettres en majuscules, uniques, triées (« ca » → « AC »). */
export function normalizeAnswer(letters) {
  return [...new Set(letters.toUpperCase().replace(/[^A-Z]/g, ''))].sort().join('')
}

/** Nombre de réponses attendu, d'après « (Choose two.) » dans l'énoncé. */
export function expectedAnswerCount(question) {
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5 }
  const match = question.match(/\(Choose (\w+)\.?\)/i)
  if (!match) return null
  const raw = match[1].toLowerCase()
  return words[raw] ?? (Number(raw) || null)
}

/**
 * Compte les votes « Selected Answer » et désigne la réponse la plus donnée.
 * Renvoie { tally, total, winner, share, tie }.
 */
export function tallyVotes(lines) {
  const tally = {}
  for (const line of lines) {
    const match = line.match(/^Selected Answer:\s*([A-Za-z]+)\s*$/)
    if (!match) continue
    const answer = normalizeAnswer(match[1])
    if (answer) tally[answer] = (tally[answer] ?? 0) + 1
  }
  const total = Object.values(tally).reduce((sum, n) => sum + n, 0)
  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1])
  if (ranked.length === 0) return { tally, total, winner: null, share: 0, tie: false }
  const [winner, best] = ranked[0]
  const tie = ranked.length > 1 && ranked[1][1] === best
  return { tally, total, winner: tie ? null : winner, share: best / total, tie }
}

/** Analyse un bloc. Renvoie la question structurée + ses alertes / erreurs. */
export function parseBlock(block) {
  const lines = block.split('\n').map((line) => line.trim())
  const number = Number(lines[0].match(/^Question #:\s*(\d+)/)[1])
  const errors = []
  const warnings = []

  // 1. Énoncé : de la fin de l'en-tête jusqu'au premier choix « A. »
  let i = 1
  while (i < lines.length && (lines[i] === '' || HEADER_LINE.some((re) => re.test(lines[i])))) i += 1
  const questionLines = []
  while (i < lines.length && !OPTION_LINE.test(lines[i])) {
    if (END_OF_OPTIONS.some((re) => re.test(lines[i]))) break
    if (lines[i]) questionLines.push(lines[i])
    i += 1
  }
  const question = questionLines.join(' ').replace(/\s+/g, ' ').trim()

  // 2. Choix : lignes « X. texte », éventuellement sur plusieurs lignes
  const options = {}
  let current = null
  while (i < lines.length && !END_OF_OPTIONS.some((re) => re.test(lines[i]))) {
    const match = lines[i].match(OPTION_LINE)
    if (match) {
      current = match[1]
      options[current] = match[2].trim()
    } else if (current && lines[i]) {
      options[current] = `${options[current]} ${lines[i]}`.trim()
    }
    i += 1
  }

  // 3. Votes, dans le reste du bloc (commentaires)
  const votes = tallyVotes(lines.slice(i))

  if (!question) errors.push('énoncé introuvable')
  if (Object.keys(options).length < 2) errors.push('moins de deux choix de réponse trouvés')
  if (votes.total === 0) errors.push('aucun vote « Selected Answer »')
  else if (votes.tie) errors.push(`égalité de votes : ${formatTally(votes.tally)}`)

  const correct = votes.winner ? votes.winner.split('') : []
  const unknown = correct.filter((letter) => !(letter in options))
  if (unknown.length > 0) errors.push(`réponse votée ${unknown.join('')} absente des choix`)

  if (votes.winner) {
    if (votes.total < 2) warnings.push('un seul vote')
    if (votes.share < LOW_CONSENSUS) warnings.push(`consensus faible (${Math.round(votes.share * 100)} %) : ${formatTally(votes.tally)}`)
    const expected = expectedAnswerCount(question)
    if (expected && expected !== correct.length) warnings.push(`l'énoncé demande ${expected} réponse(s), le vote en donne ${correct.length}`)
  }
  if (EXHIBIT_HINT.test(question)) warnings.push("l'énoncé semble faire référence à une image absente du texte")

  return { number, question, options, correct_answers: correct, votes, errors, warnings }
}

export function formatTally(tally) {
  return Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .map(([answer, n]) => `${answer}×${n}`)
    .join(', ')
}

/** Mots significatifs d'un texte (minuscules, sans ponctuation, > 2 lettres). */
export function tokenize(text) {
  return new Set(
    String(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9_]+/g, ' ')
      .split(' ')
      .filter((word) => word.length > 2),
  )
}

/** Similarité de Jaccard entre deux ensembles de mots (0 = rien en commun, 1 = identiques). */
export function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1
  let common = 0
  for (const word of a) if (b.has(word)) common += 1
  return common / (a.size + b.size - common)
}

/** Empreinte d'une question : énoncé + textes des choix. */
export function fingerprint(question) {
  return tokenize(`${question.question} ${Object.values(question.options ?? {}).join(' ')}`)
}

/** Question existante la plus proche : { id, score } (score entre 0 et 1). */
export function closestMatch(candidate, existing) {
  const target = fingerprint(candidate)
  let best = { id: null, score: 0 }
  for (const question of existing) {
    const score = jaccard(target, fingerprint(question))
    if (score > best.score) best = { id: question.id, score }
  }
  return best
}
