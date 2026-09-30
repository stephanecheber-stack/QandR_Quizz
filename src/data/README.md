# Banques de questions

Un fichier JSON par module. Chaque fichier contient un **tableau** de questions,
encodé en **UTF-8 avec BOM** (les scripts Node retirent le BOM à la lecture et
le remettent à l'écriture).

| Fichier | Module | Types de questions |
| --- | --- | --- |
| `ham_questions.json` | HAM — Hardware Asset Management | QCM |
| `sam_questions.json` | SAM — Software Asset Management | QCM + association |
| `itsm_questions.json` | ITSM — Certification CIS-ITSM | QCM |

## Format QCM

Multi-sélection : une réponse n'est comptée juste que si l'ensemble sélectionné
correspond exactement à `correct_answers`.

```json
{
  "id": 42,
  "question": "Which of the following are asset states? (Choose two.)",
  "options": { "A": "In stock", "B": "Retired", "C": "Draft" },
  "correct_answers": ["A", "B"],
  "explanation": "Texte affiché après validation."
}
```

Le texte entre parenthèses dans `question` (ex. `(Choose two.)`) est mis en
rouge automatiquement par l'interface.

## Format association (`matching`)

```json
{
  "id": 77,
  "question": "Associez chaque état à sa définition.",
  "type": "matching",
  "pairs": { "In stock": "Asset disponible", "Consumed": "Asset attribué" },
  "explanation": "Texte affiché après validation."
}
```

Les valeurs de droite sont mélangées et proposées dans des listes déroulantes.
**Elles doivent être toutes différentes** : deux valeurs identiques rendraient la
correction ambiguë.

## Ajouter un module

1. Déposer le JSON ici.
2. Ajouter une entrée dans [`src/modules.js`](../modules.js) (`id`, `title`,
   `icon`, `questionCount`, `load`, `theme`).
3. Lancer `npm run check:data`.

## Outils

```bash
npm run check:data                  # valide les 3 fichiers (ids, options, réponses, compteurs)
npm run gen:explanations -- itsm    # génère les explications manquantes via Ollama
npm run import:questions -- itsm imports/lot1.txt           # simulation d'import
npm run import:questions -- itsm imports/lot1.txt --write   # import réel
```

## Importer des questions collées depuis ExamTopics

1. Copier chaque page de discussion (du titre jusqu'au dernier commentaire) et
   coller les questions à la suite dans un fichier `imports/<nom>.txt`
   (dossier non versionné).
2. Lancer la simulation, lire le rapport (`imports/<nom>.rapport.md`) :
   - bonne réponse = réponse la plus votée (« Selected Answer ») ;
   - égalité ou absence de vote ⇒ question rejetée, à traiter à la main ;
   - question identique à une existante (≥ 95 %) ⇒ écartée ;
   - question proche (≥ 60 %) ⇒ ajoutée mais signalée (variante ou doublon ?) ;
   - vote unique, consensus < 60 %, désaccord avec « (Choose two.) » ou image
     probablement manquante ⇒ ajoutée mais signalée.
3. Relancer avec `--write`, puis `npm run check:data` et
   `npm run gen:explanations -- itsm`.

Le numéro ExamTopics sert d'identifiant quand il est libre.
