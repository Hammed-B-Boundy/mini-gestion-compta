/**
 * =============================================================
 * FICHIER: components/entry-form-modal.tsx
 * =============================================================
 *
 * CE FICHIER GERE LE FORMULAIRE D'AJOUT ET DE MODIFICATION
 * D'UNE TRANSACTION, AFFICHE DANS UN MODAL.
 *
 * NOUVEAU CONCEPT : Le composant fonctionne en 2 MODES :
 *
 * 1. MODE AJOUT — Quand on clique "Nouvelle entree"
 *    -> Le formulaire est vide, le bouton dit "Enregistrer"
 *
 * 2. MODE MODIFICATION — Quand on clique le crayon sur une ligne
 *    -> Le formulaire est PRE-REMPLI avec les donnees existantes
 *    -> Le bouton dit "Modifier"
 *
 * Comment on fait la difference ?
 * - Si la prop "entryToEdit" est fournie (pas null), on est en mode modification
 * - Si elle est null/undefined, on est en mode ajout
 *
 * NOUVEAU CONCEPT REACT : useEffect
 *
 * useEffect est un Hook qui execute du code APRES le rendu du composant.
 * On l'utilise ici pour REMPLIR le formulaire quand on recoit une entree a modifier.
 *
 * Syntaxe : useEffect(() => { ...code... }, [dependances])
 * - Le code s'execute quand une des dependances change
 * - [entryToEdit] signifie "re-execute quand entryToEdit change"
 * =============================================================
 */
"use client"

import { useState, useEffect } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

import type { Entry, EntryFormData } from "@/lib/types"

/**
 * Props du composant EntryFormModal
 *
 * On a maintenant 3 props (avant on en avait 1) :
 *
 * - onSubmit : fonction appelée quand on AJOUTE une nouvelle entrée
 * - onEdit : fonction appelée quand on MODIFIE une entrée existante
 *   Elle recoit l'id de l'entree + les nouvelles donnees
 * - entryToEdit : l'entree à modifier (null si on est en mode ajout)
 * - onClose : fonction appelée quand le modal se ferme
 *   (pour que le parent sache qu'on a fini et reset entryToEdit)
 */
interface EntryFormModalProps {
  onSubmit: (data: EntryFormData) => void
  onEdit: (id: string, data: EntryFormData) => void
  entryToEdit: Entry | null
  onClose: () => void
}

