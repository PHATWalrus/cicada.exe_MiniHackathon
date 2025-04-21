// API utility functions for DiaX
import { CACHE_KEYS, cacheManager } from "./cache-manager"
import { mutate } from "swr"
import { toastService } from "./toast-service"

// Get the authentication token
export function getToken() {
  return localStorage.getItem("token")
}

// Helper function to handle API responses with improved error handling
export async function handleResponse(response: Response) {
  if (!response.ok) {
    // Try to parse error response as JSON
    try {
      const errorData = await response.json()
      throw new Error(errorData.message || `Error: ${response.status}`)
    } catch (e) {
      // If parsing fails, throw generic error with status
      if (e instanceof Error && e.message.includes("{")) {
        // This is likely a JSON parse error, so throw a more generic error
        throw new Error(`Request failed with status ${response.status}`)
      }
      // Otherwise, rethrow the original error
      throw e
    }
  }

  const responseText = await response.text()

  // Handle empty responses
  if (!responseText.trim()) {
    return null
  }

  try {
    // Try to parse as JSON
    const data = JSON.parse(responseText)

    // Check for API error format
    if (data.error === true) {
      throw new Error(data.message || "API returned an error")
    }

    // Return data property if it exists, otherwise return the whole response
    return data.data !== undefined ? data.data : data
  } catch (error) {
    console.error("Failed to parse JSON response:", responseText.substring(0, 100))
    throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`)
  }
}

// Fetch with timeout and retry capability
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

// User Profile
export async function fetchUserProfile() {
  const cacheKey = CACHE_KEYS.PROFILE

  try {
    const response = await fetchWithTimeout(
      "https://diax.fileish.com/api/users/profile",
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
      10000,
    )

    const data = await handleResponse(response)

    // Update the cache with the new data
    mutate(cacheKey, data, false)

    return data
  } catch (error) {
    console.error("Error fetching user profile:", error)
    toastService.apiError(error)
    throw error
  }
}

export async function updateUserProfile(userData: any) {
  try {
    const response = await fetchWithTimeout(
      "https://diax.fileish.com/api/users/profile",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(userData),
      },
      15000,
    )

    const data = await handleResponse(response)

    // Invalidate profile caches
    cacheManager.invalidateProfileCaches()

    // Show success toast
    toastService.profileUpdated()

    return data
  } catch (error) {
    console.error("Error updating user profile:", error)
    toastService.apiError(error)
    throw error
  }
}

// Medical Information
export async function fetchMedicalInfo() {
  const cacheKey = CACHE_KEYS.MEDICAL_INFO

  try {
    const response = await fetchWithTimeout(
      "https://diax.fileish.com/api/users/medical-info",
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
      10000,
    )

    const data = await handleResponse(response)

    // Update the cache with the new data
    mutate(cacheKey, data, false)

    return data
  } catch (error) {
    console.error("Error fetching medical info:", error)
    // Don't show toast for this one as it's often called in the background
    throw error
  }
}

export async function updateMedicalInfo(medicalData: any) {
  try {
    const response = await fetchWithTimeout(
      "https://diax.fileish.com/api/users/medical-info",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(medicalData),
      },
      15000,
    )

    const data = await handleResponse(response)

    // Invalidate medical info and health stats caches
    cacheManager.invalidateMultiple([
      CACHE_KEYS.MEDICAL_INFO,
      CACHE_KEYS.HEALTH_STATS(7),
      CACHE_KEYS.HEALTH_STATS(30),
      CACHE_KEYS.HEALTH_STATS(90),
    ])

    // Show success toast
    toastService.medicalInfoUpdated()

    return data
  } catch (error) {
    console.error("Error updating medical info:", error)
    toastService.apiError(error)
    throw error
  }
}

export async function deleteMedicalRecord() {
  try {
    const response = await fetchWithTimeout(
      "https://diax.fileish.com/api/users/medical-record",
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
      10000,
    )

    const data = await handleResponse(response)

    // Invalidate medical info and health stats caches
    cacheManager.invalidateMultiple([
      CACHE_KEYS.MEDICAL_INFO,
      CACHE_KEYS.HEALTH_STATS(7),
      CACHE_KEYS.HEALTH_STATS(30),
      CACHE_KEYS.HEALTH_STATS(90),
    ])

    // Show success toast
    toastService.info("Medical Record Deleted", "Your medical record has been successfully deleted.")

    return data
  } catch (error) {
    console.error("Error deleting medical record:", error)
    toastService.apiError(error)
    throw error
  }
}

// Health Metrics
export async function fetchHealthMetrics(params?: {
  type?: string
  days?: number
  from?: string
  to?: string
  limit?: number
  page?: number
}) {
  try {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const queryString = queryParams.toString()
    const url = `https://diax.fileish.com/api/health/metrics${queryString ? `?${queryString}` : ""}`
    const cacheKey = CACHE_KEYS.HEALTH_METRICS(queryString)

    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
      15000,
    )

    const data = await handleResponse(response)

    // Update the cache with the new data
    mutate(cacheKey, data, false)

    return data
  } catch (error) {
    console.error("Error fetching health metrics:", error)
    toastService.apiError(error)
    throw error
  }
}

