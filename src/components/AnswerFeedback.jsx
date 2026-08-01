import { useEffect, useRef, useState } from 'react'
import { Lightbulb, Loader2, Sparkles } from 'lucide-react'
import { OLLAMA_MODEL, fetchAiExplanation } from '../lib/ollama'

/**
 * Bloc affiché après validation : verdict, explication rédigée, et explication
 * générée à la demande par le LLM local.
 *
 * Le parent monte ce composant avec `key={question.id}` : changer de question
 * remonte un composant neuf, donc l'état IA se réinitialise tout seul.
 */
const AnswerFeedback = ({ question, moduleId, isCorrect }) => {
  const [showExplanation, setShowExplanation] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiError, setAiError] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [showAi, setShowAi] = useState(false)
  const abortRef = useRef(null)

  // Annule la requête en cours si le composant disparaît (question suivante).
  useEffect(() => () => abortRef.current?.abort(), [])

  const requestAiExplanation = async () => {
    if (isAiLoading) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setShowAi(true)
    setIsAiLoading(true)
    setAiError('')
    setAiText('')

    try {
      setAiText(await fetchAiExplanation(question, moduleId, { signal: controller.signal }))
    } catch (error) {
      if (error.name === 'AbortError') return
      console.error('Explication IA indisponible :', error)
      setAiError(
        `Impossible de générer l'explication. Vérifiez qu'Ollama tourne en local (port 11434) avec le modèle « ${OLLAMA_MODEL} ».`,
      )
    } finally {
      if (!controller.signal.aborted) setIsAiLoading(false)
    }
  }

  return (
    <div className="flex items-start gap-4">
      <span
        className={`mt-1.5 h-3 w-3 rounded-full shrink-0 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <p className="font-black text-gray-900 text-lg" role="status">
          {isCorrect
            ? 'Félicitations ! Toutes les réponses sont correctes.'
            : 'Certaines réponses sont incorrectes. Regardez les détails ci-dessus.'}
        </p>

        {question.explanation && (
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setShowExplanation((visible) => !visible)}
              aria-expanded={showExplanation}
              className="flex items-center gap-2 text-primary-600 font-bold text-sm bg-primary-50 px-4 py-2 rounded-xl border border-primary-100 hover:bg-primary-100 transition-colors self-start"
            >
              <Lightbulb size={16} aria-hidden="true" />
              {showExplanation ? "Masquer l'explication" : "Voir l'explication"}
            </button>

            {showExplanation && (
              <div className="text-slate-700 font-medium text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in whitespace-pre-wrap">
                <span className="font-black text-[10px] uppercase tracking-widest text-slate-400 block mb-2">
                  Explication pédagogique
                </span>
                {question.explanation}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={requestAiExplanation}
              disabled={isAiLoading}
              className="flex items-center gap-2 text-purple-600 font-bold text-sm bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 hover:bg-purple-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {isAiLoading ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles size={16} aria-hidden="true" />
              )}
              {question.explanation ? 'Approfondir avec l’IA' : 'Générer une explication'}
            </button>

            <span className="text-[10px] font-bold text-gray-400 italic px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
              IA locale — {OLLAMA_MODEL}
            </span>
          </div>

          {showAi && (
            <div className="text-slate-700 font-medium text-sm leading-relaxed bg-gradient-to-br from-purple-50 to-white p-5 rounded-2xl border border-purple-100 shadow-sm animate-slide-up">
              <span className="font-black text-[10px] uppercase tracking-widest text-purple-400 mb-3 flex items-center gap-2">
                <Sparkles size={12} aria-hidden="true" /> Intelligence artificielle locale
              </span>

              {isAiLoading ? (
                <div className="flex flex-col gap-2" aria-label="Génération en cours">
                  <span className="block h-4 bg-purple-100/50 rounded animate-pulse w-3/4" />
                  <span className="block h-4 bg-purple-100/50 rounded animate-pulse w-full" />
                  <span className="block h-4 bg-purple-100/50 rounded animate-pulse w-5/6" />
                </div>
              ) : aiError ? (
                <p className="text-red-600 font-bold">{aiError}</p>
              ) : (
                <div className="whitespace-pre-wrap">{aiText}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnswerFeedback
