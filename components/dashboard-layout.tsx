/**
 * =============================================================
 * FICHIER: components/dashboard-layout.tsx
 * =============================================================
 *
 * COMPOSANT LAYOUT REUTILISABLE pour toutes les pages de l'app.
 *
 * CONCEPT IMPORTANT : La reutilisabilite (DRY)
 *
 * Au lieu de copier-coller le code de la sidebar + header
 * dans chaque page (Dashboard, Transactions, Clients...),
 * on cree UN SEUL composant qui contient cette structure
 * et on l'utilise comme un "cadre" dans chaque page.
 *
 * Chaque page n'a qu'a passer :
 * - title : le titre affiche dans le header
 * - children : le contenu specifique de la page
 *
 * C'est le pattern "Composition" en React :
 * un composant generique qui accueille du contenu variable.
 * =============================================================
 */
"use client"

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"

/**
 * Props du composant DashboardLayout :
 *
 * - title : le titre affiche dans le header (ex: "Tableau de bord")
 * - children : le contenu de la page (React.ReactNode = n'importe quel JSX)
 *
 * React.ReactNode est un type tres large qui accepte :
 * du texte, des composants, des elements HTML, null, etc.
 */
interface DashboardLayoutProps {
  title: string
  children: React.ReactNode
}

export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        {/* Header de la page avec le titre dynamique */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <SidebarTrigger className="-ml-2" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </header>

        {/*
          Zone de contenu principale.
          "children" sera remplace par le contenu specifique
          de chaque page (cartes, tableau, formulaire, etc.)
        */}
        <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
