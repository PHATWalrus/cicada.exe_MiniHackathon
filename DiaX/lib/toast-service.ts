import { toast } from "@/hooks/use-toast"

// Toast durations in milliseconds
const DURATIONS = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
}

// Maximum number of toasts to show at once
const MAX_TOASTS = 3

// Toast service for consistent toast notifications across the app
export const toastService = {
  // Success toast with checkmark icon
  success: (title: string, description?: string, duration = DURATIONS.MEDIUM) => {
    toast({
      title,
      description,
      variant: "default",
      duration,
    })
  },

  // Error toast with X icon
  error: (title: string, description?: string, duration = DURATIONS.LONG) => {
    toast({
      title,
      description,
      variant: "destructive",
      duration,
    })
  },

  // Warning toast with warning icon
  warning: (title: string, description?: string, duration = DURATIONS.MEDIUM) => {
    toast({
      title,
      description,
      variant: "warning",
      duration,
    })
  },

  // Info toast with info icon
  info: (title: string, description?: string, duration = DURATIONS.MEDIUM) => {
    toast({
      title,
      description,
      variant: "info",
      duration,
    })
  },

  // Network status toasts
  networkOffline: () => {
    toast({
      title: "You're Offline",
      description: "Check your internet connection to continue using all features",
      variant: "warning",
      duration: DURATIONS.LONG,
    })
  },

  networkOnline: () => {
    toast({
      title: "You're Back Online",
      description: "Your connection has been restored",
      variant: "default",
      duration: DURATIONS.MEDIUM,
    })
  },

  // Authentication toasts
  loginSuccess: (name: string) => {
    toast({
      title: "Welcome Back!",
      description: `You've successfully logged in as ${name}`,
      variant: "default",
      duration: DURATIONS.MEDIUM,
    })
  },

  logoutSuccess: () => {
    toast({
      title: "Logged Out",
      description: "You've been successfully logged out",
      variant: "info",
      duration: DURATIONS.MEDIUM,
    })
  },

  registrationSuccess: (name: string) => {
    toast({
      title: "Account Created",
      description: `Welcome to DiaX, ${name}! Your account has been created successfully.`,
      variant: "default",
      duration: DURATIONS.MEDIUM,
    })
  },

  // Session toasts
  sessionExpired: () => {
    toast({
      title: "Session Expired",
      description: "Your session has expired. Please log in again to continue.",
      variant: "warning",
      duration: DURATIONS.LONG,
    })
  },

  // Rate limit toasts
  rateLimited: (retryAfter: number) => {
    const minutes = Math.ceil(retryAfter / 60)
    toast({
      title: "Rate Limit Exceeded",
      description: `Too many requests. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
      variant: "warning",
      duration: DURATIONS.LONG,
    })
  },

  // Account locking
  accountLocked: (minutes: number) => {
    toast({
      title: "Account Temporarily Locked",
      description: `For security reasons, your account has been temporarily locked. Please try again in ${minutes} ${
        minutes === 1 ? "minute" : "minutes"
      }.`,
      variant: "warning",
      duration: DURATIONS.LONG,
    })
  },

  // Health data toasts
  healthDataAdded: (metricType: string) => {
    toast({
      title: "Health Data Added",
      description: `Your ${metricType} data has been successfully recorded.`,
      variant: "default",
      duration: DURATIONS.MEDIUM,
    })
  },

  healthDataUpdated: (metricType: string) => {
    toast({
      title: "Health Data Updated",
      description: `Your ${metricType} data has been successfully updated.`,
      variant: "default",
      duration: DURATIONS.MEDIUM,
    })
  },

  healthDataDeleted: () => {
    toast({
      title: "Health Data Deleted",
      description: "Your health data has been successfully deleted.",
      variant: "info",
      duration: DURATIONS.MEDIUM,
    })
  },

  // Profile toasts
  profileUpdated: () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
      variant: "default",
      duration: DURATIONS.MEDIUM,
    })
  },

  medicalInfoUpdated: () => {
    toast({
      title: "Medical Information Updated",
      description: "Your medical information has been successfully updated.",
      variant: "default",
      duration: DURATIONS.MEDIUM,
    })
  },

  // Password reset toasts
  passwordResetRequested: () => {
    toast({
      title: "Password Reset Email Sent",
      description: "If the email address exists in our system, a password reset link has been sent.",
      variant: "info",
      duration: DURATIONS.MEDIUM,
    })
  },

  passwordResetSuccess: () => {
    toast({
      title: "Password Reset Successful",
      description: "Your password has been reset successfully. You can now log in with your new password.",
      variant: "default",
      duration: DURATIONS.MEDIUM,
    })
  },

  // Generic API error handler
  apiError: (error: any) => {
    // Extract error message
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "An unexpected error occurred. Please try again."

    // Check for specific error types
    if (errorMessage.includes("429") || errorMessage.includes("Too many requests")) {
      // Rate limit error
      const retryMatch = errorMessage.match(/retry_after: (\d+)/)
      const retryAfter = retryMatch ? Number.parseInt(retryMatch[1], 10) : 60
      toastService.rateLimited(retryAfter)
    } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      // Authentication error
      toastService.sessionExpired()
    } else if (errorMessage.includes("Network") || errorMessage.includes("offline")) {
      // Network error
      toastService.networkOffline()
    } else if (errorMessage.includes("temporarily locked")) {
      // Account locked
      const minutesMatch = errorMessage.match(/(\d+) minute/)
      const minutes = minutesMatch ? Number.parseInt(minutesMatch[1], 10) : 15
      toastService.accountLocked(minutes)
    } else {
      // Generic error
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: DURATIONS.LONG,
      })
    }
  },
}
