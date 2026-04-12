import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { LogIn, UserPlus, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            console.error(err);
            let message = "Une erreur est survenue.";
            if (err.code === 'auth/wrong-password') message = "Mot de passe incorrect.";
            if (err.code === 'auth/user-not-found') message = "Utilisateur non trouvé.";
            if (err.code === 'auth/email-already-in-use') message = "Cet email est déjà utilisé.";
            if (err.code === 'auth/invalid-email') message = "Format d'email invalide.";
            if (err.code === 'auth/weak-password') message = "Le mot de passe doit faire au moins 6 caractères.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error(err);
            if (err.code !== 'auth/popup-closed-by-user') {
                setError("La connexion avec Google a échoué.");
            }
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-fade-in relative">
                {/* Decorative background elements */}
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>

                <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/40 shadow-2xl relative z-10">
                    <div className="p-8 sm:p-10">
                        <div className="flex justify-center mb-8">
                            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-500/20 rotate-3">
                                {isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-gray-800 tracking-tight mb-2">
                                {isLogin ? 'Bon retour !' : 'Créer un compte'}
                            </h2>
                            <p className="text-gray-500 font-medium tracking-tight">
                                {isLogin ? 'Connectez-vous pour continuer votre entraînement' : 'Rejoignez la plateforme Quiz Center'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-slide-up">
                                <AlertCircle size={20} className="shrink-0" />
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-white/50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition-all duration-300 font-bold text-gray-700 placeholder:text-gray-400 shadow-sm"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-white/50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition-all duration-300 font-bold text-gray-700 placeholder:text-gray-400 shadow-sm"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 mt-4 bg-primary-600 hover:bg-primary-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-primary-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    isLogin ? 'Se connecter' : "S'inscrire"
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center px-4">
                            <button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError('');
                                }}
                                className="text-gray-500 font-bold hover:text-primary-600 transition-colors text-sm underline decoration-gray-300 underline-offset-4"
                            >
                                {isLogin ? "Vous n'avez pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
                            </button>
                        </div>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white/50 backdrop-blur-sm text-gray-400 font-black uppercase tracking-widest text-[10px]">OU</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleSignIn}
                            className="w-full py-4 bg-white/80 border border-gray-100 hover:border-primary-200 hover:bg-white text-gray-700 font-black rounded-2xl shadow-sm transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 group"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M12 5.04c1.9 0 3.61.66 4.95 1.94l3.71-3.71C18.41 1.17 15.42 0 12 0 7.31 0 3.26 2.69 1.25 6.64l4.31 3.34c1.01-3.05 3.86-5.28 6.44-5.28z"/>
                                <path fill="#4285F4" d="M23.49 12.27c0-.86-.08-1.7-.22-2.52H12v4.77h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.71 3.71c2.17-2 3.42-4.93 3.42-8.21z"/>
                                <path fill="#FBBC05" d="M5.56 14.71c-.26-.77-.4-1.6-.4-2.46s.14-1.69.4-2.46L1.25 6.44C.45 8.12 0 10.01 0 12s.45 3.88 1.25 5.56l4.31-3.34-.01.49z"/>
                                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.71-3.71c-1.1.74-2.51 1.18-4.24 1.18-3.23 0-5.96-2.18-6.94-5.11l-4.31 3.34C3.26 21.31 7.31 24 12 24z"/>
                            </svg>
                            Continuer avec Google
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
