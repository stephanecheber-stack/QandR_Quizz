import { describe, expect, it } from 'vitest'
import {
  SIMILAR_THRESHOLD,
  closestMatch,
  expectedAnswerCount,
  jaccard,
  normalizeAnswer,
  parseBlock,
  splitBlocks,
  tallyVotes,
  tokenize,
} from './import-parser.mjs'

// Copie réelle d'une page de discussion (question 210), telle que collée
const Q210 = `Exam CIS-ITSM topic 1 question 210 discussion
Actual exam question from ServiceNow's [CIS-ITSM](https://www.examtopics.com/exams/servicenow/cis-itsm/view/)
Question #: 210
Topic #: 1
[[All CIS-ITSM Questions]](https://www.examtopics.com/exams/servicenow/cis-itsm/view/)
Which of the following can leverage user criteria for controlling access?

A. catalog taxonomy

B. catalog topics

C. catalog categories

D. catalog variables

E. catalog items
by Duke_CT at June 18, 2025 01:37 pm
Comments
Chosen Answer: ABCDE
This is a voting comment (?). It is better to Upvote an existing comment if you don't have anything to add.
ramypalkveer
Most Recent 1 year, 2 months, 9 days ago
Selected Answer: E
ITSM Implementation washington text book - user criteria module 4.3
upvoted 1 time
aaadddiii
1 year, 2 months, 20 days ago
Selected Answer: E
4.3- User Criteria - user criteria can be applied to category, catalog and catalog item
upvoted 1 time
Mohammedhz
1 year, 3 months, 4 days ago
Selected Answer: E
it's E Catalog items have an Available for and Not Available for related list
upvoted 1 time
`

// Question fictive à plusieurs réponses, sur plusieurs lignes, avec des votes partagés
const MULTI = `Question #: 230
Topic #: 1
Which two roles can approve a change? (Choose two.)
A. itil
B. change_manager
C. approver_user
with a continuation line
D. admin
by someone at July 1, 2025 10:00 am
Comments
Selected Answer: BC
Selected Answer: cb
Selected Answer: BD
`

describe('splitBlocks', () => {
  it('découpe un fichier contenant plusieurs questions', () => {
    const blocks = splitBlocks(`${Q210}\n\n${MULTI}`)
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toMatch(/^Question #: 210/)
    expect(blocks[1]).toMatch(/^Question #: 230/)
  })

  it('accepte les fins de ligne Windows', () => {
    expect(splitBlocks(Q210.replace(/\n/g, '\r\n'))).toHaveLength(1)
  })

  it('ignore un texte sans « Question #: »', () => {
    expect(splitBlocks('rien à voir')).toEqual([])
  })
})

describe('parseBlock — question 210 réelle', () => {
  const parsed = parseBlock(splitBlocks(Q210)[0])

  it('lit le numéro et l’énoncé', () => {
    expect(parsed.number).toBe(210)
    expect(parsed.question).toBe('Which of the following can leverage user criteria for controlling access?')
  })

  it('lit les cinq choix', () => {
    expect(parsed.options).toEqual({
      A: 'catalog taxonomy',
      B: 'catalog topics',
      C: 'catalog categories',
      D: 'catalog variables',
      E: 'catalog items',
    })
  })

  it('ignore « Chosen Answer » et retient le vote majoritaire', () => {
    expect(parsed.correct_answers).toEqual(['E'])
    expect(parsed.votes.tally).toEqual({ E: 3 })
    expect(parsed.errors).toEqual([])
    expect(parsed.warnings).toEqual([])
  })
})

describe('parseBlock — plusieurs réponses', () => {
  const parsed = parseBlock(splitBlocks(MULTI)[0])

  it('recolle un choix écrit sur deux lignes', () => {
    expect(parsed.options.C).toBe('approver_user with a continuation line')
  })

  it('regroupe BC et cb comme le même vote', () => {
    expect(parsed.votes.tally).toEqual({ BC: 2, BD: 1 })
    expect(parsed.correct_answers).toEqual(['B', 'C'])
  })

  it('alerte quand le consensus est faible (2 votes sur 3 = 67 % : pas d’alerte)', () => {
    expect(parsed.warnings).toEqual([])
  })
})

describe('parseBlock — cas à rejeter ou signaler', () => {
  const base = `Question #: 1\nTopic #: 1\nQuestion ?\nA. un\nB. deux\nComments\n`

  it('rejette en cas d’égalité', () => {
    const parsed = parseBlock(`${base}Selected Answer: A\nSelected Answer: B\n`)
    expect(parsed.errors[0]).toMatch(/égalité/)
    expect(parsed.correct_answers).toEqual([])
  })

  it('rejette sans aucun vote', () => {
    expect(parseBlock(base).errors[0]).toMatch(/aucun vote/)
  })

  it('rejette une réponse votée qui n’existe pas dans les choix', () => {
    expect(parseBlock(`${base}Selected Answer: C\n`).errors[0]).toMatch(/absente des choix/)
  })

  it('signale un vote unique', () => {
    expect(parseBlock(`${base}Selected Answer: A\n`).warnings).toContain('un seul vote')
  })

  it('signale un désaccord avec « (Choose two.) »', () => {
    const text = `Question #: 2\nWhich? (Choose two.)\nA. un\nB. deux\nC. trois\nComments\nSelected Answer: A\nSelected Answer: A\n`
    expect(parseBlock(text).warnings.join()).toMatch(/demande 2 réponse/)
  })

  it('signale une image probablement manquante', () => {
    const text = `Question #: 3\nGiven the class structure shown below, which one?\nA. un\nB. deux\nComments\nSelected Answer: A\nSelected Answer: A\n`
    expect(parseBlock(text).warnings.join()).toMatch(/image/)
  })
})

describe('outils', () => {
  it('normalizeAnswer trie et dédoublonne', () => {
    expect(normalizeAnswer('cab')).toBe('ABC')
    expect(normalizeAnswer('AA')).toBe('A')
  })

  it('expectedAnswerCount lit « Choose two/three »', () => {
    expect(expectedAnswerCount('Pick? (Choose three.)')).toBe(3)
    expect(expectedAnswerCount('Pick one')).toBeNull()
  })

  it('tallyVotes gère l’absence de vote', () => {
    expect(tallyVotes(['rien'])).toMatchObject({ total: 0, winner: null })
  })

  it('jaccard vaut 1 pour des textes identiques et 0 sans mot commun', () => {
    expect(jaccard(tokenize('user criteria access'), tokenize('User criteria, access!'))).toBe(1)
    expect(jaccard(tokenize('incident problem'), tokenize('catalog request'))).toBe(0)
  })

  it('closestMatch signale une question reformulée comme doublon possible', () => {
    const existing = [
      { id: 7, question: 'Which of the following can leverage user criteria for controlling access?', options: { A: 'catalog items', B: 'catalog topics' } },
      { id: 8, question: 'What is an incident?', options: { A: 'x', B: 'y' } },
    ]
    const candidate = { question: 'Which of these can leverage user criteria to control access?', options: { A: 'catalog items', B: 'catalog topics' } }
    const match = closestMatch(candidate, existing)
    expect(match.id).toBe(7)
    expect(match.score).toBeGreaterThanOrEqual(SIMILAR_THRESHOLD)
  })
})
