/**
 * =============================================================
 * FICHIER: app/transactions/page.tsx — PAGE TRANSACTIONS
 * =============================================================
 *
 * URL: "/transactions"
 *
 * CONCEPT IMPORTANT : Routing par fichiers (File-based Routing)
 *
 * Dans Next.js (App Router), l'arborescence des dossiers
 * definit les URLs de l'application :
 *
 *   app/page.tsx            -> URL "/"
 *   app/transactions/page.tsx -> URL "/transactions"  (cette page)
 *   app/clients/page.tsx    -> URL "/clients"
 *
 * Pas besoin de configurer un routeur ! Next.js le fait
 * automatiquement grace a la structure des dossiers.
 *
 * Cette page est dediee a la gestion des transactions.
 * Elle contient le meme tableau que le Dashboard mais
 * avec le formulaire d'ajout/modification bien en vue.
 *
 * NOTE : Pour le moment, chaque page a son propre state.
 * Les donnees ne sont PAS partagees entre les pages.
 * Quand on ajoutera le backend, les donnees viendront
 * de la base de donnees et seront les memes partout.
 * =============================================================
 */
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/data-table"
import { EntryFormModal } from "@/components/entry-form-modal"
import type { Entry, EntryFormData } from "@/lib/types"
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionHistory,
} from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

type HistoryChange = {
  from: unknown
  to: unknown
}

type HistoryItem = {
  history_id?: string
  saved_at?: string
  diffToNext?: Record<string, HistoryChange>
  clientId?: string
  nomClient?: string
  nombre?: number
  prixUnitaire?: number
  montant?: number
  paye?: number
  restant?: number
  depenseMotif?: string
  depenseMontant?: number
}

type HistoryResponse = {
  current: Entry
  history: HistoryItem[]
}

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

