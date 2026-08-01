import { useCallback, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { Loader2, LogOut } from 'lucide-react'
import Auth from './components/Auth'
import ModuleSelection from './components/ModuleSelection'
import QuizApp from './components/QuizApp'
import { auth, db } from './firebase'
import { getModule } from './modules'

function App() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewingSelection, setViewingSelection] = useState(false)
  const [moduleError, setModuleError] = useState(null)

  useEffect(() => {
    // Deux abonnements imbriqués : l'auth, puis le document utilisateur.
    // `unsubscribeDoc` doit être appelé avant chaque réabonnement, sinon un
    // cycle déconnexion/reconnexion laisse des listeners Firestore actifs.
    let unsubscribeDoc = null

    const stopDocListener = () => {
      unsubscribeDoc?.()
      unsubscribeDoc = null
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      stopDocListener()
      setUser(currentUser)

      if (!currentUser) {
        setUserData(null)
        setViewingSelection(false)
        setLoading(false)
        return
      }

      setLoading(true)
      unsubscribeDoc = onSnapshot(
        doc(db, 'users', currentUser.uid),
        (snapshot) => {
          setUserData(snapshot.exists() ? snapshot.data() : { lockedModule: null, progress: {} })
          setLoading(false)
        },
        (error) => {
          console.error('Lecture du profil impossible :', error)
          setUserData({ lockedModule: null, progress: {} })
          setLoading(false)
        },
      )
    })

    return () => {
      unsubscribeAuth()
      stopDocListener()
    }
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Déconnexion impossible :', error)
    }
  }, [])

  const handleSelectModule = useCallback(
    async (moduleId) => {
      if (!user) return
      setModuleError(null)
      // On ferme l'écran de sélection tout de suite : l'ancien code attendait
      // un flag `isVIP` qui n'existe plus, ce qui bloquait le retour au quiz.
      setViewingSelection(false)

      try {
        await setDoc(doc(db, 'users', user.uid), { lockedModule: moduleId }, { merge: true })
      } catch (error) {
        console.error('Enregistrement du module impossible :', error)
        setViewingSelection(true)
        setModuleError('Erreur réseau lors de la sélection. Vérifiez votre connexion et réessayez.')
      }
    },
    [user],
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin" aria-hidden="true" />
          <p className="text-gray-500 font-bold animate-pulse">Chargement de votre session…</p>
        </div>
      </div>
    )
  }

  const lockedModule = userData?.lockedModule
  // Un module supprimé du registre ne doit pas bloquer l'application.
  const activeModuleId = getModule(lockedModule) ? lockedModule : null
  const showSelection = !activeModuleId || viewingSelection

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <header className="w-full py-6 px-4 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200 font-black text-xl">
            Q
          </span>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Quiz Center</h1>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm font-black text-gray-800 tracking-tight">{user.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-100 hover:shadow-lg transition-all duration-300 group"
              title="Déconnexion"
              aria-label="Se déconnecter"
            >
              <LogOut size={20} className="group-hover:rotate-12 transition-transform" aria-hidden="true" />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {!user ? (
          <Auth />
        ) : showSelection ? (
          <ModuleSelection
            activeModuleId={activeModuleId}
            onSelect={handleSelectModule}
            error={moduleError}
            onDismissError={() => setModuleError(null)}
          />
        ) : (
          <QuizApp user={user} moduleId={activeModuleId} onGoHome={() => setViewingSelection(true)} />
        )}
      </main>

      <footer className="w-full py-6 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Quiz Center Training
      </footer>
    </div>
  )
}

export default App
