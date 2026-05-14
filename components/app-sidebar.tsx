/**
 * =============================================================
 * FICHIER: components/app-sidebar.tsx
 * =============================================================
 *
 * LA BARRE LATERALE (SIDEBAR) AVEC NAVIGATION ENTRE PAGES.
 *
 * NOUVEAU CONCEPT : usePathname()
 *
 * C'est un Hook de Next.js qui retourne l'URL actuelle.
 * Exemple : si on est sur "/transactions", usePathname() retourne "/transactions".
 *
 * On l'utilise pour SURLIGNER l'element du menu qui correspond
 * a la page actuelle (l'element "actif").
 *
 * NOUVEAU CONCEPT : <Link> de Next.js
 *
 * En React, on n'utilise PAS les balises <a> classiques pour naviguer.
 * On utilise le composant <Link> de Next.js qui :
 * 1. Navigue SANS recharger toute la page (navigation cote client)
 * 2. Pre-charge les pages en arriere-plan (plus rapide)
 * 3. Maintient l'etat de l'application (pas de perte de donnees)
 * =============================================================
 */
"use client"

// usePathname = Hook Next.js pour connaitre l'URL actuelle
import { usePathname } from "next/navigation"

// Link = composant Next.js pour naviguer entre les pages
import Link from "next/link"

// Composants Sidebar de shadcn/ui
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"

// Icones
import {
  LayoutDashboard,
  Receipt,
  Users,
  Settings,
  Calculator,
  Package,
} from "lucide-react"

/**
 * Les elements du menu avec leur URL de destination (href).
 *
 * "href" correspond aux dossiers dans app/ :
 * - "/" -> app/page.tsx (Dashboard)
 * - "/transactions" -> app/transactions/page.tsx
 * - "/clients" -> app/clients/page.tsx
 *
 * C'est le systeme de "file-based routing" de Next.js :
 * la structure des dossiers DEFINIT les URLs.
 */
const menuItems = [
  {
    title: "Tableau de bord",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    title: "Transactions",
    icon: Receipt,
    href: "/transactions",
  },
  {
    title: "Clients",
    icon: Users,
    href: "/clients",
  },
  {
    title: "Stock voyage",
    icon: Package,
    href: "/stock-voyage",
  },
  {
    title: "Fournisseurs",
    icon: Users,
    href: "/fournisseurs",
  },
  {
    title: "Parametres",
    icon: Settings,
    href: "/parametres",
  },
]

export function AppSidebar() {
  /**
   * usePathname() retourne l'URL actuelle du navigateur.
   *
   * Exemples de valeurs retournees :
   * - "/" (on est sur le Dashboard)
   * - "/transactions" (on est sur la page Transactions)
   * - "/clients" (on est sur la page Clients)
   *
   * On compare cette valeur avec le "href" de chaque element
   * du menu pour savoir lequel est actif.
   */
  const pathname = usePathname()

  return (
    <Sidebar>
      {/* En-tete de la sidebar */}
      <SidebarHeader className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">MiniCompta</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Gestion comptable simplifiee
        </p>
      </SidebarHeader>

      {/* Menu de navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {/*
                    SidebarMenuButton avec "asChild" :
                    
                    "asChild" est une prop speciale de shadcn/ui.
                    Elle dit : "ne cree pas de balise supplementaire,
                    utilise plutot l'enfant direct comme element cliquable".
                    
                    Sans asChild : <button><a>...</a></button> (mauvais HTML)
                    Avec asChild : <a>...</a> (le Link devient le bouton)
                    
                    isActive compare l'URL actuelle (pathname) avec le href
                    de cet element. Si c'est la meme, l'element est surligne.
                  */}
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    {/*
                      <Link> de Next.js : navigation sans rechargement.
                      href={item.href} = l'URL de destination.
                    */}
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Pied de la sidebar */}
      <SidebarFooter className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">MiniCompta v1.0</p>
      </SidebarFooter>
    </Sidebar>
  )
}
