# 🎓 Quiz Center — Entraînement aux certifications ServiceNow

[![Framework: React](https://img.shields.io/badge/Framework-React-61DAFB?logo=react)](https://reactjs.org/)
[![Build: Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite)](https://vitejs.dev/)
[![Deployment: Vercel](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)](https://vercel.com)

Application web personnelle de révision pour les certifications ServiceNow :
**HAM** (Hardware Asset Management), **SAM** (Software Asset Management) et
**ITSM** (CIS-ITSM). ~600 questions au total, réparties en trois modules.

---

## 1. Concept

Single Page Application React : l'interface se charge une fois, le passage d'une
question à l'autre est instantané. Il n'y a **pas de serveur applicatif** — les
questions sont des fichiers JSON statiques et Firebase assure l'authentification
et la sauvegarde de la progression.

### Fonctionnalités pédagogiques

* **Ordre aléatoire** — les questions et les propositions sont mélangées à
  chaque nouvelle session (Fisher-Yates seedé), ce qui casse la mémorisation par
  position. Le seed étant sauvegardé, un rechargement de page conserve
  exactement le même ordre.
* **Mode révision** — les erreurs sont mémorisées ; en fin de session on peut
  rejouer uniquement les questions ratées. Cette session de révision ne modifie
  pas la progression enregistrée du module.
* **Explications** — texte pédagogique après validation, complété à la demande
  par un LLM local (Ollama) pour approfondir.
* **Chronomètre** — temps passé par question, restitué dans les résultats
  (temps total, moyenne, questions les plus longues).
* **Questions d'association** — listes déroulantes pour les questions
  « matching » (module SAM).

---

## 2. Stack technique

| Couche | Technologie |
| --- | --- |
| Interface | React 18 + Vite, Tailwind CSS, lucide-react |
| Données | Fichiers JSON statiques (`src/data/`), chargés à la demande par module |
| Auth & persistance | Firebase Auth (email + Google) et Firestore (`users/{uid}`) |
| IA locale (optionnelle) | Ollama + modèle `gemma4`, proxifié par Vite sur `/ollama` |
| Hébergement | Vercel (déploiement continu depuis GitHub) |

### Organisation du code

```
src/
  App.jsx                    porte d'entrée : auth, choix du module, mise en page
  modules.js                 registre des modules (métadonnées + import dynamique du JSON)
  firebase.js                initialisation Firebase
  components/
    Auth.jsx                 écran de connexion
    ModuleSelection.jsx      cartes de choix du module
    QuizApp.jsx              moteur de quiz (état de session, sauvegarde, chrono)
    QuestionCard.jsx         énoncé + propositions (QCM et association)
    AnswerFeedback.jsx       verdict, explication, explication IA
    QuizResults.jsx          écran de fin de session
    ErrorBoundary.jsx        filet de sécurité en cas d'erreur de rendu
  lib/
    quiz.js                  règles de correction (pur JavaScript)
    progress.js              lecture/écriture Firestore de la progression
    shuffle.js               Fisher-Yates + générateur pseudo-aléatoire seedé
    format.js                formatage des durées
    ollama.js                appel au LLM local
```

---

## 3. Démarrage

```bash
npm install
npm run dev        # serveur de développement sur http://localhost:5175
```

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement (port 5175, fixe) |
| `npm run build` | build de production dans `dist/` |
| `npm run preview` | prévisualise le build de production |
| `npm run lint` | ESLint |
| `npm test` | tests unitaires (Vitest) |
| `npm run test:watch` | tests relancés à chaque modification |
| `npm run check:data` | valide les banques de questions (ids, options, réponses, compteurs) |
| `npm run gen:explanations -- itsm` | génère les explications manquantes via Ollama |

> Les tests unitaires (Vitest) couvrent la logique pure de `src/lib/` : règles
> de correction, mélange seedé, formatage des durées. Ils sont placés à côté du
> code testé (`quiz.test.js`, etc.).

### IA locale (facultatif)

Les boutons « Approfondir avec l'IA » appellent Ollama sur
`http://localhost:11434` (proxifié par Vite via `/ollama`). Sans Ollama lancé,
l'application affiche un message explicite — le reste fonctionne normalement.

```bash
ollama serve
ollama pull gemma4
```

---

## 4. Sécurité

* Les clés Firebase de `src/firebase.js` sont **publiques par conception** :
  c'est le fonctionnement normal d'une application web Firebase.
* La protection réelle repose sur les règles Firestore. Le contenu attendu est
  versionné dans [`firestore.rules`](firestore.rules) et doit être publié depuis
  la console Firebase (Firestore Database → Règles).
* Aucun secret ne doit être committé ; les fichiers `.env` sont ignorés par Git.

---

## 5. Ajouter un module

1. Déposer le fichier JSON dans `src/data/` (format décrit dans
   [`src/data/README.md`](src/data/README.md)).
2. Ajouter une entrée dans `src/modules.js`.
3. Lancer `npm run check:data`.

L'écran de sélection et le moteur de quiz se mettent à jour automatiquement.

---

## 6. Mention légale

Plateforme d'entraînement indépendante, **non affiliée** à ServiceNow, Inc.
ServiceNow, HAM, SAM et ITSM sont des marques de leurs propriétaires respectifs.