export function EntryFormModal({
  onSubmit,
  onEdit,
  entryToEdit,
  onClose,
}: EntryFormModalProps) {
  // --- ETATS DU FORMULAIRE ---
  const [isOpen, setIsOpen] = useState(false)
  const [clientId, setClientId] = useState("")
  const [nombre, setNombre] = useState("")
  const [prixUnitaire, setPrixUnitaire] = useState("")
  const [paye, setPaye] = useState("")
  const [depenseMotif, setDepenseMotif] = useState("")
  const [depenseMontant, setDepenseMontant] = useState("")

  /**
   * ===== useEffect — Pre-remplir le formulaire en mode modification =====
   *
   * useEffect(() => { ... }, [entryToEdit])
   *
   * Ce Hook s'execute a chaque fois que "entryToEdit" change.
   * Quand le parent passe une entrée à modifier :
   * 1. On ouvre le modal (setIsOpen(true))
   * 2. On remplit chaque champ avec les valeurs existantes
   *
   * String() convertit un nombre en texte car les champs Input
   * attendent des strings (chaines de caracteres).
   *
   * Pourquoi useEffect et pas juste du code normal ?
   * Parce que les props changent APRES le rendu initial.
   * useEffect permet de REAGIR aux changements de props.
   */
  useEffect(() => {
    if (entryToEdit) {
      setIsOpen(true)
      setClientId(entryToEdit.nomClient || "")
      setNombre(String(entryToEdit.nombre))
      setPrixUnitaire(String(entryToEdit.prixUnitaire))
      // en mode modification on ne préremplit PAS le champ payé,
      // car il représente le montant supplémentaire versé.
      setPaye("")
      setDepenseMotif(entryToEdit.depenseMotif)
      setDepenseMontant(
        entryToEdit.depenseMontant > 0
          ? String(entryToEdit.depenseMontant)
          : ""
      )
    }
  }, [entryToEdit])

  // --- CALCULS AUTOMATIQUES (identiques à avant) ---
  const nombreNum = parseInt(nombre) || 0
  const prixUnitaireNum = parseInt(prixUnitaire) || 0
  const payeNum = parseInt(paye) || 0
  const depenseMontantNum = parseInt(depenseMontant) || 0
  /**
   * Variable booleenne pour savoir si on est en mode modification.
   * "!!" convertit une valeur en booleen :
   * - !!null = false
   * - !!{ id: "demo-1", ... } = true
   *
   * On l'utilise pour changer le texte des boutons et le titre du modal.
   */
  const isEditMode = !!entryToEdit

  const montantCalcule = nombreNum * prixUnitaireNum
  // baseRemaining = montantCalcule pour nouvel enregistrement,
  // sinon la valeur restant de l'entrée existante
  const baseRemaining = isEditMode
    ? entryToEdit?.restant ?? montantCalcule
    : montantCalcule
  const restantCalcule = Math.max(0, baseRemaining - payeNum)

  function resetForm() {
    setClientId("")
    setNombre("")
    setPrixUnitaire("")
    setPaye("")
    setDepenseMotif("")
    setDepenseMontant("")
  }

  /**
   * handleClose — Ferme le modal proprement
   *
   * On appelle a la fois :
   * - resetForm() pour vider les champs
   * - onClose() pour prevenir le parent (qui va remettre entryToEdit a null)
   * - setIsOpen(false) pour fermer le modal visuellement
   */
  function handleClose() {
    resetForm()
    onClose()
    setIsOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId.trim()) return

    const formData: EntryFormData = {
      clientId: clientId.trim(),
      nombre: nombreNum,
      prixUnitaire: prixUnitaireNum,
      paye: payeNum,
      depenseMotif: depenseMotif.trim(),
      depenseMontant: depenseMontantNum,
    }

    /**
     * ICI la difference entre les 2 modes :
     *
     * - Mode modification : on appelle onEdit(id, formData)
     *   pour mettre a jour l'entrée existante
     * - Mode ajout : on appelle onSubmit(formData)
     *   pour créer une nouvelle entrée
     *
     * "entryToEdit!.id" — Le "!" dit a TypeScript :
     * "je suis sur que entryToEdit n'est pas null ici"
     * (c'est garanti par la condition isEditMode)
     */
    if (isEditMode) {
      onEdit(entryToEdit!.id, formData)
    } else {
      onSubmit(formData)
    }

    handleClose()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        } else {
          setIsOpen(true)
        }
      }}
    >
      {/*
        Le bouton "Nouvelle entrée" n'apparait que en mode AJOUT.
        En mode modification, le modal s'ouvre via useEffect (pas via ce bouton).
        
        On cache le trigger en mode edit car c'est le bouton crayon
        dans le tableau qui déclenche l'ouverture.
      */}
      {!isEditMode && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle entrée
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          {/*
            Titre conditionnel :
            - Mode modification : "Modifier la transaction"
            - Mode ajout : "Nouvelle transaction"
          */}
          <DialogTitle>
            {isEditMode ? "Ajouter une transaction" : "Nouvelle transaction"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Indiquez un paiement supplémentaire pour la transaction existante. Le montant restant sera recalculé automatiquement."
              : "Remplissez les informations de la transaction. Les champs marqués * sont obligatoires."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* ---- CHAMP : Nom du client ---- */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="clientId">Client *</Label>
            <Input
              id="clientId"
              placeholder="Nom du client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            />
          </div>

          {/* ---- Nombre + Prix unitaire (cote à cote) ---- */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre">Nombre de produits</Label>
              <Input
                id="nombre"
                type="number"
                placeholder="Ex: 100"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                min="0"
                disabled={isEditMode}
                className={isEditMode ? 'cursor-not-allowed bg-muted' : ''}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="prixUnitaire">Prix unitaire (FCFA)</Label>
              <Input
                id="prixUnitaire"
                type="number"
                placeholder="Ex: 500"
                value={prixUnitaire}
                onChange={(e) => setPrixUnitaire(e.target.value)}
                min="0"
                disabled={isEditMode}
                className={isEditMode ? 'cursor-not-allowed bg-muted' : ''}
              />
            </div>
          </div>

          {/* ---- CHAMP CALCULE : Montant (lecture seule) ---- */}
          <div className="flex flex-col gap-2">
            <Label>Montant total (calculé automatiquement)</Label>
            <Input
              value={
                montantCalcule > 0
                  ? `${montantCalcule.toLocaleString("fr-FR")} FCFA`
                  : ""
              }
              readOnly
              className="cursor-not-allowed bg-muted"
              placeholder="Se calcule automatiquement"
            />
          </div>

          {/* ---- Paye + Restant (cote à cote) ---- */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="paye">
                {isEditMode ? "Montant payé (nouveau paiement)" : "Montant payé (FCFA)"}
              </Label>
              <Input
                id="paye"
                type="number"
                placeholder="Ex: 30000"
                value={paye}
                onChange={(e) => setPaye(e.target.value)}
                min="0"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Restant (calculé automatiquement)</Label>
              <Input
                value={
                  montantCalcule > 0
                    ? `${restantCalcule.toLocaleString("fr-FR")} FCFA`
                    : ""
                }
                readOnly
                className="cursor-not-allowed bg-muted"
                placeholder="Montant - Payé"
              />
            </div>
          </div>

          {/* ---- Dépenses : Motif + Montant (côte à côte) ---- */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="depenseMotif">Motif de dépense</Label>
              <Input
                id="depenseMotif"
                placeholder="Ex: Transport"
                value={depenseMotif}
                onChange={(e) => setDepenseMotif(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="depenseMontant">Montant dépense (FCFA)</Label>
              <Input
                id="depenseMontant"
                type="number"
                placeholder="Ex: 5000"
                value={depenseMontant}
                onChange={(e) => setDepenseMontant(e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* ---- BOUTONS D'ACTION ---- */}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            {/*
              Le texte du bouton change selon le mode :
              - "Ajouter paiement" en mode modification
              - "Enregistrer" en mode ajout
            */}
            <Button type="submit">
              {isEditMode ? "Ajouter paiement" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
