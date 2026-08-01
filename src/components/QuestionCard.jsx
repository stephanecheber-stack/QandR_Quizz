import { CheckCircle2, ChevronDown, XCircle } from 'lucide-react'
import { isMatching } from '../lib/quiz'

/** Met en rouge les segments entre parenthèses, ex. « (Choose three.) ». */
function renderQuestionText(text) {
  return text.split(/(\([^)]+\))/g).map((part, index) =>
    part.startsWith('(') && part.endsWith(')') ? (
      <span key={index} className="text-red-600 font-bold">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

const MatchingRows = ({ question, answer, isValidated, availableValues, onChange }) => (
  <div className="space-y-4">
    {Object.keys(question.pairs).map((key) => {
      const selection = answer?.[key] ?? ''
      const isCorrect = selection === question.pairs[key]

      const stateClasses = isValidated
        ? isCorrect
          ? 'bg-green-50 border-green-500 text-green-700'
          : 'bg-red-50 border-red-500 text-red-700'
        : 'bg-gray-50 border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100'

      return (
        <div
          key={key}
          className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl group hover:shadow-md transition-all duration-300"
        >
          <label htmlFor={`match-${question.id}-${key}`} className="flex-1 font-bold text-gray-700 min-w-0 break-words">
            {key}
          </label>

          <div className="relative flex-1">
            <select
              id={`match-${question.id}-${key}`}
              value={selection}
              onChange={(event) => onChange(key, event.target.value)}
              disabled={isValidated}
              className={`w-full p-3.5 pr-10 rounded-xl border-2 font-bold text-sm appearance-none cursor-pointer transition-all duration-300 outline-none disabled:cursor-default ${stateClasses}`}
            >
              <option value="">Sélectionnez une correspondance…</option>
              {availableValues.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-primary-500 transition-colors">
              {isValidated ? (
                isCorrect ? (
                  <CheckCircle2 size={18} className="text-green-500" aria-hidden="true" />
                ) : (
                  <XCircle size={18} className="text-red-500" aria-hidden="true" />
                )
              ) : (
                <ChevronDown size={18} aria-hidden="true" />
              )}
            </div>
          </div>

          {isValidated && !isCorrect && (
            <p className="text-xs font-bold text-green-600 sm:basis-full">
              Réponse attendue : {question.pairs[key]}
            </p>
          )}
        </div>
      )
    })}
  </div>
)

const ChoiceRows = ({ question, answer, isValidated, optionOrder, onToggle }) => (
  <div className="space-y-3" role="group" aria-label="Propositions de réponse">
    {optionOrder.map(([optionKey, label], index) => {
      const displayLetter = String.fromCharCode(65 + index)
      const isSelected = answer.includes(optionKey)
      const isCorrect = question.correct_answers.includes(optionKey)

      let stateClasses = 'border-gray-100 hover:border-primary-200 hover:bg-primary-50 hover:translate-x-1'
      if (isSelected) {
        stateClasses = 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20 translate-x-1'
      }
      if (isValidated) {
        if (isCorrect) {
          stateClasses = 'border-green-500 bg-green-50 ring-0 translate-x-0'
        } else if (isSelected) {
          stateClasses = 'border-red-500 bg-red-50 ring-0 translate-x-0'
        } else {
          stateClasses = 'border-gray-100 opacity-60 translate-x-0'
        }
      }

      return (
        <button
          key={`${question.id}-${optionKey}`}
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          disabled={isValidated}
          onClick={() => onToggle(optionKey)}
          className={`w-full text-left flex items-center gap-4 p-5 border-2 rounded-2xl transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200 disabled:cursor-default ${stateClasses}`}
        >
          <span
            className={`w-11 h-11 flex items-center justify-center rounded-xl font-black text-lg shrink-0 transition-all duration-300 ${
              isSelected ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 rotate-3' : 'bg-gray-100 text-gray-500'
            } ${isValidated && isCorrect ? '!bg-green-600 !text-white !rotate-0' : ''} ${
              isValidated && isSelected && !isCorrect ? '!bg-red-600 !text-white !rotate-0' : ''
            }`}
            aria-hidden="true"
          >
            {displayLetter}
          </span>

          <span className="flex-1 text-gray-700 font-bold leading-snug">{label}</span>

          <span className="shrink-0">
            {isValidated ? (
              isCorrect ? (
                <CheckCircle2 className="text-green-600" size={26} aria-hidden="true" />
              ) : isSelected ? (
                <XCircle className="text-red-600" size={26} aria-hidden="true" />
              ) : null
            ) : (
              <span
                className={`block w-6 h-6 border-2 rounded-lg transition-all duration-300 ${
                  isSelected ? 'bg-primary-600 border-primary-600 scale-110' : 'border-gray-200'
                }`}
                aria-hidden="true"
              />
            )}
          </span>
        </button>
      )
    })}
  </div>
)

/** Énoncé + propositions. Le composant ne décide de rien, il affiche. */
const QuestionCard = ({ question, answer, isValidated, optionOrder, matchingValues, onToggleOption, onMatchingChange }) => (
  <>
    <h2 className="text-2xl md:text-3xl font-black text-gray-800 leading-tight mb-8">
      {renderQuestionText(question.question)}
    </h2>

    {isMatching(question) ? (
      <MatchingRows
        question={question}
        answer={answer}
        isValidated={isValidated}
        availableValues={matchingValues}
        onChange={onMatchingChange}
      />
    ) : (
      <ChoiceRows
        question={question}
        answer={answer}
        isValidated={isValidated}
        optionOrder={optionOrder}
        onToggle={onToggleOption}
      />
    )}
  </>
)

export default QuestionCard
