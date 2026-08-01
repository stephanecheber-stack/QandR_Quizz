# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Quiz Center" — a single-user React SPA for training on ServiceNow certifications (HAM, SAM, ITSM). ~188-220 MCQ/matching questions per module, sourced from static JSON files. No backend server; Firebase (Auth + Firestore) provides login and cross-device progress sync, with a `syncError` banner shown if Firestore calls fail.

There is no Python code, no Supabase, and no backend server here — the whole app is the Vite/React frontend described below.

## Commands

```bash
npm install                       # install deps
npm run dev                       # Vite dev server on port 5175 (strictPort)
npm run build                     # production build to dist/
npm run preview                   # preview the production build
npm run lint                      # ESLint (flat config in eslint.config.js)
npm run check:data                # validate the question banks
npm run gen:explanations -- itsm  # fill missing explanations via local Ollama
```

There is no test runner configured in this project. `npm run check:data` is the closest thing to a regression check — run it after touching any file in `src/data/`.

## Architecture

**Data-driven, three-layer design:**
1. **UI** — `src/App.jsx` is the auth gate + layout; it renders `ModuleSelection` or `QuizApp`. `QuizApp.jsx` owns all session state and delegates rendering to `QuestionCard`, `AnswerFeedback` and `QuizResults`.
2. **Data** — one static JSON file per module in `src/data/`, referenced from the registry `src/modules.js` and pulled in with a **dynamic import** so only the opened module is downloaded.
3. **Persistence** — Firestore `users/{uid}`, with `lockedModule` and `progress[moduleId]` = `{ currentIndex, score, errorIds, timings, orderSeed, finished, updatedAt }`. All Firestore access for progress goes through `src/lib/progress.js`, which also migrates the legacy `sessionErrors` field to `errorIds`.

**Pure logic lives in `src/lib/`** (no React, no Firebase): `quiz.js` (correction rules), `shuffle.js` (seeded Fisher-Yates), `format.js`, plus `ollama.js` and `progress.js` for I/O.

**Adding a module** = drop the JSON in `src/data/` + add one entry to `MODULES` in `src/modules.js` (including `questionCount`, which `check:data` verifies) + run `npm run check:data`. Nothing else to touch.

**Question schema** (JSON files are UTF-8 with BOM — strip/restore it in scripts):
- MCQ: `{ id, question, options: {A: "..."}, correct_answers: ["C","D"], explanation }` — multi-select, all-or-nothing grading; `(...)` segments in `question` (e.g. "(Choose three.)") are highlighted red.
- Matching (`sam_questions.json` only): `{ id, question, type: "matching", pairs: {left: right}, explanation }` — dropdowns, right-hand values shuffled. Right-hand values must be unique or grading is ambiguous.

**Module lock model**: the chosen module is written to `users/{uid}.lockedModule` and drives the whole session until the user goes home (`onGoHome`) to switch.

**Quiz mechanics in `QuizApp.jsx`**:
- Question order *and* option order derive from a per-session `orderSeed` (persisted). Same seed ⇒ same order, so reloading the page is seamless; `handleRestart` mints a new seed.
- Firestore writes are debounced (`SAVE_DEBOUNCE_MS`, 800 ms).
- **Revision mode** (`revisionQuestions !== null`, entered via "Rejouer mes erreurs"): progress is deliberately **not** persisted, so replaying errors never overwrites the module's real progress.
- Per-question stopwatch (count-up); timings feed the results screen (total, average, slowest questions).
- Optional local-LLM explanations (`src/lib/ollama.js`) POST to `/ollama/api/generate`, proxied by Vite to `http://localhost:11434` (Ollama, model `gemma4`). Without Ollama running, `AnswerFeedback` shows an explicit error message.

**Firebase**: config in `src/firebase.js` (client-side keys, public by design). Auth = email/password + Google popup (`src/components/Auth.jsx`). The real access control is `firestore.rules`, which must be published manually from the Firebase console.

**Styling**: Tailwind with a custom `primary` scale and `fade-in`/`slide-up` keyframes (`tailwind.config.js`); `glass-card`, `btn`, `custom-scrollbar` are defined in `src/index.css`. Tailwind classes must be written in full — never built dynamically (`bg-orange-100`, not `` bg-`${c}`-100 ``).

## Préférences de travail (Stéphane)

**Niveau & pédagogie** : je suis débutant en développement. Explique toujours les actions pas à pas, en détail, même pour la configuration ou l'outillage. Précise où cliquer, quoi taper, et le résultat attendu à chaque étape.

**Lancement** : `npm run dev` → serveur Vite sur le port 5175 (port fixé pour cohabiter avec finance-app qui est sur 5173).

**Dépendance Ollama** : les explications par IA (`src/lib/ollama.js`) nécessitent qu'Ollama tourne en local sur le port 11434 avec le modèle `gemma4`. Sans Ollama lancé, l'interface affiche un message d'erreur explicite — le reste de l'application fonctionne normalement.

**Sécurité** : ne jamais exposer ou committer de secrets. Les clés Firebase dans `src/firebase.js` sont publiques par conception (normal pour une app web Firebase) ; la vraie protection est dans `firestore.rules`, à publier manuellement depuis la console Firebase. Tout `.env` reste exclu via `.gitignore`.

**Contexte métier** : app de révision pour les certifications ServiceNow (HAM, SAM, ITSM) — domaine d'expertise de l'utilisateur. Questions stockées en JSON statique, une par module.
