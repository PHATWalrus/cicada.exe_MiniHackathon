"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import QuickAddButton from "@/components/quick-add-button"
import { useMobile } from "@/hooks/use-mobile"
import { prefetchData } from "@/hooks/use-cached-fetch"
import { CACHE_KEYS } from "@/lib/cache-manager"
import DashboardHeader from "@/components/dashboard-header"
import ScrollToTop from "@/components/scroll-to-top"
import { ScrollProgress } from "@/components/scroll-progress"
import { prefetchMultiplePages } from "@/lib/navigation-manager"
import dynamic from "next/dynamic"

// Use dynamic import for framer-motion to avoid SSR issues
// Dynamically import components that use client-side only features
const DynamicPageTransition = dynamic(() => import("@/components/page-transition"), {
  ssr: false,
})

// Routes to prefetch when dashboard loads
const PREFETCH_ROUTES = [
  CACHE_KEYS.PROFILE,
  CACHE_KEYS.HEALTH_STATS(7),
  CACHE_KEYS.CHAT_SESSIONS,
  CACHE_KEYS.RESOURCES(),
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useMobile()

  // Prefetch critical data when dashboard loads
  useEffect(() => {
    if (user && !isLoading) {
      // Prefetch critical data in parallel
      Promise.all(PREFETCH_ROUTES.map((route) => prefetchData(route))).catch((error) => {
        console.error("Error prefetching dashboard data:", error)
      })
    }
  }, [user, isLoading])

  // Prefetch all main dashboard routes when the dashboard loads
  useEffect(() => {
    const mainRoutes = [
      "/dashboard",
      "/dashboard/health",
      "/dashboard/chat",
      "/dashboard/resources",
      "/dashboard/profile",
    ]

    // Don't prefetch the current route
    const routesToPrefetch = mainRoutes.filter((route) => route !== pathname)

    // Prefetch all routes in the background
    prefetchMultiplePages(routesToPrefetch).catch((error) => {
      console.warn("Error prefetching dashboard routes:", error)
    })
  }, [pathname])

  useEffect(() => {
    // Only redirect if we're not loading and there's no user
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Show loading indicator only for a short time
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header - shown on all devices */}
      <ScrollProgress />
      <DashboardHeader />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 flex-1 dashboard-content">
        <DynamicPageTransition>{children}</DynamicPageTransition>
      </div>

      {/* Quick Add Button - hidden on chat pages */}
      {!pathname.includes("/dashboard/chat") && <QuickAddButton />}

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  )
}
