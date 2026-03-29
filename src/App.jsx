import QuizApp from './components/QuizApp'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <header className="w-full py-6 px-4 flex justify-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
            <span className="font-black text-xl">Q</span>
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Quiz Center</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <QuizApp />
      </main>

      <footer className="w-full py-6 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Quiz Center Training. Tous droits réservés.
      </footer>
    </div>
  )
}

export default App
