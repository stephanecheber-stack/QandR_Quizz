import { isMatching } from './quiz'

/**
 * Explications générées par un LLM local (Ollama).
 *
 * En développement, Vite proxifie `/ollama` vers http://localhost:11434
 * (voir vite.config.js). Sans Ollama lancé, l'appel échoue : c'est attendu,
 * l'appelant affiche alors un message explicite.
 */
export const OLLAMA_MODEL = 'gemma4'

export function buildExplanationPrompt(question, moduleId) {
  const answers = isMatching(question)
    ? Object.entries(question.pairs)
        .map(([left, right]) => `- ${left} => ${right}`)
        .join('\n')
    : question.correct_answers.map((key) => `- ${key}: ${question.options[key]}`).join('\n')

  const choices = isMatching(question)
    ? Object.keys(question.pairs)
        .map((left) => `- ${left}`)
        .join('\n')
    : Object.entries(question.options)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n')

  return `Tu es un expert pédagogique ServiceNow, spécialiste du module ${moduleId}.
Explique la question suivante de manière claire et détaillée à un étudiant qui prépare la certification.

Question :
${question.question}

Propositions :
${choices}

Réponse(s) correcte(s) :
${answers}

Consignes :
1. Sois encourageant et concret.
2. Explique pourquoi la ou les bonnes réponses sont justes.
3. Explique brièvement pourquoi les autres propositions sont fausses.
4. Donne un exemple d'usage réel dans ServiceNow si c'est pertinent.
5. Réponds exclusivement en français, en 200 mots maximum, avec des points clés.`
}

/**
 * Appelle Ollama et renvoie le texte généré.
 * `signal` permet d'annuler la requête si l'utilisateur change de question.
 */
export async function fetchAiExplanation(question, moduleId, { signal } = {}) {
  const response = await fetch('/ollama/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: buildExplanationPrompt(question, moduleId),
      stream: false,
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Ollama a répondu ${response.status}`)
  }

  const data = await response.json()
  return data.response ?? ''
}
