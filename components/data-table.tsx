/**
 * =============================================================
 * FICHIER: components/data-table.tsx
 * =============================================================
 *
 * CE FICHIER CREE LE TABLEAU PRINCIPAL DE DONNEES COMPTABLES.
 *
 * CONCEPTS REACT IMPORTANTS ICI :
 *
 * 1. Les "props" avec callback — Ce composant recoit non seulement
 *    des donnees (entries) mais aussi des FONCTIONS (onDelete, onEdit).
 *
 * 2. Les sous-colonnes (colspan) — On utilise "colSpan" en HTML
 *    pour fusionner des cellules d'en-tete (comme dans Excel).
 *
 * 3. "Lifting state up" — Les donnees sont gerees
 *    dans le parent (page.tsx) et passees ici via les props.
 *
 * 4. NOUVEAU : useState pour la recherche locale.
 *    Le champ de recherche ne modifie PAS les donnees d'origine,
 *    il FILTRE juste l'affichage grace a .filter() sur le nom du client.
 * =============================================================
 */
"use client"

// useState pour gerer la valeur du champ de recherche
import { useState } from "react"

// On importe les composants Table de shadcn/ui
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
// Pencil = icone crayon, Search = loupe
import { Pencil, Trash2, Search, Eye } from "lucide-react"

// Notre type de donnees
import type { Entry } from "@/lib/types"

/**
 * Props du composant DataTable :
 * - entries : le tableau de donnees a afficher
 * - onDelete : une fonction a appeler quand on veut supprimer une entree
 * - onEdit : une fonction a appeler quand on veut MODIFIER une entree
 *   Elle recoit l'objet Entry complet (pas juste l'id)
 *   pour que le parent puisse pre-remplir le formulaire.
 *
 * "(id: string) => void" signifie :
 * "une fonction qui prend un id (texte) et ne retourne rien (void)"
 *
 * "(entry: Entry) => void" signifie :
 * "une fonction qui prend un objet Entry et ne retourne rien"
 */
interface DataTableProps {
  entries: Entry[]
  onDelete: (id: string) => void
  onEdit: (entry: Entry) => void
  onViewHistory?: (id: string) => void
}

/**
 * Même fonction utilitaire que dans summary-cards.tsx
 * pour formater les montants en FCFA.
 */
