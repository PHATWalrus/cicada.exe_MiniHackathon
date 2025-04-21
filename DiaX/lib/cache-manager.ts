import { mutate } from "swr"

// Cache keys for different resources
export const CACHE_KEYS = {
  PROFILE: "https://diax.fileish.com/api/users/profile",
  MEDICAL_INFO: "https://diax.fileish.com/api/users/medical-info",
  CHAT_SESSIONS: "https://diax.fileish.com/api/chat/sessions",
  CHAT_SESSION: (id: number | string) => `https://diax.fileish.com/api/chat/sessions/${id}`,
  HEALTH_STATS: (days: number) => `https://diax.fileish.com/api/health/stats?days=${days}`,
  HEALTH_METRICS: (params: string) => `https://diax.fileish.com/api/health/metrics${params ? `?${params}` : ""}`,
  HEALTH_CHARTS: (params: string) => `https://diax.fileish.com/api/health/charts${params ? `?${params}` : ""}`,
  HEALTH_DISTRIBUTION: (params: string) =>
    `https://diax.fileish.com/api/health/distribution${params ? `?${params}` : ""}`,
  RESOURCES: (category?: string) =>
    category ? `https://diax.fileish.com/api/resources/${category}` : "https://diax.fileish.com/api/resources",
}

// Cache manager class
class CacheManager {
  // Invalidate a specific cache entry
  invalidateCache(key: string): Promise<any> {
    return mutate(key)
  }

  // Update a cache entry with new data
  updateCache(key: string, data: any, shouldRevalidate = false): Promise<any> {
    return mutate(key, data, shouldRevalidate)
  }

  // Invalidate multiple cache entries
  invalidateMultiple(keys: string[]): Promise<any[]> {
    return Promise.all(keys.map((key) => this.invalidateCache(key)))
  }

  // Invalidate all health-related caches
  invalidateHealthCaches(): Promise<any[]> {
    return this.invalidateMultiple([
      CACHE_KEYS.HEALTH_STATS(7),
      CACHE_KEYS.HEALTH_STATS(30),
      CACHE_KEYS.HEALTH_STATS(90),
      CACHE_KEYS.HEALTH_METRICS(""),
      CACHE_KEYS.HEALTH_CHARTS(""),
      CACHE_KEYS.HEALTH_DISTRIBUTION(""),
      CACHE_KEYS.MEDICAL_INFO,
    ])
  }

  // Invalidate all chat-related caches
  invalidateChatCaches(): Promise<any[]> {
    return this.invalidateCache(CACHE_KEYS.CHAT_SESSIONS)
  }

  // Invalidate all profile-related caches
  invalidateProfileCaches(): Promise<any[]> {
    return this.invalidateMultiple([CACHE_KEYS.PROFILE, CACHE_KEYS.MEDICAL_INFO])
  }

  // Clear all caches (useful for logout)
  clearAllCaches(): Promise<any> {
    return mutate(() => true, undefined, { revalidate: false })
  }
}

export const cacheManager = new CacheManager()