export async function addHealthMetric(metricData: any, suppressToast = false) {
  try {
    const response = await fetchWithTimeout(
      "https://diax.fileish.com/api/health/metrics",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(metricData),
      },
      15000,
    )

    const data = await handleResponse(response)

    // Invalidate health caches
    cacheManager.invalidateHealthCaches()

    // Only show toast if not suppressed
    if (!suppressToast) {
      // Determine metric type for toast message
      let metricType = "health"
      if (metricData.blood_glucose_level !== undefined) {
        metricType = "blood glucose"
      } else if (metricData.systolic_pressure !== undefined) {
        metricType = "blood pressure"
      } else if (metricData.heart_rate !== undefined && metricData.exercise_duration === undefined) {
        metricType = "heart rate"
      } else if (metricData.weight_kg !== undefined) {
        metricType = "weight"
      } else if (metricData.a1c_percentage !== undefined) {
        metricType = "A1C"
      } else if (metricData.exercise_duration !== undefined) {
        metricType = "exercise"
      }

      // Show success toast
      toastService.healthDataAdded(metricType)
    }

    return data
  } catch (error) {
    console.error("Error adding health metric:", error)
    toastService.apiError(error)
    throw error
  }
}

export async function updateHealthMetric(id: number, metricData: any) {
  try {
    const response = await fetchWithTimeout(
      `https://diax.fileish.com/api/health/metrics/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(metricData),
      },
      15000,
    )

    const data = await handleResponse(response)

    // Invalidate health caches
    cacheManager.invalidateHealthCaches()

    // Determine metric type for toast message
    let metricType = "health"
    if (metricData.blood_glucose_level !== undefined) {
      metricType = "blood glucose"
    } else if (metricData.systolic_pressure !== undefined) {
      metricType = "blood pressure"
    } else if (metricData.heart_rate !== undefined && metricData.exercise_duration === undefined) {
      metricType = "heart rate"
    } else if (metricData.weight_kg !== undefined) {
      metricType = "weight"
    } else if (metricData.a1c_percentage !== undefined) {
      metricType = "A1C"
    } else if (metricData.exercise_duration !== undefined) {
      metricType = "exercise"
    }

    // Show success toast
    toastService.healthDataUpdated(metricType)

    return data
  } catch (error) {
    console.error("Error updating health metric:", error)
    toastService.apiError(error)
    throw error
  }
}

export async function deleteHealthMetric(id: number) {
  try {
    const response = await fetchWithTimeout(
      `https://diax.fileish.com/api/health/metrics/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
      10000,
    )

    const data = await handleResponse(response)

    // Invalidate health caches
    cacheManager.invalidateHealthCaches()

    // Show success toast
    toastService.healthDataDeleted()

    return data
  } catch (error) {
    console.error("Error deleting health metric:", error)
    toastService.apiError(error)
    throw error
  }
}

export async function fetchHealthStats(days?: number) {
  try {
    const daysParam = days || 30
    const url = `https://diax.fileish.com/api/health/stats?days=${daysParam}`
    const cacheKey = CACHE_KEYS.HEALTH_STATS(daysParam)

    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
      10000,
    )

    const data = await handleResponse(response)

    // Update the cache with the new data
    mutate(cacheKey, data, false)

    return data
  } catch (error) {
    console.error("Error fetching health stats:", error)
    toastService.apiError(error)
    throw error
  }
}

// New endpoint for chart data
export async function fetchHealthChartData(params?: {
  type?: string
  days?: number
  start_date?: string
  end_date?: string
}) {
  try {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const queryString = queryParams.toString()
    const url = `https://diax.fileish.com/api/health/charts${queryString ? `?${queryString}` : ""}`
    const cacheKey = CACHE_KEYS.HEALTH_CHARTS(queryString)

    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
      15000,
    )

    const data = await handleResponse(response)

    // Update the cache with the new data
    mutate(cacheKey, data, false)

    return data
  } catch (error) {
    console.error("Error fetching health chart data:", error)
    toastService.apiError(error)
    throw error
  }
}

// New endpoint for distribution data
export async function fetchHealthDistribution(params?: {
  days?: number
  start_date?: string
  end_date?: string
}) {
  try {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const queryString = queryParams.toString()
    const url = `https://diax.fileish.com/api/health/distribution${queryString ? `?${queryString}` : ""}`
    const cacheKey = CACHE_KEYS.HEALTH_DISTRIBUTION(queryString)

    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
      15000,
    )

    const data = await handleResponse(response)

    // Update the cache with the new data
    mutate(cacheKey, data, false)

    return data
  } catch (error) {
    console.error("Error fetching health distribution data:", error)
    toastService.apiError(error)
    throw error
  }
}

