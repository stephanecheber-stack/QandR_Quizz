# 🎓 Quiz Center (ServiceNow HAM / SAM)

**Quiz Center** est une plateforme web interactive d'apprentissage et d'entraînement aux certifications ServiceNow (Hardware Asset Management & Software Asset Management). 

Conçue avec une approche "Mobile-first" et "Serverless", l'application offre une expérience fluide, instantanée et persistante, sans nécessiter de création de compte.

---

## 🚀 1. Vue d'ensemble et Concept
L'application a été construite comme une **Single Page Application (SPA)**. Contrairement aux sites web classiques, l'interface se charge une seule fois dans le navigateur de l'utilisateur. Le passage d'une question à l'autre se fait instantanément, sans aucun temps de rechargement, offrant une fluidité similaire à celle d'une application mobile native.

---

## 🧠 2. Fonctionnalités Pédagogiques Avancées
Le moteur du Quiz Center a été pensé pour maximiser la rétention d'information (e-learning) :

* **Anti-mémoire visuelle (Shuffling) :** À chaque tentative, les options des QCM sont mélangées aléatoirement en arrière-plan. L'utilisateur est forcé de lire le contenu de la réponse plutôt que de mémoriser sa position (A, B, C ou D).
* **Boucle de Flashcards (Revanche) :** Les erreurs de l'utilisateur sont traquées. À la fin du QCM, un mode "Refaire mes erreurs" génère un sous-paquet avec uniquement les questions ratées, créant une boucle de révision infinie jusqu'au sans-faute.
* **Explications contextuelles :** Après validation d'une réponse, un bouton permet de révéler une explication pédagogique détaillée tirée de la documentation officielle de ServiceNow.
* **Questions interactives (Matching) :** Support des questions d'association via des listes déroulantes intelligentes, reflétant les véritables conditions d'examen.

---

## 🏗️ 3. Architecture Technologique (Les 3 Piliers)

L'architecture suit le principe du **"Data-Driven"** : le moteur (le code) est séparé du carburant (les questions).

### A. L'Interface (Front-end)
* **React.js (via Vite) :** Assure la réactivité de l'interface et des performances de rendu extrêmes.
* **Tailwind CSS :** Framework utilitaire garantissant un design moderne (glassmorphism), épuré et 100% responsive (adapté aux smartphones, tablettes et PC).
* **Lucide-React :** Bibliothèque d'icônes vectorielles légères.

### B. Le Moteur de Données (JSON)
Pas de base de données lourde (SQL). La donnée est stockée dans des fichiers statiques :
* `ham_questions.json`
* `sam_questions.json`
* **Avantage :** L'ajout d'un nouveau module (ex: ITSM) consiste simplement à déposer un nouveau fichier JSON dans le répertoire. Le chargement est instantané.

### C. La Persistance (State & LocalStorage)
La progression (score, question en cours, historique des erreurs) est sauvegardée directement dans la mémoire locale du navigateur de l'utilisateur (`localStorage`). 
* **Avantage :** Un utilisateur peut fermer son onglet, revenir 3 jours plus tard et reprendre son examen exactement là où il s'était arrêté.
* **Isolation :** Les sauvegardes sont cloisonnées par module (la sauvegarde HAM n'interfère pas avec la sauvegarde SAM).

---

## ☁️ 4. Infrastructure Cloud et CI/CD

L'application est hébergée sur le Cloud et bénéficie d'une chaîne de déploiement totalement automatisée.

* **Dépôt du code :** GitHub (`stephanecheber-stack/QandR_Quizz`).
* **Hébergement :** Vercel (Plateforme Edge Network / CDN mondial).
* **CI/CD (Déploiement Continu) :** Le projet bénéficie d'un workflow "Push-to-Deploy". Chaque modification de code ou ajout de question poussé sur GitHub déclenche instantanément une reconstruction du site par Vercel, et une mise en ligne en quelques secondes, sans aucune action manuelle.

---

## 🛠️ 5. Guide du Développeur (Local)

Pour faire tourner le projet sur un ordinateur local pour le développement :

1. Cloner le dépôt GitHub.
2. Ouvrir le terminal dans le dossier du projet.
3. Installer les dépendances :
   ```bash
   npm install