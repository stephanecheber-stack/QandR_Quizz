import React, { useState, useEffect } from 'react';
import QuizApp from './components/QuizApp';
import Auth from './components/Auth';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { LogOut, Loader2, BookOpen, ChevronRight, Settings, Info } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewingSelection, setViewingSelection] = useState(false);

  useEffect(() => {
    let unsubscribeDoc = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Real-time listener for user data (flags, progress, lock)
        const userRef = doc(db, "users", currentUser.uid);
        unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            // Initialize user doc if it doesn't exist
            setUserData({
              lockedModule: null,
              hasPaid: false,
              isVIP: false,
              accessExpiration: null,
              progress: {}
            });
          }
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDoc();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSelectModule = async (module) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        lockedModule: module,
        hasPaid: userData?.isVIP ? true : false, // VIPs are always "paid"
        isVIP: userData?.isVIP || false,
        accessExpiration: null
      }, { merge: true });
      
      if (userData?.isVIP) {
        setViewingSelection(false);
      }
    } catch (error) {
      console.error("Error locking module:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin text-primary-500" />
          <p className="text-gray-500 font-bold animate-pulse">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  // --- UI: Module Selection Screen (Unauthentified or Not Locked) ---
  const renderSelectionScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">Quiz Training</h1>
        <p className="text-xl text-gray-500 font-medium">Choisissez votre module pour commencer votre licence</p>
        {!userData?.isVIP && (
          <p className="text-sm text-red-500 font-bold mt-2 uppercase tracking-widest">Attention : Ce choix est définitif</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* HAM Card */}
        <div 
          onClick={() => handleSelectModule('HAM')}
          className="group relative bg-white rounded-[2rem] p-8 border-2 border-transparent hover:border-primary-500 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 cursor-pointer overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Settings size={120} />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <BookOpen className="text-orange-600" size={32} />
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-2">HAM</h2>
            <p className="text-gray-500 font-medium leading-relaxed">Hardware Asset Management</p>
            <div className="mt-8 flex items-center text-primary-600 font-bold gap-2">
              Verrouiller ce module <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>

        {/* SAM Card */}
        <div 
          onClick={() => handleSelectModule('SAM')}
          className="group relative bg-white rounded-[2rem] p-8 border-2 border-transparent hover:border-primary-500 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 cursor-pointer overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Info size={120} />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <BookOpen className="text-blue-600" size={32} />
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-2">SAM</h2>
            <p className="text-gray-500 font-medium leading-relaxed">Software Asset Management</p>
            <div className="mt-8 flex items-center text-primary-600 font-bold gap-2">
              Verrouiller ce module <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <header className="w-full py-6 px-4 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
            <span className="font-black text-xl">Q</span>
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Quiz Center</h1>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-black text-gray-800 tracking-tight">{user.email}</span>
              <span className="text-[10px] uppercase font-bold text-green-500 tracking-widest">
                {userData?.hasPaid ? "Licence Active" : "Essai Gratuit"}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-100 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300 group"
              title="Déconnexion"
            >
              <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {!user ? (
          <Auth />
        ) : (!userData?.lockedModule || viewingSelection) ? (
          renderSelectionScreen()
        ) : (
          <QuizApp 
            user={user} 
            userData={userData} 
            onGoHome={() => setViewingSelection(true)} 
          />
        )}
      </main>

      <footer className="w-full py-6 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Quiz Center Training. Tous droits réservés.
      </footer>
    </div>
  );
}

export default App;