export default function TransactionsPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null)
  const [historyEntryName, setHistoryEntryName] = useState<string | null>(null)

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
      setEntries((prev) => [newEntry, ...prev.filter((e) => e.id !== newEntry.id)])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création de la transaction")
      console.error("Erreur:", err)
      throw err
    }
  }

  async function handleEditEntry(id: string, formData: EntryFormData) {
    try {
      setError(null)
      const updated = await updateTransaction(id, formData)
      setEntries((prev) => {
        const filtered = prev.filter((e) => e.id !== id)
        return [updated, ...filtered]
      })
      setEntryToEdit(null)
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
      setEntries((prev) => prev.filter((entry) => entry.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression de la transaction")
      console.error("Erreur:", err)
    }
  }

  async function handleViewHistory(id: string, name?: string) {
    try {
      setHistoryOpen(true)
      setHistoryLoading(true)
      setHistoryError(null)
      setHistoryData(null)
      setHistoryEntryName(name || null)

      const data = await getTransactionHistory(id)
      setHistoryData(data)
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Erreur lors du chargement de l'historique")
      console.error(err)
    } finally {
      setHistoryLoading(false)
    }
  }

  function formatMoney(value: unknown) {
    return `${Number(value || 0).toLocaleString("fr-FR")} FCFA`
  }

  function getFieldLabel(field: string) {
    const labelMap: Record<string, string> = {
      clientId: "Client",
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

  function areSnapshotsEquivalentToCurrent(item: HistoryItem, current: Entry) {
    return TRACKED_FIELDS.every((field) => {
      return Number(item[field] ?? 0) === Number(current[field] ?? 0) ||
        String(item[field] ?? "") === String(current[field] ?? "")
    })
  }

  function normalizePreviousVersions(data: HistoryResponse | null) {
    if (!data) return []

    const rawHistory = Array.isArray(data.history) ? data.history : []

    const withoutCurrentDuplicate = rawHistory.filter((item) => {
      return !areSnapshotsEquivalentToCurrent(item, data.current)
    })

    const deduped = withoutCurrentDuplicate.filter((item, index, arr) => {
      return index === arr.findIndex((x) => {
        const sameSavedAt = String(x.saved_at || "") === String(item.saved_at || "")
        const samePayload = TRACKED_FIELDS.every((field) => {
          return String(x[field] ?? "") === String(item[field] ?? "")
        })
        return sameSavedAt && samePayload
      })
    })

    return deduped
  }

  const previousVersions = normalizePreviousVersions(historyData)
  const latestDiffFields = historyData?.history?.[0]?.diffToNext
    ? Object.keys(historyData.history[0].diffToNext || {})
    : []

  return (
    <DashboardLayout title="Transactions">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Gestion des transactions
          </h2>
          <p className="text-muted-foreground">
            Ajoutez, modifiez ou supprimez vos transactions
          </p>
        </div>

        <EntryFormModal
          onSubmit={handleAddEntry}
          onEdit={handleEditEntry}
          entryToEdit={entryToEdit}
          onClose={() => setEntryToEdit(null)}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          Chargement des transactions...
        </div>
      ) : (
        <>
          <DataTable
            entries={entries}
            onDelete={handleDeleteEntry}
            onEdit={(entry) => setEntryToEdit(entry)}
            onViewHistory={(id) => {
              const entry = entries.find((e) => e.id === id)
              handleViewHistory(id, entry?.nomClient)
            }}
          />

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

                      {latestDiffFields.length > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Derniers champs modifiés :{" "}
                          {latestDiffFields.map(getFieldLabel).join(", ")}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="mb-3 font-semibold">Versions précédentes</div>

                      {previousVersions.length === 0 ? (
                        <div className="rounded border p-3">
                          <div className="text-sm text-muted-foreground">
                            Sauvegardé:{" "}
                            {historyData.current.created_at ||
                              historyData.current.updated_at ||
                              "—"}
                          </div>

                          <div className="mt-2 text-sm font-medium">
                            Première version
                          </div>

                          <ul className="mt-3 space-y-2 text-sm">
                            <li className="flex flex-col gap-0.5">
                              <span className="text-muted-foreground">Client</span>
                              <span className="font-medium">
                                {historyData.current.nomClient}
                              </span>
                            </li>

                            <li className="flex flex-col gap-0.5">
                              <span className="text-muted-foreground">Montant</span>
                              <span className="font-semibold">
                                {formatMoney(historyData.current.montant)}
                              </span>
                            </li>

                            <li className="flex flex-col gap-0.5">
                              <span className="text-muted-foreground">Payé</span>
                              <span>{formatMoney(historyData.current.paye)}</span>
                            </li>

                            <li className="flex flex-col gap-0.5">
                              <span className="text-muted-foreground">Restant</span>
                              <span className="font-semibold">
                                {formatMoney(historyData.current.restant)}
                              </span>
                            </li>
                          </ul>
                        </div>
                      ) : (
                        previousVersions.map((h, index) => (
                          <div
                            key={h.history_id || `${h.saved_at}-${index}`}
                            className="rounded border p-3"
                          >
                            <div className="text-sm text-muted-foreground">
                              Sauvegardé: {h.saved_at || "—"}
                            </div>

                            {h.diffToNext && Object.keys(h.diffToNext).length > 0 ? (
                              <div className="mt-2">
                                <div className="text-sm font-medium">Changements</div>
                                <ul className="mt-2 space-y-2 text-sm">
                                  {Object.entries(h.diffToNext).map(([field, change]) => {
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
                                          <span className="font-semibold">
                                            {formatMoney(change.to)}
                                          </span>
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
                                        <span className="w-40 text-muted-foreground">
                                          {getFieldLabel(field)}
                                        </span>
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
                                    <span className="font-semibold">
                                      {formatMoney(h.montant)}
                                    </span>
                                  </li>
                                  <li className="flex flex-col gap-0.5">
                                    <span className="text-muted-foreground">Payé</span>
                                    <span>{formatMoney(h.paye)}</span>
                                  </li>
                                  <li className="flex flex-col gap-0.5">
                                    <span className="text-muted-foreground">Restant</span>
                                    <span className="font-semibold">
                                      {formatMoney(h.restant)}
                                    </span>
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
