"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  createFournisseurLivraison,
  deleteFournisseurLivraison,
  getFournisseurs,
  updateFournisseurLivraison,
  addFournisseurPaiement,
  addFournisseurDepense,
  getFournisseurHistory,
} from "@/lib/api"
import type {
  FournisseurLivraison,
  FournisseurLivraisonFormData,
  TypeQuantiteFournisseur,
} from "@/lib/types"
import { Edit, Plus, Trash2, Eye } from "lucide-react"

const emptyForm: FournisseurLivraisonFormData = {
  nomFournisseur: "",
  quantiteLivree: 0,
  typeQuantite: "Moyenne",
  prixUnitaire: 0,
  paye: 0,
  depenseMotif: "",
  depenseMontant: 0,
}

export default function FournisseursPage() {
  const [items, setItems] = useState<FournisseurLivraison[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FournisseurLivraison | null>(null)
  const [formData, setFormData] = useState<FournisseurLivraisonFormData>(emptyForm)

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyData, setHistoryData] = useState<any | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [depenseOpen, setDepenseOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<FournisseurLivraison | null>(null)

  const [paiementMontant, setPaiementMontant] = useState("")
  const [depenseMotif, setDepenseMotif] = useState("")
  const [depenseMontant, setDepenseMontant] = useState("")

  useEffect(() => {
    loadFournisseurs()
  }, [])

  async function loadFournisseurs() {
    try {
      setLoading(true)
      setError(null)
      const data = await getFournisseurs()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des fournisseurs")
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingItem(null)
    setFormData(emptyForm)
    setModalOpen(true)
  }

  function openEditModal(item: FournisseurLivraison) {
    setEditingItem(item)
    setFormData({
      nomFournisseur: item.nomFournisseur,
      quantiteLivree: item.quantiteLivree,
      typeQuantite: item.typeQuantite,
      prixUnitaire: item.prixUnitaire,
      paye: item.paye,
      depenseMotif: item.depenseMotif || "",
      depenseMontant: item.depenseMontant,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingItem(null)
    setFormData(emptyForm)
  }

  function updateForm<K extends keyof FournisseurLivraisonFormData>(
    key: K,
    value: FournisseurLivraisonFormData[K]
  ) {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.nomFournisseur.trim()) {
      setError("Le nom du fournisseur est requis")
      return
    }

    if (formData.quantiteLivree <= 0) {
      setError("La quantité livrée doit être supérieure à 0")
      return
    }

    try {
      setError(null)

      if (editingItem) {
        const updated = await updateFournisseurLivraison(editingItem.id, formData)
        setItems((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updated : item))
        )
      } else {
        const created = await createFournisseurLivraison(formData)
        setItems((prev) => [created, ...prev])
      }

      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement")
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Voulez-vous vraiment supprimer cette ligne ?")
    if (!confirmed) return

    try {
      setError(null)
      await deleteFournisseurLivraison(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression")
    }
  }

  function formatMoney(value: number) {
    return Number(value || 0).toLocaleString("fr-FR")
  }

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (item.typeQuantite === "Moyenne") {
          acc.quantiteMoyenne += item.quantiteLivree
        }

        if (item.typeQuantite === "Gros") {
          acc.quantiteGros += item.quantiteLivree
        }

        acc.quantiteExacte += item.quantiteExacte
        acc.montant += item.montant
        acc.paye += item.paye
        acc.restant += item.restant
        acc.depenseMontant += item.depenseMontant

        return acc
      },
      {
        quantiteMoyenne: 0,
        quantiteGros: 0,
        quantiteExacte: 0,
        montant: 0,
        paye: 0,
        restant: 0,
        depenseMontant: 0,
      }
    )
  }, [items])

  async function openHistoryModal(item: FournisseurLivraison) {
    try {
      setSelectedItem(item)
      setHistoryOpen(true)
      setHistoryLoading(true)

      const data = await getFournisseurHistory(item.id)
      setHistoryData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur historique")
    } finally {
      setHistoryLoading(false)
    }
  }

  function openPaymentModal(item: FournisseurLivraison) {
    setSelectedItem(item)
    setPaiementMontant("")
    setPaymentOpen(true)
  }

  function openDepenseModal(item: FournisseurLivraison) {
    setSelectedItem(item)
    setDepenseMotif("")
    setDepenseMontant("")
    setDepenseOpen(true)
  }

  async function handleAddPaiement(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItem) return

    const montant = Number(paiementMontant) || 0

    try {
      const updated = await addFournisseurPaiement(selectedItem.id, montant)
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      )
      setPaymentOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur paiement")
    }
  }

  async function handleAddDepense(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItem) return

    try {
      const updated = await addFournisseurDepense(selectedItem.id, {
        motif: depenseMotif,
        montant: Number(depenseMontant) || 0,
      })

      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      )
      setDepenseOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur dépense")
    }
  }

  const previewQuantiteExacte = formData.quantiteLivree || 0
  const previewMontant = previewQuantiteExacte * (formData.prixUnitaire || 0)
  const previewRestant = previewMontant - (formData.paye || 0)

  return (
    <DashboardLayout title="Fournisseurs">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Gestion des fournisseurs
            </h2>
            <p className="text-muted-foreground">
              Gérez les livraisons, paiements et dépenses des fournisseurs
            </p>
          </div>

          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle livraison
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-lg font-semibold text-foreground">
              Liste des livraisons fournisseurs
            </h3>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              Chargement des fournisseurs...
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="min-w-[180px] font-semibold">
                      Nom fournisseur
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Moyennes
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Gros
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Qté exacte
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Prix . U
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Montant
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Payé
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Restant
                    </TableHead>
                    <TableHead className="min-w-[160px] font-semibold">
                      Motif dépense
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Dépense
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="py-12 text-center text-muted-foreground">
                        Aucune livraison fournisseur enregistrée
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.nomFournisseur}
                          </TableCell>

                          <TableCell className="text-right tabular-nums">
                            {item.typeQuantite === "Moyenne" ? item.quantiteLivree : ""}
                          </TableCell>

                          <TableCell className="text-right tabular-nums">
                            {item.typeQuantite === "Gros" ? item.quantiteLivree : ""}
                          </TableCell>

                          <TableCell className="text-right tabular-nums">
                            {item.quantiteExacte}
                          </TableCell>

                          <TableCell className="text-right tabular-nums">
                            {formatMoney(item.prixUnitaire)}
                          </TableCell>

                          <TableCell className="text-right font-medium tabular-nums">
                            {formatMoney(item.montant)}
                          </TableCell>

                          <TableCell className="text-right tabular-nums text-emerald-700">
                            {formatMoney(item.paye)}
                          </TableCell>

                          <TableCell className="text-right tabular-nums text-red-700">
                            {formatMoney(item.restant)}
                          </TableCell>

                          <TableCell>
                            {item.depenseMotif || "—"}
                          </TableCell>

                          <TableCell className="text-right font-medium tabular-nums">
                            {formatMoney(item.depenseMontant)}
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openPaymentModal(item)}
                              >
                                Paiement
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDepenseModal(item)}
                              >
                                Dépense
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gray-100 hover:bg-gray-200"
                                onClick={() => openEditModal(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gray-100 hover:bg-gray-200"
                                onClick={() => openHistoryModal(item)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}

                      <TableRow className="border-t-2 bg-muted/70 font-bold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {totals.quantiteMoyenne}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {totals.quantiteGros}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {totals.quantiteExacte}
                        </TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(totals.montant)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(totals.paye)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(totals.restant)}
                        </TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(totals.depenseMontant)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Modifier la livraison" : "Nouvelle livraison fournisseur"}
              </DialogTitle>
              <DialogDescription>
                Les champs Montant, Quantité exacte et Restant sont calculés automatiquement.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nomFournisseur">Nom fournisseur</Label>
                  <Input
                    id="nomFournisseur"
                    value={formData.nomFournisseur}
                    onChange={(e) => updateForm("nomFournisseur", e.target.value)}
                    placeholder="Ex: BOB MUSSO"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantiteLivree">Quantité livrée</Label>
                  <Input
                    id="quantiteLivree"
                    type="number"
                    min="0"
                    value={formData.quantiteLivree}
                    onChange={(e) =>
                      updateForm("quantiteLivree", Number(e.target.value))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type quantité</Label>
                  <div className="flex gap-4 rounded-md border p-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="typeQuantite"
                        value="Moyenne"
                        checked={formData.typeQuantite === "Moyenne"}
                        onChange={() => updateForm("typeQuantite", "Moyenne")}
                      />
                      Moyenne
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="typeQuantite"
                        value="Gros"
                        checked={formData.typeQuantite === "Gros"}
                        onChange={() => updateForm("typeQuantite", "Gros")}
                      />
                      Gros
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quantité exacte</Label>
                  <Input value={previewQuantiteExacte} readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prixUnitaire">Prix unitaire</Label>
                  <Input
                    id="prixUnitaire"
                    type="number"
                    min="0"
                    value={formData.prixUnitaire}
                    onChange={(e) =>
                      updateForm("prixUnitaire", Number(e.target.value))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Montant</Label>
                  <Input value={formatMoney(previewMontant)} readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paye">Payé</Label>
                  <Input
                    id="paye"
                    type="number"
                    min="0"
                    value={formData.paye}
                    onChange={(e) => updateForm("paye", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Restant</Label>
                  <Input value={formatMoney(previewRestant)} readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depenseMotif">Motif dépense</Label>
                  <Input
                    id="depenseMotif"
                    value={formData.depenseMotif || ""}
                    onChange={(e) => updateForm("depenseMotif", e.target.value)}
                    placeholder="Ex: Transport"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depenseMontant">Montant dépense</Label>
                  <Input
                    id="depenseMontant"
                    type="number"
                    min="0"
                    value={formData.depenseMontant}
                    onChange={(e) =>
                      updateForm("depenseMontant", Number(e.target.value))
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeModal}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingItem ? "Modifier" : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un paiement</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddPaiement} className="space-y-4">
              <div className="space-y-2">
                <Label>Montant payé</Label>
                <Input
                  type="number"
                  value={paiementMontant}
                  onChange={(e) => setPaiementMontant(e.target.value)}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Ajouter</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={depenseOpen} onOpenChange={setDepenseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une dépense</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddDepense} className="space-y-4">
              <div className="space-y-2">
                <Label>Motif</Label>
                <Input
                  value={depenseMotif}
                  onChange={(e) => setDepenseMotif(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Montant</Label>
                <Input
                  type="number"
                  value={depenseMontant}
                  onChange={(e) => setDepenseMontant(e.target.value)}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDepenseOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Ajouter</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Historique{selectedItem ? ` — ${selectedItem.nomFournisseur}` : ""}
              </DialogTitle>
            </DialogHeader>

            {historyLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Chargement...
              </div>
            ) : historyData ? (
              <div className="max-h-[60vh] overflow-auto space-y-3">
                <div className="rounded bg-muted/50 p-3 text-sm">
                  <div className="font-semibold mb-2">État courant</div>
                  <div>Montant : {formatMoney(historyData.current.montant)}</div>
                  <div>Payé : {formatMoney(historyData.current.paye)}</div>
                  <div>Restant : {formatMoney(historyData.current.restant)}</div>
                  <div>Dépenses : {formatMoney(historyData.current.depenseMontant)}</div>
                </div>

                {historyData.history.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Aucun historique enregistré
                  </div>
                ) : (
                  historyData.history.map((h: any) => (
                    <div key={h.history_id} className="rounded border p-3 text-sm">
                      <div className="text-muted-foreground">
                        Sauvegardé : {h.saved_at}
                      </div>
                      <div>Quantité : {h.quantiteExacte}</div>
                      <div>Prix U : {formatMoney(h.prixUnitaire)}</div>
                      <div>Montant : {formatMoney(h.montant)}</div>
                      <div>Payé : {formatMoney(h.paye)}</div>
                      <div>Restant : {formatMoney(h.restant)}</div>
                      <div>Dépenses : {formatMoney(h.depenseMontant)}</div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Aucune donnée</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
