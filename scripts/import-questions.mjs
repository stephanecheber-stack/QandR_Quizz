#!/usr/bin/env node
/**
 * Importe des questions copiées depuis les pages de discussion ExamTopics.
 *
 *   npm run import:questions -- itsm imports/itsm_lot1.txt            # simulation (rien n'est écrit)
 *   npm run import:questions -- itsm imports/itsm_lot1.txt --write    # ajoute réellement les questions
 *
 * Pour chaque question du fichier texte :
 *  - extrait l'énoncé et les choix A, B, C… ;
 *  - retient comme bonne réponse celle qui a reçu le plus de votes « Selected Answer »
 *    (égalité ou absence de vote ⇒ question écartée, à trancher à la main) ;
 *  - compare avec les questions déjà présentes : une question identique est
 *    écartée, une question proche (variante) est ajoutée mais signalée ;
 *  - utilise le numéro ExamTopics comme identifiant s'il est libre.
 *
 * Un rapport est affiché et enregistré à côté du fichier importé (.rapport.md).
 * Les explications restent vides : npm run gen:explanations -- itsm les complète.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import {
  DUPLICATE_THRESHOLD,
  SIMILAR_THRESHOLD,
  closestMatch,
  formatTally,
  parseBlock,
  splitBlocks,
} from './lib/import-parser.mjs'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

const MODULE_FILES = {
  ham: { id: 'HAM', file: 'src/data/ham_questions.json' },
  sam: { id: 'SAM', file: 'src/data/sam_questions.json' },
  itsm: { id: 'ITSM', file: 'src/data/itsm_questions.json' },
}

// --- Arguments ---
const args = process.argv.slice(2)
const positional = args.filter((arg) => !arg.startsWith('--'))
const [moduleKey, inputPath] = [positional[0]?.toLowerCase(), positional[1]]
const write = args.includes('--write')

if (!MODULE_FILES[moduleKey] || !inputPath) {
  console.error(`Usage : npm run import:questions -- <${Object.keys(MODULE_FILES).join('|')}> <fichier.txt> [--write]`)
  process.exit(1)
}

// --- Lecture de la banque existante (en conservant BOM et indentation) ---
const { id: moduleId, file } = MODULE_FILES[moduleKey]
const dataPath = join(projectRoot, file)
const BOM = '﻿'
const raw = readFileSync(dataPath, 'utf8')
const hadBom = raw.startsWith(BOM)
const body = hadBom ? raw.slice(1) : raw
const indent = body.match(/^\[\n( +)\{/)?.[1].length ?? 2
const existing = JSON.parse(body)

// --- Analyse du fichier collé ---
const absoluteInput = resolve(process.cwd(), inputPath)
const blocks = splitBlocks(readFileSync(absoluteInput, 'utf8'))
if (blocks.length === 0) {
  console.error('Aucune question trouvée : chaque question doit commencer par une ligne « Question #: N ».')
  process.exit(1)
}

const usedIds = new Set(existing.map((q) => q.id))
let nextId = Math.max(0, ...usedIds) + 1
const report = { added: [], duplicates: [], rejected: [] }
const accepted = []

for (const block of blocks) {
  const parsed = parseBlock(block)
  const label = `ExamTopics n° ${parsed.number}`

  if (parsed.errors.length > 0) {
    report.rejected.push(`${label} : ${parsed.errors.join(' ; ')}`)
    continue
  }

  // Doublon avec la banque existante… ou avec une question déjà acceptée dans ce lot
  const match = closestMatch(parsed, [...existing, ...accepted])
  const percent = Math.round(match.score * 100)
  if (match.score >= DUPLICATE_THRESHOLD) {
    report.duplicates.push(`${label} : identique à la question #${match.id} (${percent} %)`)
    continue
  }

  const id = usedIds.has(parsed.number) ? nextId++ : parsed.number
  usedIds.add(id)
  if (id >= nextId) nextId = id + 1

  accepted.push({
    id,
    question: parsed.question,
    options: parsed.options,
    correct_answers: parsed.correct_answers,
    explanation: '',
  })
  if (match.score >= SIMILAR_THRESHOLD) {
    parsed.warnings.push(`proche de la question #${match.id} (${percent} %) : variante ou doublon ?`)
  }
  const notes = parsed.warnings.length > 0 ? `  ⚠ ${parsed.warnings.join(' ; ')}` : ''
  report.added.push(`${label} → #${id} — réponse ${parsed.correct_answers.join('')} (votes : ${formatTally(parsed.votes.tally)})${notes}`)
}

// --- Rapport ---
const section = (title, lines) => (lines.length ? [`## ${title} (${lines.length})`, ...lines.map((l) => `- ${l}`), ''] : [])
const reportText = [
  `# Import ${moduleId} — ${inputPath}`,
  '',
  write ? '**Mode écriture** : les questions ajoutées sont enregistrées.' : '**Simulation** : rien n’a été écrit (ajouter --write pour enregistrer).',
  '',
  `${blocks.length} question(s) lue(s).`,
  '',
  ...section('Ajoutées', report.added),
  ...section('Doublons écartés', report.duplicates),
  ...section('Rejetées, à traiter à la main', report.rejected),
].join('\n')

console.log(reportText)
writeFileSync(`${absoluteInput.replace(/\.[^.\\/]+$/, '')}.rapport.md`, reportText + '\n', 'utf8')

// --- Écriture ---
if (write && accepted.length > 0) {
  const merged = [...existing, ...accepted].sort((a, b) => a.id - b.id)
  writeFileSync(dataPath, (hadBom ? BOM : '') + JSON.stringify(merged, null, indent) + '\n', 'utf8')

  // Met à jour questionCount dans src/modules.js pour ce module
  const modulesPath = join(projectRoot, 'src/modules.js')
  const source = readFileSync(modulesPath, 'utf8')
  const pattern = new RegExp(`(id:\\s*'${moduleId}'[\\s\\S]*?questionCount:\\s*)\\d+`)
  writeFileSync(modulesPath, source.replace(pattern, `$1${merged.length}`), 'utf8')

  console.log(`\n${accepted.length} question(s) ajoutée(s) à ${file} (total : ${merged.length}).`)
  console.log(`Étapes suivantes : npm run check:data, puis npm run gen:explanations -- ${moduleKey}`)
}
