"use client"

import type React from "react"

import { createContext, useContext } from "react"
import { useTheme as useNextTheme } from "next-themes"

type ThemeContextType = {
  headerGradient: string
  cardBackground: string
  inputBackground: string
  borderColor: string
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useNextTheme()
  const isDark = theme === "dark"

  // Shared theme values
  const themeValues: ThemeContextType = {
    headerGradient: isDark
      ? "bg-gradient-to-r from-cyan-900 to-teal-900"
      : "bg-gradient-to-r from-cyan-500 to-teal-500",
    cardBackground: isDark
      ? "bg-slate-900/90 backdrop-blur-md border-slate-800"
      : "bg-white/90 backdrop-blur-md border-slate-200",
    inputBackground: isDark ? "bg-slate-800/50" : "bg-background/50",
    borderColor: isDark ? "border-slate-700" : "border-slate-200",
    isDark,
  }

  return <ThemeContext.Provider value={themeValues}>{children}</ThemeContext.Provider>
}

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider")
  }
  return context
}
