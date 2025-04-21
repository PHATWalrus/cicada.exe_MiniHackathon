"use client"

import useSWR, { type SWRConfiguration, mutate, unstable_serialize } from "swr"
import { useCallback, useEffect, useRef, useState } from "react"

// Cache to store prefetched data
const prefetchCache = new Map<string, { data: any; timestamp: number }>()

// Global fetcher function that handles authentication
const defaultFetcher = async (url: string) => {
  const token = localStorage.getItem("token")
  const response = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  })

  if (!response.ok) {
    const error = new Error("An error occurred while fetching the data.")
    error.info = await response.json()
    error.status = response.status
    throw error
  }

  const text = await response.text()

  try {
    // Try to parse as JSON
    const data = JSON.parse(text)

    // Check if the response has a data property (common API pattern)
    if (data && typeof data === "object" && "data" in data) {
      return data.data
    }

    return data
  } catch (e) {
    // If parsing fails, return the text
    return text
  }
}

// Track which URLs are currently being preloaded
const preloadingUrls = new Set<string>()

// Check if a URL is currently being preloaded
export function isPreloading(url: string): boolean {
  return preloadingUrls.has(url)
}

// Get prefetched data if available
export function getPrefetchedData(url: string): any {
  const cached = prefetchCache.get(url)
  if (cached) {
    return cached.data
  }
  return undefined
}

// Check if prefetched data is available and not too old
export function hasFreshPrefetchedData(url: string, maxAge = 30000): boolean {
  const cached = prefetchCache.get(url)
  if (!cached) return false

  const now = Date.now()
  return now - cached.timestamp < maxAge
}

export function useCachedFetch<Data = any, Error = any>(
  url: string | null,
  options?: SWRConfiguration<Data, Error> & {
    fetcher?: (url: string) => Promise<Data>
    // New options for controlling prefetch behavior
    prioritizePrefetchedData?: boolean
    backgroundUpdate?: boolean
    prefetchMaxAge?: number
  },
) {
  const {
    prioritizePrefetchedData = true,
    backgroundUpdate = true,
    prefetchMaxAge = 30000, // 30 seconds default
    ...swrOptions
  } = options || {}

  // Track if this is the initial render
  const isInitialRender = useRef(true)

  // Track if we're using prefetched data
  const [usingPrefetchedData, setUsingPrefetchedData] = useState(false)

  // Store the prefetched data if available
  const prefetchedDataRef = useRef<Data | undefined>(undefined)

  // Check for prefetched data on mount
  useEffect(() => {
    if (url && isInitialRender.current && prioritizePrefetchedData) {
      const cached = prefetchCache.get(url)
      if (cached && Date.now() - cached.timestamp < prefetchMaxAge) {
        prefetchedDataRef.current = cached.data
        setUsingPrefetchedData(true)
      }
    }

    isInitialRender.current = false
  }, [url, prioritizePrefetchedData, prefetchMaxAge])

  // Custom fetcher that uses prefetched data for initial render
  const customFetcher = useCallback(
    async (fetchUrl: string) => {
      // If we have prefetched data and this is the initial render, use it
      if (prefetchedDataRef.current !== undefined && usingPrefetchedData) {
        const data = prefetchedDataRef.current

        // If background updates are enabled, fetch fresh data after returning prefetched data
        if (backgroundUpdate) {
          // Use setTimeout to ensure this runs after the component renders with prefetched data
          setTimeout(async () => {
            try {
              const freshData = await (options?.fetcher || defaultFetcher)(fetchUrl)

              // Only update if the data has changed
              if (JSON.stringify(freshData) !== JSON.stringify(data)) {
                mutate(fetchUrl, freshData, false)
              }
            } catch (error) {
              console.error("Background update failed:", error)
            } finally {
              setUsingPrefetchedData(false)
            }
          }, 0)
        } else {
          // If background updates are disabled, mark as not using prefetched data after a delay
          setTimeout(() => {
            setUsingPrefetchedData(false)
          }, 0)
        }

        return data
      }

      // Otherwise, fetch normally
      return (options?.fetcher || defaultFetcher)(fetchUrl)
    },
    [options?.fetcher, usingPrefetchedData, backgroundUpdate],
  )

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate: boundMutate,
    ...rest
  } = useSWR<Data, Error>(url, customFetcher, {
    revalidateOnFocus: false, // Don't revalidate when window gets focus
    revalidateIfStale: !usingPrefetchedData, // Only revalidate if not using prefetched data
    dedupingInterval: 5000, // Dedupe requests within 5 seconds
    ...swrOptions,
  })

  // Helper to invalidate the cache for this URL
  const invalidateCache = useCallback(() => {
    if (url) {
      // Also remove from prefetch cache
      prefetchCache.delete(url)
      return boundMutate()
    }
  }, [url, boundMutate])

  // Helper to update the cache with new data
  const updateCache = useCallback(
    (newData: Data, shouldRevalidate = false) => {
      if (url) {
        // Also update prefetch cache
        prefetchCache.set(url, { data: newData, timestamp: Date.now() })
        return boundMutate(newData, shouldRevalidate)
      }
    },
    [url, boundMutate],
  )

  return {
    data,
    error,
    isLoading: isLoading && !usingPrefetchedData,
    isValidating: isValidating && !usingPrefetchedData,
    mutate: boundMutate,
    invalidateCache,
    updateCache,
    ...rest,
  }
}

// Function to prefetch and cache data
export function prefetchData(url: string, options?: { fetcher?: (url: string) => Promise<any> }): Promise<any> {
  // Add URL to preloading set
  preloadingUrls.add(url)

  return mutate(
    url,
    async () => {
      try {
        const data = await (options?.fetcher || defaultFetcher)(url)

        // Store in prefetch cache with timestamp
        prefetchCache.set(url, { data, timestamp: Date.now() })

        return data
      } catch (error) {
        console.warn(`Failed to prefetch ${url}:`, error)
        throw error
      }
    },
    false, // Don't revalidate
  ).finally(() => {
    // Remove URL from preloading set when done
    preloadingUrls.delete(url)
  })
}

// Function to prefetch multiple resources
export function prefetchMultiple(urls: string[]): Promise<any[]> {
  return Promise.allSettled(urls.map((url) => prefetchData(url))).then((results) => {
    // Log any failures but don't throw
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.warn(`Failed to prefetch ${urls[index]}:`, result.reason)
      }
    })

    // Return the successful results
    return results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
      .map((result) => result.value)
  })
}

// Function to check if data is already in the SWR cache
export function isDataCached(url: string): boolean {
  // Use unstable_serialize to get the cache key in the same format SWR uses
  const cacheKey = unstable_serialize(url)

  // Check if the key exists in the SWR cache
  // @ts-ignore - Accessing internal SWR cache
  return Boolean(window.__SWR_CACHE__?.[cacheKey])
}
