#!/usr/bin/env node
/**
 * Génère les explications pédagogiques manquantes via Ollama (LLM local).
 *
 *   npm run gen:explanations itsm            # traite tout le module ITSM
 *   npm run gen:explanations itsm -- --limit 5   # essai sur 5 questions
 *   npm run gen:explanations itsm -- --force     # réécrit aussi celles qui existent
 *
 * Prérequis : Ollama lancé en local (port 11434) avec le modèle `gemma4`.
 *
 * Le fichier JSON est réécrit après CHAQUE question : le script est donc
 * interruptible (Ctrl+C) et reprenable — au relancement, il saute les questions
 * déjà expliquées.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

const MODULE_FILES = {
  ham: { file: 'src/data/ham_questions.json', label: 'HAM (Hardware Asset Management)' },
  sam: { file: 'src/data/sam_questions.json', label: 'SAM (Software Asset Management)' },
  itsm: { file: 'src/data/itsm_questions.json', label: 'ITSM (IT Service Management)' },
}

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma4'

// --- Arguments ---
const args = process.argv.slice(2)
const moduleKey = args.find((arg) => !arg.startsWith('--'))?.toLowerCase()
const force = args.includes('--force')
const limitFlag = args.indexOf('--limit')
const limit = limitFlag !== -1 ? Number(args[limitFlag + 1]) : Infinity

if (!moduleKey || !MODULE_FILES[moduleKey]) {
  console.error(`Usage : npm run gen:explanations <${Object.keys(MODULE_FILES).join('|')}> [-- --limit N] [-- --force]`)
  process.exit(1)
}

const { file, label } = MODULE_FILES[moduleKey]
const filePath = join(projectRoot, file)

// Les fichiers sont en UTF-8 avec BOM : on le retire à la lecture et on le
// remet à l'écriture pour ne pas modifier l'encodage d'origine.
const BOM = '\uFEFF'
const raw = readFileSync(filePath, 'utf8')
const hadBom = raw.startsWith(BOM)
const questions = JSON.parse(hadBom ? raw.slice(1) : raw)

function buildPrompt(question) {
  const options = Object.entries(question.options ?? {})
    .map(([key, value]) => `${key}. ${value}`)
    .join('\n')
  const answers = (question.correct_answers ?? [])
    .map((key) => `${key}. ${question.options[key]}`)
    .join('\n')

  return `Tu rédiges les explications d'un QCM de préparation à la certification ServiceNow ${label}.

Question :
${question.question}

Propositions :
${options}

Réponse(s) correcte(s) :
${answers}

Rédige l'explication pédagogique de cette question.

Contraintes strictes :
- En français, 80 à 130 mots.
- Commence directement par l'explication : pas d'introduction, pas de titre, pas de formule de politesse.
- Explique le concept ServiceNow sous-jacent, puis pourquoi la ou les bonnes réponses sont justes.
- Si c'est utile, précise en une phrase pourquoi les autres propositions sont écartées.
- Texte continu, sans puces ni Markdown.
- Ne répète pas l'énoncé de la question.`
}

async function generate(question) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: buildPrompt(question),
      stream: false,
      options: { temperature: 0.3 },
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama a répondu ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return (data.response ?? '').trim()
}

function save() {
  const json = JSON.stringify(questions, null, 2)
  writeFileSync(filePath, (hadBom ? BOM : '') + json + '\n', 'utf8')
}

const todo = questions.filter((question) => force || !question.explanation?.trim()).slice(0, limit)

if (todo.length === 0) {
  console.log(`Rien à faire : toutes les questions de ${label} ont déjà une explication.`)
  process.exit(0)
}

console.log(`Modèle ${OLLAMA_MODEL} sur ${OLLAMA_URL}`)
console.log(`${todo.length} question(s) à traiter sur ${questions.length} — Ctrl+C pour interrompre, le travail est sauvegardé au fur et à mesure.\n`)

const startedAt = Date.now()
let done = 0
let failed = 0

for (const question of todo) {
  const position = done + failed + 1
  process.stdout.write(`[${position}/${todo.length}] question #${question.id}… `)

  try {
    const explanation = await generate(question)
    if (!explanation) throw new Error('réponse vide')

    question.explanation = explanation
    save()
    done += 1

    const elapsed = (Date.now() - startedAt) / 1000
    const remaining = Math.round((elapsed / position) * (todo.length - position))
    console.log(`ok (${explanation.split(/\s+/).length} mots) — reste ~${Math.ceil(remaining / 60)} min`)
  } catch (error) {
    failed += 1
    console.log(`ÉCHEC : ${error.message}`)
  }
}

console.log(`\nTerminé : ${done} explication(s) générée(s), ${failed} échec(s).`)
console.log('Relancez la commande pour retenter les échecs, puis relisez le résultat avant de committer.')
