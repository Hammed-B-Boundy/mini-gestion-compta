"use client"

/**
 * =============================================================
 * FICHIER: app/page.tsx — LE DASHBOARD (page d'accueil "/")
 * =============================================================
 *
 * C'est la page qui s'affiche quand on va sur "/".
 *
 * CHANGEMENT : Avant, tout le code de la sidebar etait ici.
 * Maintenant on utilise <DashboardLayout> qui contient la sidebar.
 * Cette page ne gere que le CONTENU du dashboard.
 *
 * Comme on n'a pas encore de backend, les donnees sont stockees
 * dans un useState local. Quand on rafraichit la page, on perd
 * les modifications (c'est normal, on ajoutera le backend plus tard).
 * =============================================================
 */

import { useState, useEffect } from "react"

// Le layout reutilisable avec la sidebar
import { DashboardLayout } from "@/components/dashboard-layout"

// Nos composants
import { SummaryCards } from "@/components/summary-cards"
import { DataTable } from "@/components/data-table"
import { EntryFormModal } from "@/components/entry-form-modal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"

// Nos types
import type { Entry, EntryFormData } from "@/lib/types"

// API
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/api"

// Fonction pour filtrer et dédupliquer les versions précédentes
const TRACKED_FIELDS = [
  "nomClient",
  "nombre",
  "prixUnitaire",
  "montant",
  "paye",
  "restant",
  "depenseMotif",
  "depenseMontant",
] as const

function areSnapshotsEquivalentToCurrent(item: any, current: any) {
  return TRACKED_FIELDS.every((field) => {
    return (
      Number(item[field] ?? 0) === Number(current[field] ?? 0) ||
      String(item[field] ?? "") === String(current[field] ?? "")
    )
  })
}

function normalizePreviousVersions(data: any) {
  if (!data) return []

  const rawHistory = Array.isArray(data.history) ? data.history : []

  const withoutCurrentDuplicate = rawHistory.filter((item: any) => {
    return !areSnapshotsEquivalentToCurrent(item, data.current)
  })

  const deduped = withoutCurrentDuplicate.filter(
    (item: any, index: number, arr: any[]) => {
      return index === arr.findIndex((x: any) => {
        const sameSavedAt = String(x.saved_at || "") === String(item.saved_at || "")
        const samePayload = TRACKED_FIELDS.every((field) => {
          return String(x[field] ?? "") === String(item[field] ?? "")
        })
        return sameSavedAt && samePayload
      })
    }
  )

  return deduped
}

function formatMoney(value: unknown) {
  return `${Number(value || 0).toLocaleString("fr-FR")} FCFA`
}

function getFieldLabel(field: string) {
  const labelMap: Record<string, string> = {
    nomClient: "Client",
    nombre: "Nombre",
    prixUnitaire: "Prix unitaire",
    montant: "Montant",
    paye: "Payé",
    restant: "Restant",
    depenseMotif: "Dépense (motif)",
    depenseMontant: "Dépense (montant)",
  }
  return labelMap[field] || field
}

function isMoneyField(field: string) {
  return ["prixUnitaire", "montant", "paye", "restant", "depenseMontant"].includes(field)
}

