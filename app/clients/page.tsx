/**
 * =============================================================
 * FICHIER: app/clients/page.tsx — PAGE CLIENTS
 * =============================================================
 *
 * URL: "/clients"
 *
 * Cette page affiche la liste des clients extraite des transactions.
 *
 * CONCEPT IMPORTANT : Donnees derivees (Derived State)
 *
 * On ne stocke PAS une liste de clients separee.
 * Au lieu de ca, on EXTRAIT les clients uniques depuis
 * les transactions existantes avec un "reduce" + "Map".
 *
 * C'est un pattern courant en React : plutot que dupliquer
 * les donnees, on les CALCULE a partir de la source unique
 * (les transactions). Ca evite les problemes de synchronisation.
 *
 * Quand on ajoutera le backend, les clients pourront avoir
 * leur propre table en base de donnees.
 * =============================================================
 */
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, UserPlus, Pencil, Trash2, Eye } from "lucide-react"
import { getClients, createClient, updateClient, deleteClient, type Client } from "@/lib/api"

/**
 * Fonction utilitaire pour formater un montant en FCFA.
 */
function formatMoney(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [newClientName, setNewClientName] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // état pour modification / suppression
  const [isEditClientOpen, setIsEditClientOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editClientName, setEditClientName] = useState("")

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)

  // Charger les clients au montage du composant
  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      setLoading(true)
      setError(null)
      const data = await getClients()
      setClients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des clients")
      console.error("Erreur:", err)
    } finally {
      setLoading(false)
    }
  }

  // Filtrage par recherche
  const filteredClients = clients.filter((client) =>
    client.nom.toLowerCase().includes(searchQuery.toLowerCase())
  )

  /**
   * Ajout d'un nouveau client via l'API
   */
  async function handleAddClient() {
    if (!newClientName.trim()) return

    try {
      setError(null)
      const newClient = await createClient(newClientName.trim())
      setClients([...clients, newClient])
      setNewClientName("")
      setIsAddClientOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création du client")
      console.error("Erreur:", err)
    }
  }

  async function handleEditClient() {
    if (!editingClient || !editClientName.trim()) return

    try {
      setError(null)
      const updated = await updateClient(editingClient.id, editClientName.trim())
      setClients(clients.map(c => (c.id === updated.id ? updated : c)))
      setIsEditClientOpen(false)
      setEditingClient(null)
      setEditClientName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour du client")
      console.error("Erreur:", err)
    }
  }

  async function handleConfirmDelete() {
    if (!deletingClient) return

    try {
      setError(null)
      await deleteClient(deletingClient.id)
      setClients(clients.filter(c => c.id !== deletingClient.id))
      setIsDeleteConfirmOpen(false)
      setDeletingClient(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression du client")
      console.error("Erreur:", err)
    }
  }

  return (
    <DashboardLayout title="Clients">
      {/* En-tete : titre + bouton d'ajout */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Gestion des clients
          </h2>
          <p className="text-muted-foreground">
            Liste de vos clients et leurs statistiques de paiement
          </p>
        </div>
        {/* Message d'erreur */}
        {error && (
          <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/*
          Modal d'ajout d'un client.
          C'est un Dialog simplifie avec juste un champ "Nom".
        */}
        <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Ajouter un client</DialogTitle>
              <DialogDescription>
                Saisissez le nom du nouveau client.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAddClient()
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="clientName">Nom du client *</Label>
                <Input
                  id="clientName"
                  placeholder="Ex: Entreprise ABC"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddClientOpen(false)
                    setNewClientName("")
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit">Ajouter</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tableau des clients */}
      <div className="rounded-lg border border-border bg-card">
        {/* En-tete du tableau avec recherche */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Liste des clients
            </h3>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Chargement..."
                : searchQuery
                  ? `${filteredClients.length} sur ${clients.length} client(s)`
                  : `${clients.length} client(s)`}
            </p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Chargement des clients...
          </div>
        ) : (
        <Table>
          <TableHeader>
            {/* fin du conteneur du tableau */}
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-foreground">
                Nom du client
              </TableHead>
              <TableHead className="text-center font-semibold text-foreground">
                Transactions
              </TableHead>
              <TableHead className="text-right font-semibold text-foreground">
                Montant total
              </TableHead>
              <TableHead className="text-right font-semibold text-foreground">
                Total paye
              </TableHead>
              <TableHead className="text-right font-semibold text-foreground">
                Restant
              </TableHead>
              <TableHead className="text-center font-semibold text-foreground">
                Statut
              </TableHead>
              <TableHead className="text-center font-semibold text-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  {clients.length === 0 ? (
                    <>
                      <p className="text-lg">Aucun client enregistre</p>
                      <p className="mt-1 text-sm">
                        Ajoutez un client pour commencer
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
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium text-foreground">
                      {client.nom}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {client.totalTransactions}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatMoney(client.totalMontant)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-700">
                      {formatMoney(client.totalPaye)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {client.totalRestant > 0
                        ? formatMoney(client.totalRestant)
                        : formatMoney(0)}
                    </TableCell>
                    <TableCell className="text-center">
                      {/*
                        Le statut depend du montant restant :
                        - 0 restant = tout est paye = badge vert "Solde"
                        - > 0 restant = il reste a payer = badge orange "En cours"
                        - Montant total = 0 = nouveau client sans transactions
                      */}
                      {client.totalMontant === 0 ? (
                        <Badge
                          variant="secondary"
                          className="bg-muted text-muted-foreground"
                        >
                          Nouveau
                        </Badge>
                      ) : client.totalRestant === 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          Solde
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                          En cours
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingClient(client)
                            setEditClientName(client.nom)
                            setIsEditClientOpen(true)
                          }}
                          aria-label={`Modifier ${client.nom}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>                                             
                        <Button size="sm" variant="destructive"
                          onClick={() => {
                            setDeletingClient(client)
                            setIsDeleteConfirmOpen(true)
                          }} >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Ligne Total */}
                <TableRow className="border-t-2 border-foreground/20 bg-muted/60 font-semibold">
                  <TableCell className="text-foreground">Total</TableCell>
                  <TableCell className="text-center tabular-nums text-foreground">
                    {filteredClients.reduce(
                      (acc, c) => acc + c.totalTransactions,
                      0
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-foreground">
                    {formatMoney(
                      filteredClients.reduce(
                        (acc, c) => acc + c.totalMontant,
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-700">
                    {formatMoney(
                      filteredClients.reduce(
                        (acc, c) => acc + c.totalPaye,
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-amber-700">
                    {formatMoney(
                      filteredClients.reduce(
                        (acc, c) => acc + c.totalRestant,
                        0
                      )
                    )}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
        )}
      {/* fin du conteneur du tableau */}  
      </div>
      
      {/* modale d'édition */}
      <Dialog
        open={isEditClientOpen}
        onOpenChange={setIsEditClientOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleEditClient()
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="editClientName">Nom du client *</Label>
              <Input
                id="editClientName"
                placeholder="Ex: Entreprise ABC"
                value={editClientName}
                onChange={(e) => setEditClientName(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditClientOpen(false)
                  setEditingClient(null)
                  setEditClientName("")
                }}
              >
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* confirmation suppression */}
      <Dialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {deletingClient && (
              <p>
                Êtes-vous sûr(e) de vouloir supprimer <strong>{deletingClient.nom}</strong> ?
                Toutes les transactions associées seront également supprimées.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteConfirmOpen(false)
                setDeletingClient(null)
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </DashboardLayout>
  )
}
