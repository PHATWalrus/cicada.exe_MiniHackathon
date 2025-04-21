"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

export default function PreloadingIndicator() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  // Reset loading state when route changes
  useEffect(() => {
    setIsLoading(true)

    // Short timeout to show loading indicator for at least a brief moment
    // This helps with perceived performance even for fast page loads
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [pathname, searchParams])

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 h-1 bg-teal-500 z-50 transition-all duration-300",
        isLoading ? "opacity-100" : "opacity-0",
      )}
      style={{
        width: isLoading ? "100%" : "0%",
        transition: "width 0.5s ease-out, opacity 0.3s ease-in-out",
      }}
    />
  )
}