export default function Page() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ajout pour l'historique
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyData, setHistoryData] = useState<any | null>(null)
  const [historyEntryName, setHistoryEntryName] = useState<string | null>(null)

  // Charger les transactions au montage du composant
  useEffect(() => {
    loadTransactions()
  }, [])

  async function loadTransactions() {
    try {
      setLoading(true)
      setError(null)
      const data = await getTransactions()
      setEntries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des transactions")
      console.error("Erreur:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddEntry(formData: EntryFormData) {
    try {
      setError(null)
      const newEntry = await createTransaction(formData)
      setEntries([newEntry, ...entries])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création de la transaction")
      console.error("Erreur:", err)
      throw err // Re-lancer pour que le modal puisse gérer l'erreur
    }
  }

  async function handleEditEntry(id: string, formData: EntryFormData) {
    try {
      setError(null)
      const updatedEntry = await updateTransaction(id, formData)
      setEntries(entries.map((entry) => (entry.id === id ? updatedEntry : entry)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la modification de la transaction")
      console.error("Erreur:", err)
      throw err
    }
  }

  async function handleDeleteEntry(id: string) {
    try {
      setError(null)
      await deleteTransaction(id)
      setEntries(entries.filter((entry) => entry.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression de la transaction")
      console.error("Erreur:", err)
    }
  }

  // Fonction pour charger l'historique
  async function handleViewHistory(id: string, name?: string) {
    try {
      setHistoryOpen(true)
      setHistoryLoading(true)
      setHistoryError(null)
      setHistoryData(null)
      setHistoryEntryName(name || null)

      const { getTransactionHistory } = await import("@/lib/api")
      const data = await getTransactionHistory(id)
      setHistoryData(data)
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Erreur lors du chargement de l'historique")
      console.error(err)
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    /**
     * <DashboardLayout title="..."> entoure tout le contenu.
     * Il fournit la sidebar + le header automatiquement.
     * On ne passe que le titre et le contenu (children).
     */
    <DashboardLayout title="Tableau de bord">
      {/* Titre + bouton d'ajout */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Apercu financier
          </h2>
          <p className="text-muted-foreground">
            Vue d'ensemble de vos transactions et depenses
          </p>
        </div>
        <EntryFormModal
          onSubmit={handleAddEntry}
          onEdit={handleEditEntry}
          entryToEdit={entryToEdit}
          onClose={() => setEntryToEdit(null)}
        />
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* État de chargement */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          Chargement des transactions...
        </div>
      ) : (
        <>
          {/* Les 4 cartes recapitulatives */}
          <SummaryCards entries={entries} />

          {/* Le tableau des transactions */}
          <DataTable
            entries={entries}
            onDelete={handleDeleteEntry}
            onEdit={(entry) => setEntryToEdit(entry)}
            onViewHistory={(id) => {
              const entry = entries.find((e) => e.id === id)
              handleViewHistory(id, entry?.nomClient)
            }}
          />

          {/* Modale d'historique harmonisée avec Transactions */}
          <Dialog
            open={historyOpen}
            onOpenChange={(open) => {
              setHistoryOpen(open)
              if (!open) {
                setHistoryData(null)
                setHistoryError(null)
                setHistoryEntryName(null)
              }
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Historique{historyEntryName ? ` — ${historyEntryName}` : ""}
                </DialogTitle>
                <DialogDescription>
                  {historyLoading
                    ? "Chargement de l'historique..."
                    : historyError || "Versions précédentes de la transaction"}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 max-h-[70vh] space-y-4 overflow-auto pr-2">
                {historyLoading ? (
                  <div className="text-center text-muted-foreground">Chargement...</div>
                ) : historyError ? (
                  <div className="text-red-600">{historyError}</div>
                ) : historyData ? (
                  <>
                    <div>
                      <div className="mb-3 font-semibold">État courant</div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded bg-muted/50 p-3 text-sm">
                        <div className="text-muted-foreground">Client</div>
                        <div className="font-medium">{historyData.current.nomClient}</div>

                        <div className="text-muted-foreground">Montant</div>
                        <div className="font-medium tabular-nums">
                          {formatMoney(historyData.current.montant)}
                        </div>

                        <div className="text-muted-foreground">Payé</div>
                        <div className="font-medium tabular-nums text-emerald-700">
                          {formatMoney(historyData.current.paye)}
                        </div>

                        <div className="text-muted-foreground">Restant</div>
                        <div className="font-medium tabular-nums text-amber-700">
                          {formatMoney(historyData.current.restant)}
                        </div>

                        <div className="text-muted-foreground">Dernière mise à jour</div>
                        <div>{historyData.current.updated_at || "—"}</div>
                      </div>
                    </div>

                    {/* Affichage des champs modifiés */}
                    {historyData.history && historyData.history[0]?.diffToNext && Object.keys(historyData.history[0].diffToNext).length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Derniers champs modifiés : {Object.keys(historyData.history[0].diffToNext).map(getFieldLabel).join(", ")}
                      </p>
                    )}

                    <div>
                      <div className="mb-3 font-semibold">Versions précédentes</div>
                      {normalizePreviousVersions(historyData).length === 0 ? (
                        <div className="rounded border p-3">
                          <div className="text-sm text-muted-foreground">
                            Sauvegardé: {historyData.current.created_at || historyData.current.updated_at || "—"}
                          </div>
                          <div className="mt-2 text-sm font-medium">Première version</div>
                          <ul className="mt-3 space-y-2 text-sm">
                            <li className="flex flex-col gap-0.5">
                              <span className="text-muted-foreground">Client</span>
                              <span className="font-medium">{historyData.current.nomClient}</span>
                            </li>
                            <li className="flex flex-col gap-0.5">
                              <span className="text-muted-foreground">Montant</span>
                              <span className="font-semibold">{formatMoney(historyData.current.montant)}</span>
                            </li>
                            <li className="flex flex-col gap-0.5">
                              <span className="text-muted-foreground">Payé</span>
                              <span>{formatMoney(historyData.current.paye)}</span>
                            </li>
                            <li className="flex flex-col gap-0.5">
                              <span className="text-muted-foreground">Restant</span>
                              <span className="font-semibold">{formatMoney(historyData.current.restant)}</span>
                            </li>
                          </ul>
                        </div>
                      ) : (
                        normalizePreviousVersions(historyData).map((h: any, index: number) => (
                          <div key={h.history_id || `${h.saved_at}-${index}`} className="rounded border p-3">
                            <div className="text-sm text-muted-foreground">Sauvegardé: {h.saved_at || "—"}</div>

                            {h.diffToNext && Object.keys(h.diffToNext).length > 0 ? (
                              <div className="mt-2">
                                <div className="text-sm font-medium">Changements</div>
                                <ul className="mt-2 space-y-2 text-sm">
                                  {Object.entries(h.diffToNext).map(([field, change]: [string, any]) => {
                                    if (field === "paye") {
                                      const previousPaid = Number(change.from || 0)
                                      const newPaid = Number(change.to || 0)
                                      const addedPayment = newPaid - previousPaid

                                      return (
                                        <li key={field} className="flex flex-col gap-0.5">
                                          <span className="text-muted-foreground">Paiement ajouté</span>
                                          <span>{formatMoney(addedPayment)}</span>

                                          <span className="mt-1 text-muted-foreground">Total payé</span>
                                          <span className="font-semibold">{formatMoney(newPaid)}</span>
                                        </li>
                                      )
                                    }

                                    if (field === "restant") {
                                      return (
                                        <li key={field} className="flex flex-col gap-0.5">
                                          <span className="text-muted-foreground">Restant</span>
                                          <span className="font-semibold">{formatMoney(change.to)}</span>
                                        </li>
                                      )
                                    }

                                    const from = isMoneyField(field)
                                      ? formatMoney(change.from)
                                      : String(change.from ?? "—")

                                    const to = isMoneyField(field)
                                      ? formatMoney(change.to)
                                      : String(change.to ?? "—")

                                    return (
                                      <li key={field} className="flex items-center gap-2">
                                        <span className="w-40 text-muted-foreground">{getFieldLabel(field)}</span>
                                        <span>
                                          {from}
                                          <span className="mx-2 text-muted-foreground">→</span>
                                          <strong>{to}</strong>
                                        </span>
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <div className="text-sm font-medium">Première version</div>
                                <ul className="mt-2 space-y-2 text-sm">
                                  <li className="flex flex-col gap-0.5">
                                    <span className="text-muted-foreground">Client</span>
                                    <span className="font-medium">{h.nomClient || "—"}</span>
                                  </li>
                                  <li className="flex flex-col gap-0.5">
                                    <span className="text-muted-foreground">Montant</span>
                                    <span className="font-semibold">{formatMoney(h.montant)}</span>
                                  </li>
                                  <li className="flex flex-col gap-0.5">
                                    <span className="text-muted-foreground">Payé</span>
                                    <span>{formatMoney(h.paye)}</span>
                                  </li>
                                  <li className="flex flex-col gap-0.5">
                                    <span className="text-muted-foreground">Restant</span>
                                    <span className="font-semibold">{formatMoney(h.restant)}</span>
                                  </li>
                                </ul>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Aucune donnée</div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  )
}