function formatMoney(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`
}

/**
 * Composant DataTable — Le tableau comptable principal
 *
 * Affiche toutes les transactions avec les colonnes demandées :
 * - Nom client, Nombre, Prix Unitaire, Montant (calculé)
 * - État de paiement (Payé + Restant)
 * - Dépenses (Motif + Montant)
 * - Actions (supprimer)
 */
export function DataTable({ entries, onDelete, onEdit, onViewHistory }: DataTableProps) {
  /**
   * searchQuery = la valeur saisie dans le champ de recherche.
   *
   * C'est un etat LOCAL au composant DataTable.
   * Contrairement aux "entries" qui viennent du parent,
   * la recherche est geree ICI car elle ne concerne que l'affichage
   * du tableau (pas besoin que le parent le sache).
   */
  const [searchQuery, setSearchQuery] = useState("")

  /**
   * filteredEntries = les entrees filtrees par la recherche.
   *
   * .filter() cree un NOUVEAU tableau contenant seulement
   * les elements qui passent le test (retournent true).
   *
   * .toLowerCase() convertit le texte en minuscules pour que
   * la recherche soit insensible a la casse :
   * "Entreprise" et "entreprise" correspondent toutes les deux.
   *
   * .includes() verifie si une chaine contient une sous-chaine.
   * "Entreprise ABC".includes("abc") -> true (apres toLowerCase)
   *
   * Si searchQuery est vide (""), .includes("") retourne toujours true,
   * donc toutes les entrees sont affichees (pas de filtre).
   */
  const filteredEntries = entries.filter((entry) =>
    entry.nomClient.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="rounded-lg border border-border bg-card">
      {/*
        En-tete du tableau avec titre + champ de recherche.
        "flex items-center justify-between" place le titre a gauche
        et le champ de recherche a droite sur la meme ligne.
      */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Registre des transactions
          </h2>
          <p className="text-sm text-muted-foreground">
            {/*
              On affiche le nombre d'entrees filtrees / total.
              Si on filtre, on montre les 2 chiffres pour plus de clarte.
            */}
            {searchQuery
              ? `${filteredEntries.length} sur ${entries.length} enregistrement(s)`
              : `${entries.length} enregistrement(s)`}
          </p>
        </div>

        {/*
          Champ de recherche avec une icone loupe.
          "relative" sur le conteneur permet de positionner l'icone
          en position "absolute" a l'interieur du champ.
          
          L'icone est purement decorative (elle n'est pas cliquable),
          elle indique juste que c'est un champ de recherche.
        */}
        <div className="relative w-64">
          {/*
            L'icone loupe positionnee a gauche dans le champ :
            - absolute : positionnement absolu par rapport au parent "relative"
            - left-3 : 12px depuis la gauche
            - top-1/2 -translate-y-1/2 : centre verticalement
          */}
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            // pl-9 : padding-left de 36px pour laisser la place a l'icone
            className="pl-9"
          />
        </div>
      </div>

      {/* Le tableau lui-même */}
      <Table>
        {/*
          TableHeader contient les en-têtes de colonnes.
          On a DEUX lignes d'en-tête :
          - La 1ère ligne avec les titres principaux
          - La 2ème ligne avec les sous-colonnes pour "État de paiement" et "Dépenses"
        */}
        <TableHeader>
          {/* ---- PREMIÈRE LIGNE D'EN-TÊTE ---- */}
          <TableRow className="bg-muted/50">
            {/*
              "rowSpan={2}" fusionne cette cellule sur 2 lignes verticalement.
              C'est comme fusionner des cellules dans Excel.
              On l'utilise pour les colonnes qui n'ont PAS de sous-colonnes.
            */}
            <TableHead rowSpan={2} className="font-semibold text-foreground">
              Nom Client
            </TableHead>
            <TableHead
              rowSpan={2}
              className="text-right font-semibold text-foreground"
            >
              Nombre
            </TableHead>
            <TableHead
              rowSpan={2}
              className="text-right font-semibold text-foreground"
            >
              Prix Unitaire
            </TableHead>
            <TableHead
              rowSpan={2}
              className="text-right font-semibold text-foreground"
            >
              Montant
            </TableHead>
            {/*
              "colSpan={2}" fusionne cette cellule sur 2 colonnes horizontalement.
              Cela crée un titre "État de paiement" au-dessus de "Payé" et "Restant".
            */}
            <TableHead
              colSpan={2}
              className="text-center font-semibold text-foreground"
            >
              État de paiement
            </TableHead>
            {/* Idem pour "Dépenses" qui contient "Motif" et "Montant" */}
            <TableHead
              colSpan={2}
              className="text-center font-semibold text-foreground"
            >
              Dépenses
            </TableHead>
            <TableHead
              rowSpan={2}
              className="text-center font-semibold text-foreground"
            >
              Actions
            </TableHead>
          </TableRow>

          {/* ---- DEUXIÈME LIGNE D'EN-TÊTE (sous-colonnes) ---- */}
          <TableRow className="bg-muted/30">
            {/* Sous-colonnes de "État de paiement" */}
            <TableHead className="text-right text-muted-foreground">
              Payé
            </TableHead>
            <TableHead className="text-right text-muted-foreground">
              Restant
            </TableHead>
            {/* Sous-colonnes de "Dépenses" */}
            <TableHead className="text-muted-foreground">Motif</TableHead>
            <TableHead className="text-right text-muted-foreground">
              Montant
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {/*
            Condition ternaire : entries.length === 0 ? (si vide) : (si non vide)

            Si le tableau est vide, on affiche un message.
            Sinon, on affiche les donnees avec .map()
          */}
          {/*
            On utilise filteredEntries (pas entries) pour l'affichage.
            Comme ca, seules les lignes qui correspondent a la recherche
            sont affichees. Si le champ de recherche est vide,
            filteredEntries === entries (toutes les lignes).
          */}
          {filteredEntries.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="py-12 text-center text-muted-foreground"
              >
                {entries.length === 0 ? (
                  <>
                    <p className="text-lg">Aucune transaction enregistrée</p>
                    <p className="mt-1 text-sm">
                      {"Cliquez sur \"Nouvelle entree\" pour commencer"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg">Aucun resultat</p>
                    <p className="mt-1 text-sm">
                      {`Aucun client ne correspond a "${searchQuery}"`}
                    </p>
                  </>
                )}
              </TableCell>
            </TableRow>
          ) : (
            <>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  {/* Nom du client - font-medium = semi-gras pour mettre en valeur */}
                  <TableCell className="font-medium text-foreground">
                    {entry.nomClient}
                  </TableCell>

                  {/* Nombre de produits - aligne a droite car c'est un chiffre */}
                  <TableCell className="text-right tabular-nums">
                    {entry.nombre}
                  </TableCell>

                  {/* Prix unitaire - formate en FCFA */}
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(entry.prixUnitaire)}
                  </TableCell>

                  {/* Montant total (calcule automatiquement) - en gras */}
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatMoney(entry.montant)}
                  </TableCell>

                  {/* Montant paye - couleur verte pour indiquer un paiement */}
                  <TableCell className="text-right tabular-nums text-emerald-700">
                    {formatMoney(entry.paye)}
                  </TableCell>

                  {/*
                    Montant restant avec un Badge conditionnel :
                    - Si restant === 0 : badge vert "Solde" (tout est paye)
                    - Sinon : badge orange avec le montant restant
                    
                    Badge est un composant shadcn/ui qui affiche un petit label colore.
                  */}
                  <TableCell className="text-right">
                    {entry.restant === 0 ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        Solde
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        {formatMoney(entry.restant)}
                      </Badge>
                    )}
                  </TableCell>

                  {/* Motif de la depense - texte tronque si trop long (max-w-[150px] truncate) */}
                  <TableCell className="max-w-[150px] truncate text-muted-foreground">
                    {entry.depenseMotif || "\u2014"}
                  </TableCell>

                  {/* Montant de la depense */}
                  <TableCell className="text-right tabular-nums text-rose-600">
                    {entry.depenseMontant > 0
                      ? formatMoney(entry.depenseMontant)
                      : "\u2014"}
                  </TableCell>

                  {/*
                    Colonne Actions — contient 2 boutons cote a cote :
                    1. Bouton MODIFIER (crayon) — appelle onEdit(entry)
                       On passe l'objet entry COMPLET au parent pour
                       qu'il puisse pre-remplir le formulaire.
                    2. Bouton SUPPRIMER (poubelle) — appelle onDelete(entry.id)
                       On ne passe que l'id car on n'a pas besoin des donnees.

                    "flex items-center justify-center gap-1" :
                    - flex : les boutons sont sur la meme ligne
                    - items-center : alignes verticalement au centre
                    - justify-center : centres horizontalement
                    - gap-1 : petit espacement entre les 2 boutons
                  */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {/* Bouton Modifier */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEdit(entry)}                        
                        aria-label={`Modifier l'entree de ${entry.nomClient}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* Bouton Historique */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewHistory?.(entry.id)}
                        aria-label={`Voir l'historique de ${entry.nomClient}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                                

                      {/* Bouton Supprimer */}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(entry.id)}
                        aria-label={`Supprimer l'entree de ${entry.nomClient}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {/*
                ============================================================
                LIGNE "TOTAL" EN BAS DU TABLEAU
                ============================================================
                
                .reduce() est une methode JavaScript tres puissante.
                Elle parcourt un tableau et "accumule" une valeur unique.
                
                Syntaxe : tableau.reduce((accumulateur, elementCourant) => {
                  return accumulateur + elementCourant.valeur
                }, valeurInitiale)
                
                Exemple concret :
                  [100, 200, 300].reduce((acc, val) => acc + val, 0)
                  Etape 1 : acc=0,   val=100 -> 0 + 100 = 100
                  Etape 2 : acc=100, val=200 -> 100 + 200 = 300
                  Etape 3 : acc=300, val=300 -> 300 + 300 = 600
                  Resultat final : 600
                
                Ici on l'utilise pour calculer les totaux de chaque colonne.
              */}
              {/*
                Les totaux utilisent aussi filteredEntries pour que
                les chiffres correspondent a ce qui est affiche.
              */}
              <TableRow className="border-t-2 border-foreground/20 bg-muted/60 font-semibold">
                <TableCell className="text-foreground">
                  Total
                </TableCell>
                <TableCell className="text-right tabular-nums text-foreground">
                  {filteredEntries.reduce((acc, entry) => acc + entry.nombre, 0)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {"\u2014"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-foreground">
                  {formatMoney(
                    filteredEntries.reduce((acc, entry) => acc + entry.montant, 0)
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums text-emerald-700">
                  {formatMoney(
                    filteredEntries.reduce((acc, entry) => acc + entry.paye, 0)
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums text-amber-700">
                  {formatMoney(
                    filteredEntries.reduce((acc, entry) => acc + entry.restant, 0)
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {"\u2014"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-rose-600">
                  {formatMoney(
                    filteredEntries.reduce((acc, entry) => acc + entry.depenseMontant, 0)
                  )}
                </TableCell>
                <TableCell />
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
