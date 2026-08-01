import { Award, CheckCircle2, RotateCcw, Timer, XCircle } from 'lucide-react'
import { formatDuration } from '../lib/format'

const StatCard = ({ label, children }) => (
  <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm">
    <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
    <div className="text-3xl font-black text-gray-800">{children}</div>
  </div>
)

function buildMessage(percentage, isPerfect) {
  if (isPerfect) {
    return { colorClass: 'text-green-500', text: 'Félicitations, vous maîtrisez toutes les questions !' }
  }
  if (percentage >= 80) {
    return { colorClass: 'text-green-500', text: 'Excellent ! Vous maîtrisez parfaitement le sujet.' }
  }
  if (percentage >= 50) {
    return { colorClass: 'text-orange-500', text: 'Pas mal ! Encore un peu de révision pour atteindre l’excellence.' }
  }
  return { colorClass: 'text-red-500', text: 'Continuez vos efforts ! La pratique est la clé.' }
}

/**
 * Écran de fin de session : score, temps passé et liste des erreurs à rejouer.
 */
const QuizResults = ({ moduleId, isRevisionMode, score, questions, errors, timings, onReplayErrors, onRestart }) => {
  const total = questions.length
  // Garde-fou : une session vide donnerait NaN%.
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0
  const isPerfect = total > 0 && errors.length === 0

  const { colorClass, text } = buildMessage(percentage, isPerfect)

  const timedQuestions = questions.filter((question) => timings[question.id] != null)
  const totalTime = timedQuestions.reduce((sum, question) => sum + timings[question.id], 0)
  const averageTime = timedQuestions.length > 0 ? totalTime / timedQuestions.length : 0
  const slowest = [...timedQuestions].sort((a, b) => timings[b.id] - timings[a.id]).slice(0, 3)

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in px-4 py-8">
      <div className="glass-card p-10 rounded-3xl text-center max-w-lg w-full">
        <div className="bg-primary-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Award className="text-primary-600 w-12 h-12" aria-hidden="true" />
        </div>

        <h2 className="text-4xl font-black text-gray-800 mb-2">Résultats</h2>
        <p className="text-gray-500 font-medium mb-8">
          {isRevisionMode ? 'Mode Révision' : `Sujet : Module ${moduleId}`}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatCard label="Score">
            {score} <span className="text-lg text-gray-400 font-normal">/ {total}</span>
          </StatCard>
          <StatCard label="Réussite">
            <span className={colorClass}>{percentage}%</span>
          </StatCard>
        </div>

        {timedQuestions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <StatCard label="Temps total">
              <span className="text-2xl">{formatDuration(totalTime)}</span>
            </StatCard>
            <StatCard label="Moyenne / question">
              <span className="text-2xl">{formatDuration(averageTime)}</span>
            </StatCard>
          </div>
        )}

        <div className={`mb-10 font-bold ${isPerfect ? `text-2xl ${colorClass}` : 'text-lg font-medium text-gray-700 italic'}`}>
          {isPerfect ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 size={64} className="text-green-500 animate-bounce" aria-hidden="true" />
              <span>{text}</span>
            </div>
          ) : (
            `« ${text} »`
          )}
        </div>

        {errors.length > 0 && (
          <div className="mb-8 text-left">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <XCircle size={14} className="text-red-400" aria-hidden="true" />
              Vos points d’amélioration ({errors.length})
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {errors.map((question) => (
                <div key={question.id} className="p-4 bg-red-50/50 border border-red-100 rounded-xl">
                  <p className="text-xs font-bold text-red-400 mb-1">Question {question.id}</p>
                  <p className="text-sm text-gray-700 font-medium leading-snug">{question.question}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {slowest.length > 0 && (
          <div className="mb-10 text-left">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Timer size={14} className="text-primary-400" aria-hidden="true" />
              Questions les plus longues
            </h3>
            <div className="space-y-2">
              {slowest.map((question) => (
                <div
                  key={question.id}
                  className="flex items-start gap-3 p-3 bg-white/60 border border-gray-100 rounded-xl"
                >
                  <span className="text-xs font-black text-primary-600 shrink-0 mt-0.5 tabular-nums">
                    {formatDuration(timings[question.id])}
                  </span>
                  <span className="text-sm text-gray-600 font-medium leading-snug line-clamp-2">
                    {question.question}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {errors.length > 0 && (
            <button
              type="button"
              onClick={onReplayErrors}
              className="btn bg-orange-500 hover:bg-orange-600 text-white w-full flex items-center justify-center gap-2 py-5 text-xl shadow-lg shadow-orange-500/20"
            >
              <Award size={24} aria-hidden="true" />
              Rejouer uniquement mes erreurs
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            className="btn btn-primary w-full flex items-center justify-center gap-2 py-5 text-xl shadow-lg shadow-primary-500/20"
          >
            <RotateCcw size={24} aria-hidden="true" />
            Recommencer tout le QCM
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuizResults
