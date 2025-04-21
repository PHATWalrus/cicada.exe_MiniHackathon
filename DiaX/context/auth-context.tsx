"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { refreshToken } from "@/lib/api"
import { cacheManager } from "@/lib/cache-manager"
import { toastService } from "@/lib/toast-service"
import { useRouter, usePathname } from "next/navigation"

// Debug mode flag
const DEBUG_AUTH = true

type User = {
  id: number
  name: string
  email: string
  email_verified?: boolean
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isVerified: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  refreshUserState: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Protected routes that require email verification
const PROTECTED_ROUTES = [
  "/dashboard",
  "/dashboard/health",
  "/dashboard/chat",
  "/dashboard/resources",
  "/dashboard/profile",
]

// Routes that are allowed even without verification
const ALLOWED_UNVERIFIED_ROUTES = ["/verify-email", "/check-your-email", "/setup-medical-profile"]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Debug logger function
  const logDebug = (message: string) => {
    if (DEBUG_AUTH) {
      console.log(`[AUTH DEBUG] ${message}`)
    }
  }

  // Check if user is verified
  const isVerified = user?.email_verified === true

  // Check if current route requires verification
  useEffect(() => {
    if (!isLoading && user && pathname) {
      // Only redirect if user is not verified
      if (!isVerified) {
        // Check if the current route is protected and not in allowed unverified routes
        const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
        const isAllowedUnverified = ALLOWED_UNVERIFIED_ROUTES.some((route) => pathname.startsWith(route))

        if (isProtectedRoute && !isAllowedUnverified) {
          logDebug(`Redirecting unverified user from protected route: ${pathname}`)
          router.push(`/check-your-email?email=${encodeURIComponent(user.email)}`)
        }
      } else {
        logDebug(`User is verified, no redirection needed for: ${pathname}`)
      }
    }
  }, [isLoading, user, isVerified, pathname, router])

  useEffect(() => {
    // Check if user is logged in on initial load
    logDebug("Initializing auth context")
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (token && storedUser) {
      try {
        logDebug("Found stored user and token")
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        logDebug(`User set: ${parsedUser.email}`)

        // Set up token refresh
        const setupTokenRefresh = async () => {
          try {
            logDebug("Attempting to refresh token")
            const data = await refreshToken(token)
            if (data && data.token) {
              logDebug("Token refreshed successfully")
              localStorage.setItem("token", data.token)
            } else {
              logDebug("Token refresh response missing token")
            }
          } catch (error) {
            console.error("Error refreshing token:", error)
            logDebug(`Token refresh failed: ${error instanceof Error ? error.message : String(error)}`)
            // If token refresh fails, log the user out
            localStorage.removeItem("user")
            localStorage.removeItem("token")
            setUser(null)
            // Clear all caches
            cacheManager.clearAllCaches()
            logDebug("User logged out due to token refresh failure")

            // Show session expired toast
            toastService.sessionExpired()
          } finally {
            setIsLoading(false)
            logDebug("Auth loading completed")
          }
        }

        setupTokenRefresh()

        // Set up periodic token refresh (every 30 minutes)
        const refreshInterval = setInterval(
          () => {
            logDebug("Periodic token refresh triggered")
            setupTokenRefresh()
          },
          30 * 60 * 1000,
        )

        return () => {
          logDebug("Clearing token refresh interval")
          clearInterval(refreshInterval)
        }
      } catch (error) {
        console.error("Error parsing stored user:", error)
        logDebug(`Error parsing stored user: ${error instanceof Error ? error.message : String(error)}`)
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        setIsLoading(false)
        logDebug("Auth loading completed with error")
      }
    } else {
      logDebug("No stored user or token found")
      setIsLoading(false)
      logDebug("Auth loading completed")
    }
  }, [])

  const login = async (email: string, password: string) => {
    logDebug(`Login attempt for: ${email}`)
    try {
      const response = await fetch("https://diax.fileish.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        logDebug(`Login failed with status ${response.status}: ${errorData.message || "Unknown error"}`)

        // Check for account locking
        if (errorData.message && errorData.message.includes("temporarily locked")) {
          // Extract minutes from message like "Account is temporarily locked. Please try again in 15 minute(s)."
          const minutesMatch = errorData.message.match(/(\d+) minute/)
          const minutes = minutesMatch ? Number.parseInt(minutesMatch[1]) : 15

          toastService.accountLocked(minutes)
        } else {
          throw new Error(errorData.message || "Login failed")
        }

        throw new Error(errorData.message || "Login failed")
      }

      const responseText = await response.text()
      let data

      try {
        data = JSON.parse(responseText)
        logDebug("Login response parsed successfully")
      } catch (error) {
        logDebug(`Failed to parse login response: ${responseText.substring(0, 100)}...`)
        throw new Error("Invalid response from server")
      }

      if (data.error) {
        logDebug(`Login API returned error: ${data.message || "Unknown error"}`)
        throw new Error(data.message || "Login failed")
      }

      // Save token and user data
      localStorage.setItem("token", data.data.token)
      localStorage.setItem("user", JSON.stringify(data.data.user))
      logDebug(`Login successful for user: ${data.data.user.email}`)

      setUser(data.data.user)

      // Clear any existing caches to ensure fresh data
      await cacheManager.clearAllCaches()

      // Show success toast
      toastService.loginSuccess(data.data.user.name)

      // Check email verification status and redirect accordingly
      if (data.data.user.email_verified === true) {
        // User is verified, redirect directly to dashboard
        logDebug(`User ${data.data.user.email} is verified, redirecting to dashboard`)
        router.push("/dashboard")
      } else {
        // User is not verified, redirect to verification page
        logDebug(`User ${data.data.user.email} is not verified, redirecting to verification page`)
        router.push(`/check-your-email?email=${encodeURIComponent(data.data.user.email)}`)
      }
    } catch (error) {
      console.error("Login error:", error)
      logDebug(`Login error: ${error instanceof Error ? error.message : String(error)}`)

      // Show error toast if not already shown by account locking check
      if (error instanceof Error && !error.message.includes("temporarily locked")) {
        toastService.error(
          "Login Failed",
          error instanceof Error ? error.message : "Please check your credentials and try again",
        )
      }

      throw error
    }
  }

  const register = async (userData: any) => {
    logDebug(`Registration attempt for: ${userData.email}`)
    try {
      const response = await fetch("https://diax.fileish.com/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        logDebug(`Registration failed with status ${response.status}: ${errorData.message || "Unknown error"}`)
        throw new Error(errorData.message || "Registration failed")
      }

      const responseText = await response.text()
      let data

      try {
        data = JSON.parse(responseText)
        logDebug("Registration response parsed successfully")
      } catch (error) {
        logDebug(`Failed to parse registration response: ${responseText.substring(0, 100)}...`)
        throw new Error("Invalid response from server")
      }

      if (data.error) {
        logDebug(`Registration API returned error: ${data.message || "Unknown error"}`)
        throw new Error(data.message || "Registration failed")
      }

      // Save token and user data
      localStorage.setItem("token", data.data.token)
      localStorage.setItem("user", JSON.stringify(data.data.user))
      logDebug(`Registration successful for user: ${data.data.user.email}`)

      setUser(data.data.user)

      // Clear any existing caches to ensure fresh data
      await cacheManager.clearAllCaches()

      // Show success toast
      toastService.registrationSuccess(data.data.user.name)

      // Redirect to check email page
      router.push(`/check-your-email?email=${encodeURIComponent(userData.email)}`)

      return data
    } catch (error) {
      console.error("Registration error:", error)
      logDebug(`Registration error: ${error instanceof Error ? error.message : String(error)}`)

      // Show error toast
      toastService.error(
        "Registration Failed",
        error instanceof Error ? error.message : "Please check your information and try again",
      )

      throw error
    }
  }

  const logout = () => {
    logDebug("Logout initiated")
    // Remove token and user data
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    logDebug("User logged out successfully")

    // Clear all caches
    cacheManager.clearAllCaches()

    // Show logout toast
    toastService.logoutSuccess()

    // Call logout API (but don't wait for it)
    fetch("https://diax.fileish.com/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(() => {
        logDebug("Logout API call successful")
      })
      .catch((error) => {
        console.error("Logout API error:", error)
        logDebug(`Logout API error: ${error instanceof Error ? error.message : String(error)}`)
      })
  }

  // Add this function to refresh user state from localStorage
  const refreshUserState = () => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        logDebug(`User state refreshed from localStorage: ${parsedUser.email}, verified: ${parsedUser.email_verified}`)
      } catch (error) {
        logDebug(`Error parsing stored user during refresh: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  // Add an effect to periodically check for user state changes in localStorage
  useEffect(() => {
    // Check localStorage every 5 seconds for changes to user verification status
    const checkInterval = setInterval(() => {
      if (user) {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser)
            // If verification status changed, update the user state
            if (parsedUser.email_verified !== user.email_verified) {
              logDebug(`Verification status changed in localStorage, updating user state`)
              setUser(parsedUser)
            }
          } catch (error) {
            logDebug(`Error checking stored user: ${error instanceof Error ? error.message : String(error)}`)
          }
        }
      }
    }, 5000)

    return () => clearInterval(checkInterval)
  }, [user])

  // Also expose the refreshUserState function in the context value
  return (
    <AuthContext.Provider value={{ user, isLoading, isVerified, login, register, logout, refreshUserState }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export { AuthContext }
