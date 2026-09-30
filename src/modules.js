import { HardDrive, Package, LifeBuoy } from 'lucide-react'

/**
 * Registre unique des modules.
 *
 * Ajouter un module = déposer son JSON dans src/data/ puis ajouter une entrée
 * ici. L'écran de sélection et le moteur de quiz se mettent à jour tout seuls.
 *
 * `load()` est un import dynamique : les questions d'un module ne sont
 * téléchargées que si l'utilisateur ouvre ce module. Sans ça, les ~600
 * questions des trois modules alourdiraient le premier chargement.
 *
 * `questionCount` est écrit en dur pour afficher la taille du module avant de
 * l'ouvrir ; `npm run check:data` vérifie qu'il reste synchronisé avec le JSON.
 *
 * Les classes Tailwind sont écrites en entier (`bg-orange-100` et non
 * `bg-${color}-100`) : le compilateur Tailwind lit le code source en texte brut
 * et ne verrait pas une classe construite dynamiquement.
 */
export const MODULES = [
  {
    id: 'HAM',
    title: 'HAM',
    subtitle: 'Hardware Asset Management',
    description: "Cycle de vie du matériel, stock, modèles d'actifs et transferts.",
    icon: HardDrive,
    questionCount: 188,
    load: () => import('./data/ham_questions.json').then((module) => module.default),
    theme: {
      iconWrapper: 'bg-orange-100',
      icon: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-600',
    },
  },
  {
    id: 'SAM',
    title: 'SAM',
    subtitle: 'Software Asset Management',
    description: 'Licences, conformité, réconciliation et questions par association.',
    icon: Package,
    questionCount: 220,
    load: () => import('./data/sam_questions.json').then((module) => module.default),
    theme: {
      iconWrapper: 'bg-blue-100',
      icon: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-600',
    },
  },
  {
    id: 'ITSM',
    title: 'ITSM',
    subtitle: 'Certification CIS-ITSM',
    description: 'IT Service Management et bonnes pratiques ServiceNow.',
    icon: LifeBuoy,
    questionCount: 220,
    load: () => import('./data/itsm_questions.json').then((module) => module.default),
    theme: {
      iconWrapper: 'bg-purple-100',
      icon: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-600',
    },
  },
]

const MODULES_BY_ID = new Map(MODULES.map((module) => [module.id, module]))

/** Renvoie la définition d'un module, ou `undefined` si l'id est inconnu. */
export function getModule(moduleId) {
  return MODULES_BY_ID.get(moduleId)
}