// Chat
export async function sendChatMessage(message: string, sessionId?: number | null, signal?: AbortSignal) {
  const payload: any = { message }
  if (sessionId) {
    payload.session_id = sessionId
  }

  try {
    const response = await fetch("https://diax.fileish.com/api/chat/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(payload),
      signal, // Add AbortSignal for cancellation support
    })

    const data = await handleResponse(response)

    // Invalidate chat sessions cache
    cacheManager.invalidateCache(CACHE_KEYS.CHAT_SESSIONS)

    // If this is an existing session, invalidate its cache
    if (sessionId) {
      cacheManager.invalidateCache(CACHE_KEYS.CHAT_SESSION(sessionId))
    }

    return data
  } catch (error) {
    // Rethrow AbortError as is
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error
    }

    // For other errors, provide more context
    console.error("Error sending chat message:", error)
    toastService.apiError(error)
    throw new Error(error instanceof Error ? error.message : "Failed to send message. Please check your connection.")
  }
}

export async function getChatSessions() {
  try {
    const response = await fetchWithTimeout(
      "https://diax.fileish.com/api/chat/sessions",
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
      10000,
    )

    const data = await handleResponse(response)
    return data
  } catch (error) {
    console.error("Error fetching chat sessions:", error)
    toastService.apiError(error)
    throw new Error(error instanceof Error ? error.message : "Failed to load chat sessions")
  }
}

export async function getChatSessionDetails(sessionId: number) {
  try {
    const response = await fetchWithTimeout(
      `https://diax.fileish.com/api/chat/sessions/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
      10000,
    )

    const data = await handleResponse(response)
    return data
  } catch (error) {
    console.error(`Error fetching session ${sessionId} details:`, error)
    toastService.apiError(error)
    throw new Error(error instanceof Error ? error.message : "Failed to load session details")
  }
}

// Resources
export async function fetchResources(category?: string) {
  try {
    const url = category
      ? `https://diax.fileish.com/api/resources/${category}`
      : "https://diax.fileish.com/api/resources"
    const cacheKey = CACHE_KEYS.RESOURCES(category)

    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
      10000,
    )

    const data = await handleResponse(response)

    // Update the cache with the new data
    mutate(cacheKey, data, false)

    return data
  } catch (error) {
    console.error("Error fetching resources:", error)
    toastService.apiError(error)
    throw error
  }
}

export async function saveResource(resourceData: any) {
  try {
    const response = await fetchWithTimeout(
      "https://diax.fileish.com/api/resources/save",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(resourceData),
      },
      15000,
    )

    const data = await handleResponse(response)

    // Invalidate resources cache
    cacheManager.invalidateCache(CACHE_KEYS.RESOURCES())

    // Show success toast
    toastService.success("Resource Saved", "Your resource has been submitted and is pending approval.")

    return data
  } catch (error) {
    console.error("Error saving resource:", error)
    toastService.apiError(error)
    throw error
  }
}

// Token Refresh
export async function refreshToken(token: string) {
  try {
    const response = await fetchWithTimeout(
      "https://diax.fileish.com/api/auth/refresh",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      },
      10000,
    )

    return handleResponse(response)
  } catch (error) {
    console.error("Error refreshing token:", error)
    throw error
  }
}

// Health Check
export async function checkApiHealth() {
  try {
    const response = await fetchWithTimeout("https://diax.fileish.com/api/health", {}, 5000)
    return handleResponse(response)
  } catch (error) {
    console.error("API health check failed:", error)
    throw error
  }
}

// Request password reset
export async function requestPasswordReset(email: string) {
  try {
    const response = await fetchWithTimeout(
      "https://diax.fileish.com/api/auth/forgot-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      },
      10000,
    )

    const data = await handleResponse(response)

    // Show success toast
    toastService.success(
      "Password Reset Email Sent",
      "If the email address exists in our system, a password reset link has been sent.",
    )

    return data
  } catch (error) {
    console.error("Error requesting password reset:", error)
    toastService.apiError(error)
    throw error
  }
}

// Reset password with token
export async function resetPassword(token: string, password: string, password_confirmation: string) {
  try {
    const response = await fetchWithTimeout(
      "https://diax.fileish.com/api/auth/reset-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password, password_confirmation }),
      },
      10000,
    )

    const data = await handleResponse(response)

    // Show success toast
    toastService.success(
      "Password Reset Successful",
      "Your password has been reset successfully. You can now log in with your new password.",
    )

    return data
  } catch (error) {
    console.error("Error resetting password:", error)
    toastService.apiError(error)
    throw error
  }
}
