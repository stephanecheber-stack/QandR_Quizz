#!/usr/bin/env node
/**
 * Vérifie l'intégrité des banques de questions.
 *
 *   npm run check:data
 *
 * Contrôles effectués, module par module :
 *  - le JSON est valide (les fichiers sont en UTF-8 avec BOM) ;
 *  - les identifiants sont présents et uniques ;
 *  - chaque QCM a un énoncé, des options et au moins une bonne réponse ;
 *  - chaque bonne réponse correspond bien à une option existante ;
 *  - chaque question d'association a des paires, sans valeur de droite en double
 *    (deux valeurs identiques rendraient la correction ambiguë) ;
 *  - `questionCount` dans src/modules.js correspond au nombre réel de questions.
 *
 * Sort en code 1 si un problème est détecté (utilisable en pre-commit ou en CI).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

const MODULE_FILES = {
  HAM: 'src/data/ham_questions.json',
  SAM: 'src/data/sam_questions.json',
  ITSM: 'src/data/itsm_questions.json',
}

/** Lit un JSON en retirant le BOM éventuel (les fichiers sont en UTF-8 BOM). */
function readJson(relativePath) {
  return JSON.parse(readFileSync(join(projectRoot, relativePath), 'utf8').replace(/^\uFEFF/, ''))
}

/** Extrait les `questionCount` déclarés dans src/modules.js. */
function readDeclaredCounts() {
  const source = readFileSync(join(projectRoot, 'src/modules.js'), 'utf8')
  const counts = {}
  const entries = source.matchAll(/id:\s*'(\w+)'[\s\S]*?questionCount:\s*(\d+)/g)
  for (const [, id, count] of entries) counts[id] = Number(count)
  return counts
}

function checkQuestion(question, seenIds) {
  const problems = []
  const id = question.id

  if (id == null) problems.push('identifiant manquant')
  else if (seenIds.has(id)) problems.push(`identifiant ${id} en double`)
  else seenIds.add(id)

  if (!question.question?.trim()) problems.push('énoncé vide')

  if (question.type === 'matching') {
    const pairs = question.pairs ?? {}
    const values = Object.values(pairs)
    if (values.length === 0) problems.push('aucune paire')
    if (new Set(values).size !== values.length) problems.push('valeurs de droite en double (correction ambiguë)')
    return problems
  }

  const options = question.options ?? {}
  const answers = question.correct_answers

  if (Object.keys(options).length === 0) problems.push('aucune option')
  if (!Array.isArray(answers) || answers.length === 0) problems.push('aucune bonne réponse')
  else for (const answer of answers) {
    if (!(answer in options)) problems.push(`la bonne réponse « ${answer} » ne correspond à aucune option`)
  }

  return problems
}

const declaredCounts = readDeclaredCounts()
let hasError = false

for (const [moduleId, file] of Object.entries(MODULE_FILES)) {
  let questions
  try {
    questions = readJson(file)
  } catch (error) {
    console.error(`[${moduleId}] ${file} illisible : ${error.message}`)
    hasError = true
    continue
  }

  if (!Array.isArray(questions)) {
    console.error(`[${moduleId}] ${file} devrait contenir un tableau.`)
    hasError = true
    continue
  }

  const seenIds = new Set()
  const failures = []
  let missingExplanations = 0

  for (const question of questions) {
    const problems = checkQuestion(question, seenIds)
    if (problems.length > 0) failures.push(`  #${question.id ?? '?'} : ${problems.join(', ')}`)
    if (!question.explanation?.trim()) missingExplanations += 1
  }

  const declared = declaredCounts[moduleId]
  if (declared != null && declared !== questions.length) {
    failures.push(`  questionCount de src/modules.js vaut ${declared} mais le fichier contient ${questions.length} questions`)
  }

  const status = failures.length === 0 ? 'OK' : 'ERREUR'
  console.log(`[${moduleId}] ${questions.length} questions — ${status}`)
  if (missingExplanations > 0) {
    console.log(`  ${missingExplanations} question(s) sans explication rédigée (npm run gen:explanations ${moduleId.toLowerCase()})`)
  }
  if (failures.length > 0) {
    hasError = true
    failures.forEach((line) => console.error(line))
  }
}

if (hasError) {
  console.error('\nDes problèmes ont été détectés.')
  process.exit(1)
}
console.log('\nToutes les banques de questions sont valides.')
