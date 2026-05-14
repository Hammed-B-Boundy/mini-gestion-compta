"use client"

import { ReactNode } from "react"
import { Toaster } from "sonner"

interface Props {
  children: ReactNode
}

export default function ToasterProvider({ children }: Props) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}
