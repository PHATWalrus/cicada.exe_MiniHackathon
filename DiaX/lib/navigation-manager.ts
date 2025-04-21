"use client"

import { prefetchMultiple, hasFreshPrefetchedData } from "@/hooks/use-cached-fetch"
import { CACHE_KEYS } from "@/lib/cache-manager"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useRef, useCallback } from "react"

// Define page-specific API endpoints to prefetch
const PAGE_PREFETCH_MAP: Record<string, string[]> = {
  "/dashboard": [CACHE_KEYS.PROFILE],
  "/dashboard/health": [CACHE_KEYS.HEALTH_STATS(30), CACHE_KEYS.MEDICAL_INFO],
  "/dashboard/health/history": [CACHE_KEYS.HEALTH_METRICS("days=30")],
  "/dashboard/resources": [CACHE_KEYS.RESOURCES()],
  "/dashboard/chat": [CACHE_KEYS.CHAT_SESSIONS],
  "/dashboard/profile": [CACHE_KEYS.PROFILE, CACHE_KEYS.MEDICAL_INFO],
  "/dashboard/profile/medical": [CACHE_KEYS.MEDICAL_INFO],
}

// Prefetch data for a specific page
export async function prefetchPageData(path: string): Promise<void> {
  // Get the API endpoints to prefetch for this page
  const endpoints = PAGE_PREFETCH_MAP[path] || []

  if (endpoints.length === 0) {
    return
  }

  // Filter out endpoints that already have fresh data
  const endpointsToFetch = endpoints.filter((endpoint) => !hasFreshPrefetchedData(endpoint))

  if (endpointsToFetch.length === 0) {
    return
  }

  // Prefetch all endpoints in parallel
  try {
    await prefetchMultiple(endpointsToFetch)
  } catch (error) {
    console.warn(`Error prefetching data for ${path}:`, error)
  }
}

// Hook to prefetch data when hovering over links
export function useNavigationManager() {
  const router = useRouter()
  const currentPath = usePathname()
  const prefetchTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({})

  // Clear all prefetch timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(prefetchTimeoutsRef.current).forEach((timeout) => {
        clearTimeout(timeout)
      })
    }
  }, [])

  // Function to handle link hover
  const handleLinkHover = (path: string) => {
    // Don't prefetch the current page
    if (path === currentPath) {
      return
    }

    // Cancel any existing timeout for this path
    if (prefetchTimeoutsRef.current[path]) {
      clearTimeout(prefetchTimeoutsRef.current[path])
    }

    // Set a small delay before prefetching to avoid unnecessary prefetches
    prefetchTimeoutsRef.current[path] = setTimeout(() => {
      // Prefetch the page using Next.js router
      router.prefetch(path)

      // Prefetch the API data for this page
      prefetchPageData(path)

      // Clear the timeout reference
      delete prefetchTimeoutsRef.current[path]
    }, 100) // 100ms delay
  }

  // Function to navigate to a path
  const navigateTo = useCallback(
    (path: string) => {
      router.push(path)
    },
    [router],
  )

  // Function to preload a route (both page and data)
  const preloadRoute = useCallback(
    (path: string) => {
      // First, prefetch the page using Next.js router
      router.prefetch(path)

      // Then, prefetch the API data for this page
      prefetchPageData(path)
    },
    [router],
  )

  return {
    navigateTo,
    preloadRoute,
  }
}

// Ensure prefetchMultiplePages is properly implemented
export async function prefetchMultiplePages(paths: string[]): Promise<void> {
  // Prefetch both the pages and their data in parallel
  await Promise.all(
    paths.map(async (path) => {
      try {
        // Use the router to prefetch the page
        const router = typeof window !== "undefined" ? (window as any).next?.router : null
        if (router && router.prefetch) {
          router.prefetch(path)
        }

        // Prefetch the page data
        await prefetchPageData(path)
      } catch (error) {
        console.warn(`Error prefetching page ${path}:`, error)
      }
    }),
  )
}
