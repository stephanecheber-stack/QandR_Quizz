# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Quiz Center" — a single-user React SPA for training on ServiceNow certifications (HAM, SAM, ITSM). ~188-220 MCQ/matching questions per module, sourced from static JSON files. No backend server; Firebase (Auth + Firestore) provides login and cross-device progress sync, with a `syncError` banner shown if Firestore calls fail.

Note: the stub previously in this file (Python backoffice, Supabase) does not match this repo's actual stack — there is no Python code here. The entire app is the Vite/React frontend described below.

## Commands

```bash
npm install     # install deps
npm run dev     # Vite dev server on port 5175 (strictPort)
npm run build   # production build to dist/
npm run preview # preview the production build
npm run lint    # ESLint
```

There is no test runner configured in this project.

## Architecture

**Data-driven, three-layer design:**
1. **UI** — `src/App.jsx` (auth gate + module-selection screen + header/footer) renders `src/components/QuizApp.jsx` (the entire quiz engine) once a module is locked in.
2. **Data** — one static JSON file per module: `src/data/ham_questions.json`, `sam_questions.json`, `itsm_questions.json`. Adding a module = adding a JSON file plus a card in `App.jsx`'s `renderSelectionScreen` and an entry in `QuizApp.jsx`'s `allModuleQuestions` memo.
3. **Persistence** — Firebase Firestore under `users/{uid}`, storing `lockedModule`, `hasPaid`/`isVIP`/`accessExpiration` (freemium flags, currently unused in the simplified single-user flow), and `progress[module]` = `{ currentIndex, score, sessionErrors }`.

**Question schema** (JSON files are UTF-8 with BOM — read accordingly from scripts):
- MCQ: `{ id, question, options: {A: "...", ...}, correct_answers: ["C","D",...], explanation }` — multi-select; `question` text wrapped in `(...)` (e.g. "(Choose three.)") is highlighted red in the UI.
- Matching (`sam_questions.json` only): `{ id, question, type: "matching", pairs: {left: right, ...}, explanation }` — rendered as dropdowns, right-hand values shuffled.

**Module lock model**: a user picks one module (HAM/SAM/ITSM) which gets written to `users/{uid}.lockedModule`; the quiz for that module loads until the user explicitly goes home (`onGoHome`) to switch. Progress (index/score/errors) auto-saves to Firestore on every state change via `saveProgressToCloud`, and reloads from Firestore on module (re)selection via `loadProgressFromCloud`.

**Quiz mechanics in `QuizApp.jsx`**:
- Options/matching values are shuffled per-question via `useMemo` keyed on question id (prevents position memorization).
- 30s per-question countdown timer (cosmetic — does not auto-submit).
- "Revenge mode": wrong answers accumulate in `sessionErrors`; `handleReplayErrors` restarts a session using only those questions.
- Optional local-LLM explanations: `fetchGemmaExplanation` POSTs to `/ollama/api/generate`, proxied by Vite (`vite.config.js`) to `http://localhost:11434` (a local Ollama instance running the `gemma4` model). Only works when Ollama is running locally — expect it to silently fail otherwise.

**Firebase**: config lives in `src/firebase.js` (client-side keys, expected to be public for Firebase web apps). Auth supports email/password and Google popup sign-in (`src/components/Auth.jsx`).

**Styling**: Tailwind with a custom `primary` color scale and `fade-in`/`slide-up` keyframes (`tailwind.config.js`); glassmorphism (`glass-card`) utility classes used throughout.

## Préférences de travail (Stéphane)

**Niveau & pédagogie** : je suis débutant en développement. Explique toujours les actions pas à pas, en détail, même pour la configuration ou l'outillage. Précise où cliquer, quoi taper, et le résultat attendu à chaque étape.

**Lancement** : `npm run dev` → serveur Vite sur le port 5175 (port fixé pour cohabiter avec finance-app qui est sur 5173).

**Dépendance Ollama** : les explications par IA (`fetchGemmaExplanation`) nécessitent qu'Ollama tourne en local sur le port 11434. Sans Ollama lancé, cette fonctionnalité échoue silencieusement — c'est normal.

**Sécurité** : ne jamais exposer ou committer de secrets. Les clés Firebase dans `src/firebase.js` sont publiques par conception (normal pour une app web Firebase), mais tout `.env` reste exclu via `.gitignore`.

**Contexte métier** : app de révision pour les certifications ServiceNow (HAM, SAM, ITSM) — domaine d'expertise de l'utilisateur. Questions stockées en JSON statique, une par module.
