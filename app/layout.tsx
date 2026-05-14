
/**
 * =============================================================
 * FICHIER: app/layout.tsx
 * =============================================================
 *
 * C'est le LAYOUT RACINE de l'application Next.js.
 *
 * Un "layout" est un composant qui ENTOURE toutes les pages.
 * Il est parfait pour :
 * - Définir la structure HTML de base (<html>, <body>)
 * - Charger les polices de caractères
 * - Définir les métadonnées SEO (titre, description)
 * - Appliquer des styles globaux
 *
 * IMPORTANT : Ce fichier s'exécute côté SERVEUR (pas "use client").
 * C'est un "Server Component" par défaut dans Next.js.
 * =============================================================
 */

import type { Metadata, Viewport } from "next"

// On importe la police Inter depuis Google Fonts
// Next.js optimise automatiquement le chargement des polices
import { Inter } from "next/font/google"

// Les styles CSS globaux de l'application
import "./globals.css"

/**
 * Configuration de la police Inter.
 *
 * subsets: ["latin"] = on charge uniquement les caractères latins
 * (pas l'arabe, le chinois, etc.) pour réduire la taille du fichier.
 *
 * La police est automatiquement ajoutée comme variable CSS
 * et appliquée via la classe "font-sans" dans Tailwind.
 */
const inter = Inter({ subsets: ["latin"] })

/**
 * Métadonnées de la page — utilisées par les moteurs de recherche (SEO)
 * et affichées dans l'onglet du navigateur.
 *
 * "export const" rend cette variable accessible à Next.js
 * qui l'utilise pour générer les balises <meta> et <title>.
 */
export const metadata: Metadata = {
  title: "MiniCompta - Gestion Comptable",
  description:
    "Application de gestion comptable simplifiée pour suivre vos transactions et dépenses",
}

/**
 * Configuration du viewport — contrôle l'affichage sur mobile.
 */
export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
}

/**
 * Composant RootLayout — Le layout qui entoure TOUTES les pages
 *
 * "children" est une prop spéciale en React qui représente
 * le contenu placé ENTRE les balises d'ouverture et fermeture.
 *
 * <RootLayout>
 *   <Page />  ← ceci est "children"
 * </RootLayout>
 *
 * Readonly<{...}> signifie que les props ne peuvent pas être modifiées
 * (bonne pratique TypeScript pour la sécurité).
 */
import { Toaster } from "sonner"
import ToasterProvider from "@/components/toaster-provider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // lang="fr" pour l'accessibilité — indique que le contenu est en français
    <html lang="fr">
      {/*
        className sur <body> :
        - inter.className : applique la police Inter
        - antialiased : lisse le rendu des textes
        - font-sans : classe Tailwind pour la police sans-serif
      */}
      <body className={`${inter.className} font-sans antialiased`}>
        <ToasterProvider>{children}</ToasterProvider>
      </body>
    </html>
  )
}
