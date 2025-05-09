"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { ThemeContextProvider } from "@/context/theme-context"
import { useEffect } from "react"

const inter = Inter({ subsets: ["latin"] })

// Register service worker
function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("SW registered: ", registration)
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError)
        })
    })
  }
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Register service worker
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <html lang="en" suppressHydrationWarning className="w-full h-full">
      <body className={`${inter.className} w-full h-full`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ThemeContextProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeContextProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
