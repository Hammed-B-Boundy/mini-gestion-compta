/**
 * =============================================================
 * FICHIER: components/summary-cards.tsx
 * =============================================================
 *
 * CE FICHIER CRÉE LES 4 CARTES RÉCAPITULATIVES DU DASHBOARD.
 *
 * CONCEPTS REACT IMPORTANTS ICI :
 *
 * 1. Les "props" — Ce composant REÇOIT des données de son parent
 *    via les props. C'est comme passer des arguments à une fonction.
 *    Exemple : <SummaryCards entries={mesEntries} />
 *
 * 2. Les calculs dérivés — On calcule les totaux à partir des
 *    données reçues. En React, ces calculs se refont automatiquement
 *    chaque fois que les données changent (le composant se "re-rend").
 *
 * 3. La méthode .reduce() — Parcourt un tableau et accumule
 *    une valeur. Par exemple, pour faire la somme de tous les montants.
 * =============================================================
 */

// On importe les composants Card de shadcn/ui
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// On importe notre type Entry défini dans lib/types.ts
import type { Entry } from "@/lib/types"

// On importe des icônes de lucide-react
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
} from "lucide-react"

/**
 * On définit le type des "props" (propriétés) que ce composant accepte.
 *
 * "interface SummaryCardsProps" dit :
 * "Ce composant attend une propriété 'entries' qui est un tableau d'Entry"
 *
 * Entry[] signifie "un tableau (array) d'objets Entry"
 */
interface SummaryCardsProps {
  entries: Entry[]
}

/**
 * Fonction utilitaire pour formater un nombre en monnaie FCFA.
 *
 * Exemple : formatMoney(150000) → "150 000 FCFA"
 *
 * .toLocaleString("fr-FR") ajoute les espaces entre les milliers
 * comme on le fait en français.
 */
function formatMoney(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`
}

/**
 * Composant SummaryCards — Affiche 4 cartes avec les chiffres clés
 *
 * Il reçoit "entries" en props et calcule les totaux à afficher.
 *
 * La syntaxe { entries } est du "destructuring" :
 * au lieu d'écrire props.entries, on extrait directement entries.
 */
export function SummaryCards({ entries }: SummaryCardsProps) {
  /**
   * On calcule les totaux avec .reduce()
   *
   * .reduce() parcourt chaque élément du tableau et accumule un résultat.
   *
   * Paramètres de .reduce() :
   * - (acc, entry) : acc = l'accumulateur (le total en cours), entry = l'élément actuel
   * - 0 : la valeur initiale de l'accumulateur
   *
   * Exemple simplifié :
   * [100, 200, 300].reduce((acc, val) => acc + val, 0) = 600
   */

  // Total de tous les montants (Nombre × Prix Unitaire)
  const totalMontant = entries.reduce((acc, entry) => acc + entry.montant, 0)

  // Total de ce qui a été payé
  const totalPaye = entries.reduce((acc, entry) => acc + entry.paye, 0)

  // Total de ce qui reste à payer
  const totalRestant = entries.reduce((acc, entry) => acc + entry.restant, 0)

  // Total des dépenses
  const totalDepenses = entries.reduce(
    (acc, entry) => acc + entry.depenseMontant,
    0
  )

  /**
   * On définit un tableau de 4 cartes.
   * Chaque carte a un titre, une valeur, une icône et une couleur.
   *
   * Cela nous permet d'utiliser .map() pour éviter de répéter
   * le même code 4 fois (principe DRY : Don't Repeat Yourself).
   */
  const cards = [
    {
      title: "Chiffre d'affaires",
      value: formatMoney(totalMontant),
      description: `${entries.length} transaction(s)`,
      icon: DollarSign,
      // On stocke la classe CSS pour la couleur de l'icône
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      title: "Total Payé",
      value: formatMoney(totalPaye),
      description: "Montants encaissés",
      icon: TrendingUp,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      title: "Total Restant",
      value: formatMoney(totalRestant),
      description: "Montants en attente",
      icon: TrendingDown,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
    },
    {
      title: "Total Dépenses",
      value: formatMoney(totalDepenses),
      description: "Dépenses enregistrées",
      icon: Users,
      iconColor: "text-rose-600",
      iconBg: "bg-rose-50",
    },
  ]

  return (
    /**
     * CSS Grid avec Tailwind :
     * - grid : active le mode grille
     * - grid-cols-1 : 1 colonne sur mobile
     * - sm:grid-cols-2 : 2 colonnes sur écrans moyens (sm = small = 640px)
     * - lg:grid-cols-4 : 4 colonnes sur grands écrans (lg = large = 1024px)
     * - gap-4 : espacement de 1rem (16px) entre les cartes
     *
     * C'est le "responsive design" : l'interface s'adapte à la taille de l'écran.
     */
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/*
        .map() crée une <Card> pour chaque élément du tableau "cards".
        "index" est la position dans le tableau (0, 1, 2, 3).
      */}
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            {/* Titre de la carte - text-sm = petit texte, font-medium = semi-gras */}
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            {/* Conteneur de l'icône avec fond coloré et coins arrondis */}
            <div className={`rounded-md p-2 ${card.iconBg}`}>
              {/*
                card.icon est un composant React (ex: DollarSign).
                On l'utilise comme une balise JSX : <card.icon />
                className applique la couleur et la taille.
              */}
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            {/* Valeur principale - text-2xl = grande taille, font-bold = gras */}
            <div className="text-2xl font-bold text-foreground">
              {card.value}
            </div>
            {/* Description sous la valeur */}
            <p className="mt-1 text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
