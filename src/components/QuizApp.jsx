import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronRight, Home, RotateCcw, Timer, XCircle } from 'lucide-react'
import AnswerFeedback from './AnswerFeedback'
import QuestionCard from './QuestionCard'
import QuizResults from './QuizResults'
import { getModule } from '../modules'
import { createSeed, deriveSeed, seededShuffle } from '../lib/shuffle'
import { EMPTY_PROGRESS, loadProgress, resetProgress, saveProgress } from '../lib/progress'
import { emptyAnswer, hasAnswer, isAnswerCorrect, isMatching } from '../lib/quiz'
import { formatDuration } from '../lib/format'

/** Délai avant écriture Firestore : évite une écriture par frappe d'état. */
const SAVE_DEBOUNCE_MS = 800

const QuizApp = ({ user, moduleId, onGoHome }) => {
  const module = getModule(moduleId)

  const [status, setStatus] = useState('loading')
  const [syncError, setSyncError] = useState(false)
  const [allQuestions, setAllQuestions] = useState([])

  // --- État de la session en cours ---
  const [orderSeed, setOrderSeed] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [errorIds, setErrorIds] = useState([])
  const [timings, setTimings] = useState({})
  const [isFinished, setIsFinished] = useState(false)

  // `null` = parcours complet du module ; un tableau = session de révision.
  const [revisionQuestions, setRevisionQuestions] = useState(null)
  const isRevisionMode = revisionQuestions !== null

  const [answer, setAnswer] = useState([])
  const [isValidated, setIsValidated] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const questionStartedAt = useRef(Date.now())

  // L'ordre des questions dérive du seed : il est donc identique après un
  // rechargement de page, mais différent à chaque nouvelle session.
  const orderedQuestions = useMemo(
    () => (orderSeed == null ? [] : seededShuffle(allQuestions, orderSeed)),
    [allQuestions, orderSeed],
  )

  const questions = revisionQuestions ?? orderedQuestions
  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length

  /** Positionne la session sur une question et réarme le chrono. */
  const startQuestion = useCallback((index, list) => {
    setCurrentIndex(index)
    setAnswer(emptyAnswer(list[index]))
    setIsValidated(false)
    questionStartedAt.current = Date.now()
    setElapsed(0)
  }, [])

  // --- Chargement des questions + de la progression ---
  useEffect(() => {
    if (!module) return undefined
    let cancelled = false

    setStatus('loading')
    setRevisionQuestions(null)
    setIsFinished(false)
    setIsValidated(false)

    const hydrate = async () => {
      // Les questions et la progression sont indépendantes : on les charge en
      // parallèle. Un échec Firestore ne doit pas empêcher de jouer hors ligne.
      const [questionsResult, progressResult] = await Promise.allSettled([
        module.load(),
        loadProgress(user.uid, moduleId),
      ])
      if (cancelled) return

      if (questionsResult.status === 'rejected') {
        console.error('Chargement des questions impossible :', questionsResult.reason)
        setStatus('error')
        return
      }

      if (progressResult.status === 'rejected') {
        console.error('Lecture de la progression impossible :', progressResult.reason)
        setSyncError(true)
      } else {
        setSyncError(false)
      }

      const loaded = questionsResult.value
      const progress = (progressResult.status === 'fulfilled' && progressResult.value) || EMPTY_PROGRESS
      const seed = progress.orderSeed ?? createSeed()
      const list = seededShuffle(loaded, seed)
      // Le nombre de questions d'un module peut changer : on borne l'index.
      const index = Math.min(Math.max(progress.currentIndex, 0), Math.max(list.length - 1, 0))

      setAllQuestions(loaded)
      setOrderSeed(seed)
      setScore(progress.score)
      setErrorIds(progress.errorIds)
      setTimings(progress.timings ?? {})
      setIsFinished(Boolean(progress.finished) && list.length > 0)
      startQuestion(index, list)
      setStatus('ready')
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [user.uid, moduleId, module, startQuestion])

  // --- Sauvegarde différée (jamais en mode révision : la progression réelle du
  //     module doit rester intacte pendant qu'on rejoue ses erreurs) ---
  useEffect(() => {
    if (status !== 'ready' || isRevisionMode) return undefined

    const timeout = setTimeout(() => {
      saveProgress(user.uid, moduleId, { currentIndex, score, errorIds, timings, orderSeed, finished: isFinished })
        .then(() => setSyncError(false))
        .catch((error) => {
          console.error('Écriture de la progression impossible :', error)
          setSyncError(true)
        })
    }, SAVE_DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [status, isRevisionMode, user.uid, moduleId, currentIndex, score, errorIds, timings, orderSeed, isFinished])

  // --- Chronomètre : temps passé sur la question courante ---
  useEffect(() => {
    if (status !== 'ready' || isValidated || isFinished || !currentQuestion) return undefined

    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - questionStartedAt.current) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [status, isValidated, isFinished, currentQuestion])

  // --- Ordre des propositions, stable pour une même question et un même seed ---
  const optionOrder = useMemo(() => {
    if (!currentQuestion || isMatching(currentQuestion)) return []
    return seededShuffle(Object.entries(currentQuestion.options), deriveSeed(orderSeed ?? 0, currentQuestion.id))
  }, [currentQuestion, orderSeed])

  const matchingValues = useMemo(() => {
    if (!currentQuestion || !isMatching(currentQuestion)) return []
    return seededShuffle(Object.values(currentQuestion.pairs), deriveSeed(orderSeed ?? 0, currentQuestion.id))
  }, [currentQuestion, orderSeed])

  const errorQuestions = useMemo(() => {
    const ids = new Set(errorIds)
    return allQuestions.filter((question) => ids.has(question.id))
  }, [allQuestions, errorIds])

  const isCurrentCorrect = isAnswerCorrect(currentQuestion, answer)

  // --- Interactions ---
  const handleOptionToggle = (optionKey) => {
    if (isValidated) return
    setAnswer((previous) => {
      const selection = Array.isArray(previous) ? previous : []
      return selection.includes(optionKey)
        ? selection.filter((key) => key !== optionKey)
        : [...selection, optionKey]
    })
  }

  const handleMatchingChange = (key, value) => {
    if (isValidated) return
    setAnswer((previous) => {
      const next = { ...(previous && !Array.isArray(previous) ? previous : {}) }
      if (value === '') delete next[key]
      else next[key] = value
      return next
    })
  }

  const handleValidate = () => {
    if (isValidated || !hasAnswer(currentQuestion, answer)) return

    const spent = Math.round((Date.now() - questionStartedAt.current) / 1000)
    setElapsed(spent)
    setTimings((previous) => ({ ...previous, [currentQuestion.id]: spent }))

    if (isAnswerCorrect(currentQuestion, answer)) {
      setScore((previous) => previous + 1)
    } else {
      setErrorIds((previous) =>
        previous.includes(currentQuestion.id) ? previous : [...previous, currentQuestion.id],
      )
    }

    setIsValidated(true)
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) startQuestion(currentIndex + 1, questions)
    else setIsFinished(true)
  }

  const handleReplayErrors = () => {
    if (errorQuestions.length === 0) return
    const list = seededShuffle(errorQuestions, createSeed())
    setRevisionQuestions(list)
    setScore(0)
    setErrorIds([])
    setTimings({})
    setIsFinished(false)
    startQuestion(0, list)
  }

  const handleRestart = async () => {
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir tout recommencer ? Votre progression pour ce module sera perdue.',
    )
    if (!confirmed) return

    const seed = createSeed()
    setRevisionQuestions(null)
    setOrderSeed(seed)
    setScore(0)
    setErrorIds([])
    setTimings({})
    setIsFinished(false)
    startQuestion(0, seededShuffle(allQuestions, seed))

    try {
      await resetProgress(user.uid, moduleId, seed)
      setSyncError(false)
    } catch (error) {
      console.error('Réinitialisation de la progression impossible :', error)
      setSyncError(true)
    }
  }

  // --- Rendu ---
  const syncBanner = syncError && (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg animate-fade-in"
    >
      <XCircle size={16} aria-hidden="true" />
      <span className="text-sm font-bold">Erreur de synchronisation. Progression locale uniquement.</span>
      <button
        type="button"
        onClick={() => setSyncError(false)}
        aria-label="Masquer l'alerte de synchronisation"
        className="ml-1 text-red-400 hover:text-red-600 font-black"
      >
        ✕
      </button>
    </div>
  )

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[50vh] px-4 text-center">
        <p className="text-gray-500 font-bold">Module « {moduleId} » introuvable.</p>
        <button type="button" onClick={onGoHome} className="btn btn-primary">
          Choisir un module
        </button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[50vh] px-4 text-center">
        <p className="text-gray-600 font-bold">Impossible de charger les questions du module {module.title}.</p>
        <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">
          Réessayer
        </button>
      </div>
    )
  }

  if (status === 'loading' || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="animate-pulse text-gray-400 font-medium">Chargement du module…</p>
      </div>
    )
  }

  if (isFinished) {
    return (
      <>
        {syncBanner}
        <QuizResults
          moduleId={moduleId}
          isRevisionMode={isRevisionMode}
          score={score}
          questions={questions}
          errors={errorQuestions}
          timings={timings}
          onReplayErrors={handleReplayErrors}
          onRestart={handleRestart}
        />
      </>
    )
  }

  return (
    <div className="max-w-3xl mx-auto w-full py-8 px-4 animate-fade-in">
      {syncBanner}

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap justify-between items-center gap-3 text-sm font-semibold text-gray-500">
          <span className="flex items-center gap-2 text-gray-400 bg-white/50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
            <module.icon size={18} className="text-primary-500" aria-hidden="true" />
            <span className="font-bold">Module {module.title}</span>
          </span>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-gray-500">
              <BookOpen size={16} className="text-primary-500" aria-hidden="true" />
              <span className="text-gray-800 font-black tabular-nums">{currentIndex + 1}</span> / {totalQuestions}
            </span>

            <div className="flex items-center gap-1.5">
              <span className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full border border-primary-100 font-bold tabular-nums">
                {score} pts
              </span>
              <button
                type="button"
                onClick={onGoHome}
                className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors"
                title="Changer de module"
                aria-label="Changer de module"
              >
                <Home size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Recommencer"
                aria-label="Recommencer le module"
              >
                <RotateCcw size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div
          className="h-2 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalQuestions}
          aria-valuenow={currentIndex + 1}
          aria-label="Avancement du quiz"
        >
          <div
            className="h-full bg-primary-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden animate-slide-up shadow-2xl border border-white/40">
        <div className="p-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${module.theme.badge}`}
              >
                Module {module.title}
              </span>
              {isMatching(currentQuestion) && (
                <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                  Association
                </span>
              )}
              {isRevisionMode && (
                <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                  Révision
                </span>
              )}
            </div>

            <span
              className="flex items-center gap-2 font-bold text-gray-400 tabular-nums"
              title="Temps passé sur cette question"
            >
              <Timer size={18} aria-hidden="true" />
              <span className="text-sm">{formatDuration(elapsed)}</span>
            </span>
          </div>

          <QuestionCard
            question={currentQuestion}
            answer={answer}
            isValidated={isValidated}
            optionOrder={optionOrder}
            matchingValues={matchingValues}
            onToggleOption={handleOptionToggle}
            onMatchingChange={handleMatchingChange}
          />
        </div>

        {isValidated ? (
          <div className="bg-gray-50/80 backdrop-blur-md px-8 py-7 border-t border-gray-100 flex flex-col gap-5 animate-fade-in">
            <AnswerFeedback
              key={currentQuestion.id}
              question={currentQuestion}
              moduleId={moduleId}
              isCorrect={isCurrentCorrect}
            />

            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary w-full flex items-center justify-center gap-3 py-5 text-xl group shadow-xl shadow-primary-500/20 rounded-2xl"
            >
              {currentIndex < totalQuestions - 1 ? 'Question suivante' : 'Voir le score final'}
              <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="px-8 py-7 border-t border-gray-100 bg-white">
            <button
              type="button"
              onClick={handleValidate}
              disabled={!hasAnswer(currentQuestion, answer)}
              className="btn btn-primary w-full py-5 text-xl font-black rounded-2xl shadow-xl shadow-primary-500/10 disabled:opacity-50 disabled:shadow-none"
            >
              {isMatching(currentQuestion) ? 'Vérifier mes associations' : 'Vérifier ma réponse'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizApp
