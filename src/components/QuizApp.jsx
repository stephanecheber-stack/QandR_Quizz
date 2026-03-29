import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Award, BookOpen, Home, Settings, Info } from 'lucide-react';
import hamData from '../data/ham_questions.json';
import samData from '../data/sam_questions.json';

const QuizApp = () => {
  // --- Module Selection State ---
  const [selectedModule, setSelectedModule] = useState(() => {
    return localStorage.getItem('quiz_selected_module');
  });

  // --- Core State ---
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [sessionErrors, setSessionErrors] = useState([]);
  
  const [selectedAnswers, setSelectedAnswers] = useState([]); // Array for MCQ, Object for Matching
  const [isValidated, setIsValidated] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // --- Dynamic Dataset Base ---
  const allModuleQuestions = useMemo(() => {
    if (!selectedModule) return [];
    return selectedModule === 'HAM' ? hamData : samData;
  }, [selectedModule]);

  // --- Load Data when Module is selected ---
  useEffect(() => {
    if (selectedModule) {
      const prefix = `${selectedModule}_`;
      
      const savedQuestions = localStorage.getItem(`${prefix}current_questions`);
      
      setCurrentQuestions(savedQuestions ? JSON.parse(savedQuestions) : allModuleQuestions);
      
      const savedIndex = localStorage.getItem(`${prefix}current_index`);
      setCurrentIndex(savedIndex ? parseInt(savedIndex, 10) : 0);
      
      const savedScore = localStorage.getItem(`${prefix}score`);
      setScore(savedScore ? parseInt(savedScore, 10) : 0);
      
      const savedErrors = localStorage.getItem(`${prefix}session_errors`);
      setSessionErrors(savedErrors ? JSON.parse(savedErrors) : []);
      
      localStorage.setItem('quiz_selected_module', selectedModule);
    } else {
      localStorage.removeItem('quiz_selected_module');
      // Reset state when going home
      setCurrentQuestions([]);
      setCurrentIndex(0);
      setScore(0);
      setSessionErrors([]);
    }
  }, [selectedModule, allModuleQuestions]);

  // --- Persistent Storage ---
  useEffect(() => {
    if (selectedModule && currentQuestions.length > 0) {
      const prefix = `${selectedModule}_`;
      localStorage.setItem(`${prefix}current_index`, currentIndex.toString());
      localStorage.setItem(`${prefix}score`, score.toString());
      localStorage.setItem(`${prefix}current_questions`, JSON.stringify(currentQuestions));
      localStorage.setItem(`${prefix}session_errors`, JSON.stringify(sessionErrors));
    }
  }, [currentIndex, score, currentQuestions, sessionErrors, selectedModule]);

  const currentQuestion = currentQuestions[currentIndex];

  // --- MCQ: Shuffled Options ---
  const shuffledOptions = useMemo(() => {
    if (!currentQuestion || currentQuestion.type === 'matching') return [];
    return Object.entries(currentQuestion.options).sort(() => Math.random() - 0.5);
  }, [currentQuestion?.id || currentQuestion?.question_id]);

  // --- Matching: Shuffled Right Column Values ---
  const shuffledMatchingValues = useMemo(() => {
    if (!currentQuestion || currentQuestion.type !== 'matching') return [];
    return Object.values(currentQuestion.pairs).sort(() => Math.random() - 0.5);
  }, [currentQuestion?.id || currentQuestion?.question_id]);

  const handleModuleSelect = (module) => {
    setSelectedModule(module);
    setSelectedAnswers([]);
    setIsValidated(false);
    setIsFinished(false);
  };

  const handleGoHome = () => {
    setSelectedModule(null);
  };

  // --- MCQ: Answer Toggle ---
  const handleOptionToggle = (optionKey) => {
    if (isValidated) return;

    setSelectedAnswers(prev => {
        const isCurrentlyArray = Array.isArray(prev);
        const currentSelection = isCurrentlyArray ? prev : [];
        
        return currentSelection.includes(optionKey) 
          ? currentSelection.filter(key => key !== optionKey) 
          : [...currentSelection, optionKey];
    });
  };

  // --- Matching: Value Association ---
  const handleMatchingChange = (key, value) => {
    if (isValidated) return;
    
    setSelectedAnswers(prev => {
        const currentSelection = (typeof prev === 'object' && !Array.isArray(prev)) ? prev : {};
        const newSelection = { ...currentSelection };
        if (value === "") {
            delete newSelection[key];
        } else {
            newSelection[key] = value;
        }
        return newSelection;
    });
  };

  const handleValidate = () => {
    let isCorrect = false;

    if (currentQuestion.type === 'matching') {
        const userPairs = selectedAnswers || {};
        const correctPairs = currentQuestion.pairs;
        const keys = Object.keys(correctPairs);
        
        isCorrect = keys.length > 0 && 
                   keys.every(k => userPairs[k] === correctPairs[k]) &&
                   Object.keys(userPairs).length === keys.length;
    } else {
        // MCQ logic
        const userSelection = Array.isArray(selectedAnswers) ? selectedAnswers : [];
        if (userSelection.length === 0) return;
        
        const correctAnswers = currentQuestion.correct_answers;
        isCorrect = 
          userSelection.length === correctAnswers.length && 
          userSelection.every(val => correctAnswers.includes(val));
    }

    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      setSessionErrors(prev => {
        const qId = currentQuestion.id || currentQuestion.question_id;
        if (prev.find(q => (q.id || q.question_id) === qId)) return prev;
        return [...prev, currentQuestion];
      });
    }

    setIsValidated(true);
  };

  const handleNext = () => {
    if (currentIndex < currentQuestions.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextQuestion = currentQuestions[nextIndex];
      setCurrentIndex(nextIndex);
      setSelectedAnswers(nextQuestion.type === 'matching' ? {} : []);
      setIsValidated(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    if (window.confirm("Êtes-vous sûr de vouloir tout recommencer ? Votre progression pour ce module sera perdue.")) {
      setCurrentIndex(0);
      setScore(0);
      setCurrentQuestions(allModuleQuestions);
      setSessionErrors([]);
      const startQuestion = allModuleQuestions[0];
      setSelectedAnswers(startQuestion?.type === 'matching' ? {} : []);
      setIsValidated(false);
      setIsFinished(false);
      
      const prefix = `${selectedModule}_`;
      localStorage.removeItem(`${prefix}current_index`);
      localStorage.removeItem(`${prefix}score`);
      localStorage.removeItem(`${prefix}current_questions`);
      localStorage.removeItem(`${prefix}session_errors`);
    }
  };

  const handleReplayErrors = () => {
    setCurrentIndex(0);
    setScore(0);
    const questionsToReplay = sessionErrors;
    setCurrentQuestions(questionsToReplay);
    setSessionErrors([]);
    const startQuestion = questionsToReplay[0];
    setSelectedAnswers(startQuestion?.type === 'matching' ? {} : []);
    setIsValidated(false);
    setIsFinished(false);
  };

  // --- RENDER: Selection Screen ---
  if (!selectedModule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">Quiz Training</h1>
          <p className="text-xl text-gray-500 font-medium">Choisissez votre module d'entraînement</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* HAM Card */}
          <div 
            onClick={() => handleModuleSelect('HAM')}
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
                Commencer <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </div>

          {/* SAM Card */}
          <div 
            onClick={() => handleModuleSelect('SAM')}
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
                Commencer <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: Results ---
  if (isFinished) {
    const totalQuestions = currentQuestions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const hasPerfectScore = sessionErrors.length === 0;
    
    let colorClass = "text-red-500";
    let message = "Continuez vos efforts ! La pratique est la clé.";
    
    if (hasPerfectScore) {
      colorClass = "text-green-500 text-3xl font-black";
      message = "Félicitations, vous maîtrisez toutes les questions !";
    } else if (percentage >= 80) {
      colorClass = "text-green-500";
      message = "Excellent ! Vous maîtrisez parfaitement le sujet.";
    } else if (percentage >= 50) {
      colorClass = "text-orange-500";
      message = "Pas mal ! Encore un peu de révision pour atteindre l'excellence.";
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in px-4 py-8">
        <div className="glass-card p-10 rounded-3xl text-center max-w-lg w-full">
          <div className="bg-primary-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Award className="text-primary-600 w-12 h-12" />
          </div>
          
          <h2 className="text-4xl font-black text-gray-800 mb-2">Résultats</h2>
          <p className="text-gray-500 font-medium mb-8">
            {currentQuestions.length < allModuleQuestions.length ? "Mode Révision" : `Sujet : ${selectedModule === 'HAM' ? 'Hardware' : 'Software'} Asset Management`}
          </p>
          
          {!hasPerfectScore && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm">
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Score</div>
                <div className="text-3xl font-black text-gray-800">
                  {score} <span className="text-lg text-gray-400 font-normal">/ {totalQuestions}</span>
                </div>
              </div>
              
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm">
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Réussite</div>
                <div className={`text-3xl font-black ${colorClass}`}>
                  {percentage}%
                </div>
              </div>
            </div>
          )}
          
          <div className={`mb-10 font-bold ${hasPerfectScore ? colorClass : 'text-lg font-medium text-gray-700 italic'}`}>
            {hasPerfectScore ? (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle2 size={64} className="text-green-500 animate-bounce" />
                <span>{message}</span>
              </div>
            ) : (
              `"${message}"`
            )}
          </div>

          {!hasPerfectScore && sessionErrors.length > 0 && (
            <div className="mb-10 text-left">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <XCircle size={14} className="text-red-400" />
                Vos points d'amélioration ({sessionErrors.length})
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {sessionErrors.map((q, idx) => (
                  <div key={(q.id || q.question_id) || idx} className="p-4 bg-red-50/50 border border-red-100 rounded-xl text-left">
                    <p className="text-xs font-bold text-red-400 mb-1">Question {q.id || q.question_id || idx + 1}</p>
                    <p className="text-sm text-gray-700 font-medium leading-snug">{q.question}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            {!hasPerfectScore && sessionErrors.length > 0 && (
              <button 
                onClick={handleReplayErrors}
                className="btn bg-orange-500 hover:bg-orange-600 text-white w-full flex items-center justify-center gap-2 py-5 text-xl shadow-lg shadow-orange-500/20"
              >
                <Award size={24} />
                Rejouer uniquement mes erreurs
              </button>
            )}
            
            <button 
              onClick={handleRestart}
              className="btn btn-primary w-full flex items-center justify-center gap-2 py-5 text-xl shadow-lg shadow-primary-500/20"
            >
              <RotateCcw size={24} />
              Recommencer tout le QCM
            </button>

            <button 
              onClick={handleGoHome}
              className="btn bg-gray-100 hover:bg-gray-200 text-gray-600 w-full flex items-center justify-center gap-2 py-4 shadow-sm"
            >
              <Home size={20} />
              Quitter ce module
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: Main Quiz ---
  if (!currentQuestion) return (
    <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-gray-400 font-medium">Chargement du module...</div>
    </div>
  );

  const totalQuestions = currentQuestions.length;

  return (
    <div className="max-w-3xl mx-auto w-full py-8 px-4 animate-fade-in">
      {/* progress header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex justify-between items-center text-sm font-semibold text-gray-500">
          <button 
            onClick={handleGoHome}
            className="flex items-center gap-2 text-gray-400 hover:text-primary-600 transition-colors bg-white/50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm"
          >
            <Home size={18} />
            <span className="hidden sm:inline">Accueil</span>
          </button>
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-gray-500">
              <BookOpen size={16} className="text-primary-500" />
               <span className="text-gray-800 font-black">{currentIndex + 1}</span> / {totalQuestions}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full border border-primary-100 flex items-center gap-2 font-bold">
                {currentQuestions.length < allModuleQuestions.length && <Award size={14} className="text-orange-500" />}
                {score} pts
              </span>
              <button 
                onClick={handleRestart}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Recommencer"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-primary-500 transition-all duration-500 shadow-[0_0_10px_rgba(var(--primary-500),0.5)]" 
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden animate-slide-up shadow-2xl border border-white/40">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${selectedModule === 'HAM' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                  Module {selectedModule}
              </span>
              {currentQuestion.type === 'matching' && (
                  <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                      Association
                  </span>
              )}
              {currentQuestions.length < allModuleQuestions.length && (
                  <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                      Révision
                  </span>
              )}
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 leading-tight mb-8">
            {currentQuestion.question.split(/(\([^)]+\))/g).map((part, index) => 
              part.startsWith('(') && part.endsWith(')') ? (
                <span key={index} className="text-red-600 font-bold">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </h1>

          {/* --- UI COMPONENT: Matching Questions --- */}
          {currentQuestion.type === 'matching' ? (
            <div className="space-y-4">
                {Object.keys(currentQuestion.pairs).map((key) => {
                    const userSelection = selectedAnswers[key] || "";
                    const isCorrect = userSelection === currentQuestion.pairs[key];
                    
                    let selectClasses = "bg-gray-50 border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100";
                    
                    if (isValidated) {
                        selectClasses = isCorrect 
                            ? "bg-green-50 border-green-500 text-green-700 shadow-[0_0_10px_rgba(34,197,94,0.1)] pr-10" 
                            : "bg-red-50 border-red-500 text-red-700 shadow-[0_0_10px_rgba(239,68,68,0.1)] pr-10";
                    }

                    return (
                        <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl group hover:shadow-md transition-all duration-300">
                            <div className="flex-1 font-bold text-gray-700 min-w-0 break-words">
                                {key}
                            </div>
                            <div className="relative flex-1">
                                <select 
                                    value={userSelection}
                                    onChange={(e) => handleMatchingChange(key, e.target.value)}
                                    disabled={isValidated}
                                    className={`w-full p-3.5 rounded-xl border-2 font-bold text-sm appearance-none cursor-pointer transition-all duration-300 outline-none ${selectClasses}`}
                                >
                                    <option value="">Sélectionnez une correspondance...</option>
                                    {shuffledMatchingValues.map((val) => (
                                        <option key={val} value={val}>{val}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-primary-500 transition-colors">
                                    {isValidated ? (
                                        isCorrect ? <CheckCircle2 size={18} className="text-green-500" /> : <XCircle size={18} className="text-red-500" />
                                    ) : (
                                        <ChevronRight size={18} className="rotate-90" />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
          ) : (
            /* --- UI COMPONENT: MCQ Questions --- */
            <div className="space-y-3">
                {shuffledOptions.map(([originalKey, value], index) => {
                const displayLetter = String.fromCharCode(65 + index);
                const userSelection = Array.isArray(selectedAnswers) ? selectedAnswers : [];
                const isSelected = userSelection.includes(originalKey);
                const isCorrect = currentQuestion.correct_answers.includes(originalKey);
                
                let statusClasses = "border-gray-100 hover:border-primary-200 hover:bg-primary-50 hover:translate-x-1";
                
                if (isSelected) {
                    statusClasses = "border-primary-500 bg-primary-50 ring-2 ring-primary-500/20 translate-x-1";
                }

                if (isValidated) {
                    if (isCorrect) {
                        statusClasses = "border-green-500 bg-green-50 ring-0 translate-x-0";
                    } else if (isSelected && !isCorrect) {
                        statusClasses = "border-red-500 bg-red-50 ring-0 translate-x-0";
                    } else {
                        statusClasses = "border-gray-100 opacity-60 translate-x-0";
                    }
                }

                return (
                    <div 
                    key={`${currentQuestion.id || currentQuestion.question_id}-${originalKey}`}
                    onClick={() => handleOptionToggle(originalKey)}
                    className={`
                        flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300
                        ${statusClasses}
                        ${isValidated ? 'pointer-events-none' : ''}
                    `}
                    >
                    <div className={`
                        w-11 h-11 flex items-center justify-center rounded-xl font-black text-lg shrink-0 transition-all duration-300
                        ${isSelected ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 rotate-3' : 'bg-gray-100 text-gray-500'}
                        ${isValidated && isCorrect ? 'bg-green-600 !text-white !rotate-0' : ''}
                        ${isValidated && isSelected && !isCorrect ? 'bg-red-600 !text-white !rotate-0' : ''}
                    `}>
                        {displayLetter}
                    </div>
                    <div className="flex-1 text-gray-700 font-bold leading-snug">
                        {value}
                    </div>
                    <div className="shrink-0">
                        {isValidated ? (
                        isCorrect ? (
                            <CheckCircle2 className="text-green-600" size={26} />
                        ) : isSelected ? (
                            <XCircle className="text-red-600" size={26} />
                        ) : null
                        ) : (
                        <div className={`
                            w-6 h-6 border-2 rounded-lg transition-all duration-300
                            ${isSelected ? 'bg-primary-600 border-primary-600 scale-110' : 'border-gray-200'}
                        `} />
                        )}
                    </div>
                    </div>
                );
                })}
            </div>
          )}
        </div>

        {isValidated && (
          <div className="bg-gray-50/80 backdrop-blur-md px-8 py-7 border-t border-gray-100 flex flex-col gap-5 animate-fade-in">
             <div className="flex items-start gap-4">
              <div className={`mt-1.5 h-3 w-3 rounded-full shrink-0 ${
                (currentQuestion.type === 'matching' 
                  ? Object.keys(currentQuestion.pairs).every(k => selectedAnswers[k] === currentQuestion.pairs[k])
                  : (Array.isArray(selectedAnswers) && selectedAnswers.length === currentQuestion.correct_answers.length && 
                     selectedAnswers.every(val => currentQuestion.correct_answers.includes(val))))
                  ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
              }`} />
              <div>
                <p className="font-black text-gray-900 text-lg">
                  {(currentQuestion.type === 'matching' 
                  ? Object.keys(currentQuestion.pairs).every(k => selectedAnswers[k] === currentQuestion.pairs[k])
                  : (Array.isArray(selectedAnswers) && selectedAnswers.length === currentQuestion.correct_answers.length && 
                     selectedAnswers.every(val => currentQuestion.correct_answers.includes(val))))
                    ? "Félicitations ! Toutes les réponses sont correctes." 
                    : "Certaines réponses sont incorrectes. Regardez les détails ci-dessus."}
                </p>
                {currentQuestion.explanation && (
                  <p className="text-gray-600 font-medium text-sm mt-2 leading-relaxed bg-white/50 p-4 rounded-xl border border-white">
                      <span className="font-black text-xs uppercase tracking-widest text-gray-400 block mb-1">Explication</span>
                      {currentQuestion.explanation}
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={handleNext}
              className="btn btn-primary w-full flex items-center justify-center gap-3 py-5 text-xl group shadow-xl shadow-primary-500/20 rounded-2xl"
            >
              {currentIndex < totalQuestions - 1 ? 'Question suivante' : 'Voir le score final'}
              <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        )}

        {!isValidated && (
          <div className="px-8 py-7 border-t border-gray-100 bg-white">
            <button 
              onClick={handleValidate}
              disabled={Object.keys(selectedAnswers).length === 0}
              className="btn btn-primary w-full py-5 text-xl font-black rounded-2xl shadow-xl shadow-primary-500/10 disabled:opacity-50 disabled:shadow-none"
            >
              Vérifier mes associations
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizApp;
