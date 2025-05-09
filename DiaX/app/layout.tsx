import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./clientLayout"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "DiaX - Your Diabetes Management Assistant",
  description: "A smart chatbot for diabetes management and information",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <ClientLayout>{children}</ClientLayout>
      <Toaster />
    </>
  )
}


import './globals.css'