/**
 * =============================================================
 * FICHIER: app/stock-voyage/page.tsx — PAGE STOCK VOYAGE
 * =============================================================
 *
 * URL: "/stock-voyage"
 *
 * Cette page gère le stock voyage avec deux onglets :
 * - Entrée : pour ajouter des stocks
 * - Sortie : pour retirer des stocks
 * =============================================================
 */
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Minus, Eye, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getStockEntrees,
  createStockEntree,
  getStockEntreesHistory,
  deleteStockEntree,
  getStockSorties,
  createStockSortie,
  getStockSortiesHistory,
  type StockEntree,
  type StockSortie,
} from "@/lib/api"
import { toast } from "sonner"
import { Printer } from "lucide-react"

export default function StockVoyagePage() {
  const [entrees, setEntrees] = useState<StockEntree[]>([])
  const [sorties, setSorties] = useState<StockSortie[]>([])
  const [loadingEntrees, setLoadingEntrees] = useState(true)
  const [loadingSorties, setLoadingSorties] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // historique des sorties
  const [historySorties, setHistorySorties] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  // historique des entrées
  const [historyEntrees, setHistoryEntrees] = useState<any[]>([])
  const [isEntreeHistoryModalOpen, setIsEntreeHistoryModalOpen] = useState(false)
  const [historyFilterName, setHistoryFilterName] = useState("")

  // Champs pour l'onglet Entrée
  const [nomEntree, setNomEntree] = useState("")
  const [quantiteEntree, setQuantiteEntree] = useState("")

  // États pour impression
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printEntry, setPrintEntry] = useState<StockEntree | null>(null)
  const [destinateur, setDestinateur] = useState("")
  const [adresse, setAdresse] = useState("")
  const [telephone, setTelephone] = useState("")
  const [livrer_par, setLivrer_par] = useState("")

  // État pour la modale de sortie
  const [isSortieModalOpen, setIsSortieModalOpen] = useState(false)
  const [entreeSelected, setEntreeSelected] = useState<StockEntree | null>(null)
  const [quantiteSortie, setQuantiteSortie] = useState("")

  // Charger les données au montage
  useEffect(() => {
    loadEntrees()
    loadSorties()
  }, [])

  async function loadEntrees() {
    try {
      setLoadingEntrees(true)
      setError(null)
      const data = await getStockEntrees()
      setEntrees(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des entrées")
      console.error("Erreur:", err)
    } finally {
      setLoadingEntrees(false)
    }
  }

  async function loadSorties() {
    try {
      setLoadingSorties(true)
      setError(null)
      const data = await getStockSorties()
      setSorties(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des sorties")
      console.error("Erreur:", err)
    } finally {
      setLoadingSorties(false)
    }
  }

  async function loadHistory(name?: string) {
    try {
      setLoadingHistory(true)
      setError(null)
      const data = await getStockSortiesHistory(name)
      setHistorySorties(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement de l'historique")
      console.error("Erreur:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  async function loadEntreesHistory(name?: string) {
    try {
      setLoadingHistory(true)
      setError(null)
      const data = await getStockEntreesHistory(name)
      setHistoryEntrees(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement de l'historique des entrées")
      console.error("Erreur:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  async function handleAddEntree(e: React.FormEvent) {
    e.preventDefault()
    if (!nomEntree.trim() || !quantiteEntree || parseInt(quantiteEntree) <= 0) {
      return
    }

    try {
      setError(null)
      const newEntree = await createStockEntree({
        nom: nomEntree.trim(),
        quantite: parseInt(quantiteEntree),
      })
      // si l'entrée existe déjà, remplacer la quantité, sinon ajouter
      setEntrees((prev) => {
        const idx = prev.findIndex((e) => e.id === newEntree.id || e.nom === newEntree.nom)
        if (idx !== -1) {
          const copy = [...prev]
          if (newEntree.quantite <= 0) {
            // supprime si zéro
            copy.splice(idx, 1)
          } else {
            copy[idx] = newEntree
          }
          return copy
        }
        return [...prev, newEntree]
      })
      setNomEntree("")
      setQuantiteEntree("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout de l'entrée")
      console.error("Erreur:", err)
    }
  }

  function handleOpenSortieModal(entree: StockEntree) {
    setEntreeSelected(entree)
    setQuantiteSortie("")
    setIsSortieModalOpen(true)
  }

  function handleCloseSortieModal() {
    setIsSortieModalOpen(false)
    setEntreeSelected(null)
    setQuantiteSortie("")
  }

  async function handleRetirerStock(e: React.FormEvent) {
    e.preventDefault()
    if (!entreeSelected || !quantiteSortie || parseInt(quantiteSortie) <= 0) {
      return
    }

    const quantite = parseInt(quantiteSortie)
    if (quantite > entreeSelected.quantite) {
      setError(`La quantité à retirer (${quantite}) ne peut pas être supérieure à la quantité disponible (${entreeSelected.quantite})`)
      return
    }

    try {
      setError(null)
      const newSortie = await createStockSortie({
        nom: entreeSelected.nom,
        quantite: quantite,
        entreeId: entreeSelected.id,
      })
      setSorties([...sorties, newSortie])
      // Recharger les entrées pour mettre à jour les quantités
      await loadEntrees()
      handleCloseSortieModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sortie de stock")
      console.error("Erreur:", err)
    }
  }

  // Calculer le total des quantités pour les entrées
  const totalEntrees = entrees.reduce((sum, entree) => sum + entree.quantite, 0)

  // supprimer une entrée explicitement
  async function handleDeleteEntree(id: string) {
    toast(`Supprimer cette entrée ?`, {
      action: {
        label: "Oui",
        onClick: async () => {
          try {
            setError(null)
            await deleteStockEntree(id)
            await loadEntrees()
            toast.success("Suppression effectuée")
          } catch (err) {
            toast.error("Échec de la suppression")
            setError(err instanceof Error ? err.message : "Erreur lors de la suppression")
            console.error("Erreur:", err)
          }
        },
      },
    })
  }

  function handleOpenEntreeHistory(entree: StockEntree) {
    setHistoryFilterName(entree.nom)
    loadEntreesHistory(entree.nom)
    setIsEntreeHistoryModalOpen(true)
  }

  // Handlers pour impression
  function handleOpenPrint(entree: StockEntree) {
    setPrintEntry(entree)
    setDestinateur("")
    setAdresse("")
    setTelephone("")
    setIsPrintModalOpen(true)
  }

  function handleClosePrint() {
    setIsPrintModalOpen(false)
    setPrintEntry(null)
  }

  function printReceipt() {
  if (!printEntry) return

  const companyName = "Kiss Service"
  const phones = "76 40 38 41 / 76 40 38 40"
  const today = new Date()
  const dateStr = today.toLocaleDateString()
  const timeStr = today.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  // Optionnel : numéro / référence
  const courierNumber = `STK-${String(printEntry.id).padStart(6, "0")}`

  const content = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Reçu</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; margin: 14px; color: #111; }
  .ticket { width: 820px; max-width: 100%; margin: 0 auto; border: 2px solid #111; }
  .row { display: flex; width: 100%; }
  .cell { border: 1px solid #111; padding: 8px 10px; }
  .cell.tight { padding: 6px 8px; }
  .header { align-items: stretch; }
  .header .left { width: 30%; font-weight: 800; font-size: 28px; letter-spacing: 1px; }
  .header .middle { width: 40%; text-align: center; font-weight: 700; font-size: 14px; padding-top: 10px; }
  .header .right { width: 30%; text-align: right; font-weight: 900; font-size: 22px; }
  .subheader .cell { font-size: 12px; font-weight: 700; }
  .subheader .value { font-weight: 600; margin-left: 6px; }
  .main { align-items: stretch; }
  /* autorise centre full width grâce à flex:1 */
  .center { flex: 1; padding: 0; }

  /* barre à droite uniquement */
  .rightBar { width: 18%; min-height: 340px; display: flex; align-items: center; justify-content: center; position: relative; }
  .rightBar .barcode {
    width: 90%;
    height: 300px;
    border: 1px dashed #111;
    display: flex;
    align-items: center;
    justify-content: center;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-weight: 700;
    font-size: 12px;
  }
  .blockTitle { font-weight: 800; text-transform: uppercase; font-size: 13px; background: #f2f2f2; }
  .fieldRow { display: flex; width: 100%; }
  .label { width: 42%; font-weight: 800; text-transform: uppercase; font-size: 12px; background: #fafafa; }
  .val { width: 58%; font-weight: 700; font-size: 13px; }
  .qrWrap { height: 220px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #111; }
  .qr {
    width: 160px; height: 160px;
    border: 2px solid #111;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800;
  }
  .rightMeta { padding: 10px; }
  .rightMeta .k { font-weight: 900; text-transform: uppercase; font-size: 12px; }
  .rightMeta .v { font-weight: 800; font-size: 13px; margin-top: 6px; word-break: break-all; }
  .footer { font-size: 12px; }
  .footer .cell { font-weight: 800; }
  .note { font-size: 11px; padding: 10px; border-top: 1px solid #111; }
  @media print {
    body { margin: 0; }
    .ticket { width: 100%; border: 2px solid #111; }
  }
</style>
</head>
<body>
  <div class="ticket">

    <!-- EN-TÊTE (comme sur le modèle : nom à gauche, téléphone au centre, titre à droite) -->
    <div class="row header">
      <div class="cell left">${companyName}</div>
      <div class="cell middle">${phones}</div>
      <div class="cell right">REÇU DE LIVRAISON</div>
    </div>

    <!-- LIGNE INFOS VOYAGE (style “DATE / HEURE”) -->
    <div class="row subheader">
      <div class="cell tight" style="width: 50%;">DATE:<span class="value"> ${dateStr} </span></div>
      <div class="cell tight" style="width: 50%;">HEURE:<span class="value"> ${timeStr} </span></div>
    </div>

    <!-- CORPS -->
    <div class="row main">
      <!-- CENTRE (formulaire expéditeur/destinataire/nature) -->
      <div class="cell center">
        <div class="row">
          <div class="cell blockTitle" style="width: 100%;">EXPÉDITEUR</div>
        </div>

        <div class="fieldRow">
          <div class="cell label">Nom</div>
          <div class="cell val">${printEntry.nom}</div>
        </div>
        <div class="fieldRow">
          <div class="cell label">Quantité</div>
          <div class="cell val">${printEntry.quantite}</div>
        </div>

        <div class="fieldRow">
          <div class="cell label">Livré par</div>
          <div class="cell val">${livrer_par || "—"}</div>
        </div>

        <div class="row">
          <div class="cell blockTitle" style="width: 100%;">DESTINATAIRE</div>
        </div>
        <div class="fieldRow">
          <div class="cell label">Nom</div>
          <div class="cell val">${destinateur || "—"}</div>
        </div>
        <div class="fieldRow">
          <div class="cell label">Adresse</div>
          <div class="cell val">${adresse || "—"}</div>
        </div>
      </div>
      <div class="cell rightBar">
        <div class="barcode"></div>
      </div>
    </div>

    <div class="note">
      * Note : Conservez ce reçu.
    </div>
  </div>
</body>
</html>`

  const w = window.open("", "_blank", "width=900,height=700")
  if (w) {
    w.document.write(content)
    w.document.close()
    w.focus()
    w.print()
    w.close()
  }

  handleClosePrint()
}

  return (
    <DashboardLayout title="Stock voyage">
      <div className="space-y-6">
        {/* En-tête */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion du stock voyage</h2>
          <p className="text-muted-foreground">
            Gérez les entrées et sorties de stock
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Onglets */}
        <Tabs defaultValue="entree" className="w-full">
          <TabsList>
            <TabsTrigger value="entree">Entrée</TabsTrigger>
            <TabsTrigger value="sortie">Sortie</TabsTrigger>
          </TabsList>

          {/* Onglet Entrée */}
          <TabsContent value="entree" className="space-y-6">
            {/* Formulaire d'ajout */}
            <div className="rounded-lg border border-border bg-card p-6">
              <form onSubmit={handleAddEntree} className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="nomEntree">Nom</Label>
                  <Input
                    id="nomEntree"
                    placeholder="Ex: Produit A"
                    value={nomEntree}
                    onChange={(e) => setNomEntree(e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="quantiteEntree">Quantité</Label>
                  <Input
                    id="quantiteEntree"
                    type="number"
                    placeholder="Ex: 10"
                    value={quantiteEntree}
                    onChange={(e) => setQuantiteEntree(e.target.value)}
                    min="1"
                    required
                  />
                </div>
                <Button type="submit">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </form>
            </div>

            {/* Liste des entrées */}
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Liste des stocks entrés
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    loadEntreesHistory(historyFilterName)
                    setIsEntreeHistoryModalOpen(true)
                  }}
                >
                  Historique entrées
                </Button>
              </div>

              {loadingEntrees ? (
                <div className="py-12 text-center text-muted-foreground">
                  Chargement...
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold text-foreground">Nom</TableHead>
                        <TableHead className="text-right font-semibold text-foreground">
                          Quantité
                        </TableHead>
                        <TableHead className="text-center font-semibold text-foreground">
                          Impression
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entrees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                            Aucune entrée enregistrée
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {entrees.map((entree) => (
                            <TableRow key={entree.id}>
                              <TableCell className="font-medium text-foreground">
                                {entree.nom}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {entree.quantite}
                              </TableCell>
                              <TableCell className="text-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenPrint(entree)}
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  Imprimer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEntreeHistory(entree)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteEntree(entree.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Ligne Total */}
                          <TableRow className="border-t-2 border-foreground/20 bg-muted/60 font-semibold">
                            <TableCell className="text-foreground">Total</TableCell>
                            <TableCell className="text-right tabular-nums text-foreground">
                              {totalEntrees}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </>
              )}
            </div>
          </TabsContent>

          {/* Onglet Sortie */}
          <TabsContent value="sortie" className="space-y-6">
            {/* Liste des entrées avec bouton de sortie */}
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Liste des stocks disponibles
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur le bouton pour retirer une quantité
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    loadHistory(historyFilterName)
                    setIsHistoryModalOpen(true)
                  }}
                >
                  Historique sorties
                </Button>
              </div>

              {loadingEntrees ? (
                <div className="py-12 text-center text-muted-foreground">
                  Chargement...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-foreground">Nom</TableHead>
                      <TableHead className="text-right font-semibold text-foreground">
                        Quantité disponible
                      </TableHead>
                      <TableHead className="text-center font-semibold text-foreground">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entrees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                          Aucune entrée disponible
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {entrees.map((entree) => (
                          <TableRow key={entree.id}>
                            <TableCell className="font-medium text-foreground">
                              {entree.nom}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {entree.quantite}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                                size="sm"
                                onClick={() => handleOpenSortieModal(entree)}
                              >
                                <Minus className="mr-2 h-4 w-4" />
                                Retirer
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Ligne Total */}
                        <TableRow className="border-t-2 border-foreground/20 bg-muted/60 font-semibold">
                          <TableCell className="text-foreground">Total</TableCell>
                          <TableCell className="text-right tabular-nums text-foreground">
                            {totalEntrees}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Modale pour retirer du stock */}
            <Dialog open={isSortieModalOpen} onOpenChange={setIsSortieModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Retirer du stock</DialogTitle>
                  <DialogDescription>
                    {entreeSelected && (
                      <>
                        Retirer une quantité de <strong>{entreeSelected.nom}</strong>
                        <br />
                        Quantité disponible : <strong>{entreeSelected.quantite}</strong>
                      </>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRetirerStock} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantiteRetirer">Quantité à retirer</Label>
                    <Input
                      id="quantiteRetirer"
                      type="number"
                      placeholder="Ex: 5"
                      value={quantiteSortie}
                      onChange={(e) => setQuantiteSortie(e.target.value)}
                      min="1"
                      max={entreeSelected?.quantite || undefined}
                      required
                    />
                    {entreeSelected && (
                      <p className="text-xs text-muted-foreground">
                        Maximum : {entreeSelected.quantite}
                      </p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseSortieModal}
                    >
                      Annuler
                    </Button>
                    <Button type="submit">
                      <Minus className="mr-2 h-4 w-4" />
                      Retirer
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            


            
            {/* Modal historique sorties */}
            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Historique des sorties</DialogTitle>
                </DialogHeader>

                {loadingHistory ? (
                  <div className="py-12 text-center text-muted-foreground">Chargement...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Filtrer par nom"
                        value={historyFilterName}
                        onChange={(e) => setHistoryFilterName(e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={() => loadHistory(historyFilterName)}
                      >
                        Rechercher
                      </Button>
                    </div>
                    <div className="max-h-[60vh] overflow-auto">
                      {historySorties.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune sortie enregistrée</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-semibold text-foreground">Nom</TableHead>
                              <TableHead className="text-right font-semibold text-foreground">Quantité</TableHead>
                              <TableHead className="text-right font-semibold text-foreground">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historySorties.map((h) => (
                              <TableRow key={h.history_id}>
                                <TableCell>{h.nom}</TableCell>
                                <TableCell className="text-right tabular-nums">{h.quantite}</TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">
                                  {h.saved_at}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>

        {/* Modal historique entrées */}
        <Dialog open={isEntreeHistoryModalOpen} onOpenChange={setIsEntreeHistoryModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Historique des entrées</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Nom"
                  value={historyFilterName}
                  onChange={(e) => setHistoryFilterName(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => loadEntreesHistory(historyFilterName)}
                >
                  Rechercher
                </Button>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center text-muted-foreground">Chargement...</div>
              ) : (
                <div className="max-h-[60vh] overflow-auto">
                  {historyEntrees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune entrée enregistrée</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold text-foreground">Nom</TableHead>
                          <TableHead className="text-right font-semibold text-foreground">Quantité</TableHead>
                          <TableHead className="text-right font-semibold text-foreground">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyEntrees.map((h) => (
                          <TableRow key={h.history_id}>
                            <TableCell>{h.nom}</TableCell>
                            <TableCell className="text-right tabular-nums">{h.quantite}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {h.saved_at}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modale pour impression de reçu */}
        <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Imprimer un reçu</DialogTitle>
              <DialogDescription>
                {printEntry && (
                  <>
                    Préparez le reçu pour <strong>{printEntry.nom}</strong> ({printEntry.quantite})
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destinateur">Destinateur</Label>
                <Input
                  id="destinateur"
                  placeholder="Nom du destinateur"
                  value={destinateur}
                  onChange={(e) => setDestinateur(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse du destinateur</Label>
                <Input
                  id="adresse"
                  placeholder="Adresse du destinateur"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="livrer_par">Livré par</Label>
                <Input
                  id="livrer_par"
                  placeholder="Nom du livreur"
                  value={livrer_par}
                  onChange={(e) => setLivrer_par(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClosePrint}
                >
                  Annuler
                </Button>
                <Button type="button" onClick={printReceipt}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
