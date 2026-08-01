import { ChevronRight, XCircle } from 'lucide-react'
import { MODULES } from '../modules'

/**
 * Écran de choix du module. Les cartes sont générées depuis le registre
 * `MODULES` : plus de JSX dupliqué à trois exemplaires.
 */
const ModuleSelection = ({ activeModuleId, onSelect, error, onDismissError }) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 animate-fade-in">
    <div className="text-center mb-12">
      <h2 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">Quiz Training</h2>
      <p className="text-xl text-gray-500 font-medium">
        Choisissez votre parcours de certification ou de formation
      </p>

      {error && (
        <div
          role="alert"
          className="mt-6 inline-flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl"
        >
          <XCircle size={16} className="shrink-0" />
          <span className="text-sm font-bold">{error}</span>
          <button
            type="button"
            onClick={onDismissError}
            aria-label="Masquer le message d'erreur"
            className="text-red-400 hover:text-red-600 font-black"
          >
            ✕
          </button>
        </div>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
      {MODULES.map((module) => {
        const Icon = module.icon
        const isActive = module.id === activeModuleId

        return (
          <button
            key={module.id}
            type="button"
            onClick={() => onSelect(module.id)}
            className={`group relative text-left bg-white rounded-[2rem] p-8 border-2 transition-all duration-500 cursor-pointer overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-primary-500/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200 ${
              isActive ? 'border-primary-500' : 'border-transparent hover:border-primary-500'
            }`}
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <Icon size={120} aria-hidden="true" />
            </div>

            <div className="relative z-10">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ${module.theme.iconWrapper}`}
              >
                <Icon className={module.theme.icon} size={32} aria-hidden="true" />
              </div>

              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-3xl font-black text-gray-800">{module.title}</h3>
                {isActive && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-primary-100 text-primary-700 px-2 py-1 rounded">
                    En cours
                  </span>
                )}
              </div>

              <p className="text-gray-500 font-medium leading-relaxed">{module.subtitle}</p>
              <p className="text-sm text-gray-400 font-medium mt-3">{module.description}</p>
              <p className="text-sm text-gray-400 font-medium mt-1">{module.questionCount} questions</p>

              <span className="mt-8 flex items-center text-primary-600 font-bold gap-2">
                {isActive ? 'Reprendre ce module' : 'Commencer ce module'}
                <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </span>
            </div>
          </button>
        )
      })}
    </div>
  </div>
)

export default ModuleSelection
