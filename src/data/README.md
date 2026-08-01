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
```
