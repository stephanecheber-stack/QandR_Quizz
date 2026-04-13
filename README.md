# 🎓 Quiz Center - ServiceNow Training Platform (HAM & SAM)

[![License: Proprietary](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployment: Vercel](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)](https://vercel.com)
[![Framework: React](https://img.shields.io/badge/Framework-React-61DAFB?logo=react)](https://reactjs.org/)

**Quiz Center** est une plateforme SaaS moderne conçue pour l'apprentissage et l'entraînement intensif aux concepts de gestion d'actifs informatiques (**ITAM**) de ServiceNow. Elle propose des modules spécialisés pour le Hardware (**HAM**) et le Software (**SAM**).

Conçue avec une approche **"Mobile-first"** et **"Serverless"**, l'application offre une expérience fluide, instantanée et persistante, optimisée pour une préparation efficace aux certifications.

---

## 🚀 1. Concept et Architecture (L'Approche SPA)

L'application est construite comme une **Single Page Application (SPA)** évoluée. Contrairement aux sites classiques, l'interface se charge une seule fois : le passage entre les questions et les modules est instantané, sans aucun temps de rechargement, pour une fluidité identique à celle d'une application mobile native.

### L'Architecture "Data-Driven" (Les 3 Piliers)
Le projet sépare strictement le **moteur** (le code) du **carburant** (les données) :
1.  **L'Interface (Front-end) :** Un noyau React/Vite ultra-léger et un design "Glassmorphism" via Tailwind CSS.
2.  **Le Moteur de Données (JSON) :** Les questions sont structurées en fichiers JSON statiques (`ham_questions.json`, `sam_questions.json`), permettant un chargement immédiat et une extension facile à de nouveaux modules.
3.  **La Persistance Hybride :** Utilisation conjointe du `localStorage` pour la fluidité de la session en cours et de **Firebase Cloud** pour la sécurisation des profils et des abonnements.

---

## 🧠 2. Fonctionnalités Pédagogiques Avancées

Le moteur de Quiz a été pensé pour briser les mécanismes de mémorisation passive :

*   **⚡ Moteur Intelligent (Shuffling) :** Les options de réponse sont mélangées aléatoirement à chaque tentative pour forcer la lecture réelle plutôt que la mémoire visuelle de la position.
*   **🔄 Revenge Mode (Boucles de Révision) :** Les erreurs sont traquées dynamiquement. En fin de session, l'utilisateur peut relancer uniquement les questions échouées jusqu'au sans-faute.
*   **🧩 Types de Questions Variés :** Support des QCM classiques et des questions d'association (**Matching**) via des listes déroulantes interactives, reflétant les conditions réelles d'examen.
*   **📖 Pédagogie Intégrée :** Des explications détaillées et contextualisées sont disponibles après chaque réponse pour consolider les acquis théoriques.

---

## 💎 3. Modèle SaaS et Gestion des Accès

Quiz Center adopte un modèle **Freemium** structuré :
*   **Accès Limité :** Un aperçu gratuit (3 questions par module) pour tester la plateforme.
*   **Abonnement Temporel :** Déblocage complet des modules via un accès Premium de 10 jours.
*   **Gestion VIP :** Système de rôles (Administrateurs/Invités) bénéficiant d'un accès illimité et multi-modules.

---

## 🛠️ 4. Stack Technique (Instant T)

*   **Frontend :** React (Vite), Tailwind CSS (Design Premium), Lucide-React.
*   **Backend & Sécurité :** Firebase Auth (Email/Google), Firestore (Base de données temps réel).
*   **Hébergement & CI/CD :** Vercel (Déploiement continu automatisé via GitHub).

---

## ⚙️ 5. Guide de démarrage (Terminal)

Pour lancer le projet localement :

```bash
# Installation des dépendances
npm install

# Lancement de l'environnement de développement
npm run dev

# Construction pour la production
npm run build
```

---

## 🚧 6. Project Status

> [!IMPORTANT]
> **Phase actuelle :** *Content Originalization & Legal Compliance*
> 
> L'accès public est temporairement restreint. Nous procédons actuellement à une reformulation originale de l'intégralité du contenu pédagogique afin de garantir le strict respect de la propriété intellectuelle tout en offrant une expérience d'apprentissage unique et conforme.

---

## ⚖️ 7. Disclaimer Légal

Ce site est une plateforme d'entraînement indépendante. Il n'est **pas affilié**, entretenu, autorisé ou soutenu par **ServiceNow, Inc.** ServiceNow, HAM et SAM sont des marques déposées de leurs propriétaires respectifs.

---
*Optimisé pour l'excellence opérationnelle sur ServiceNow.*
