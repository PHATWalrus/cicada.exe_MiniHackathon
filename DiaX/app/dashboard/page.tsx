"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { CACHE_KEYS } from "@/lib/cache-manager"
import Link from "next/link"
import { Activity, MessageSquare, FileText, User, ArrowRight } from "lucide-react"
import { useNavigationManager } from "@/lib/navigation-manager"

export default function Dashboard() {
  const { preloadRoute } = useNavigationManager()

  // Prefetch all main sections on dashboard load
  useEffect(() => {
    const routes = ["/dashboard/health", "/dashboard/chat", "/dashboard/resources", "/dashboard/profile"]

    // Prefetch each route
    routes.forEach((route) => {
      preloadRoute(route)
    })
  }, [preloadRoute])

  // Fetch user profile data
  const { data: profile, isLoading } = useCachedFetch(CACHE_KEYS.PROFILE, {
    prioritizePrefetchedData: true,
    backgroundUpdate: true,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{isLoading ? "Loading..." : `Welcome, ${profile?.name || "User"}`}</h1>
        <p className="text-gray-600">Manage your diabetes care in one place</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/health" onMouseEnter={() => preloadRoute("/dashboard/health")}>
          <Card className="border border-cyan-500/20 dark:border-cyan-500/10 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow h-full">
            <CardHeader className="pb-2 bg-gradient-to-r from-cyan-50/80 to-teal-50/80 dark:from-cyan-950/30 dark:to-teal-950/30">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-500" />
                Health Tracking
              </CardTitle>
              <CardDescription>Monitor your health metrics</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm mb-4">Track blood glucose, medication, exercise, and more</p>
              <Button variant="outline" className="w-full justify-between border-cyan-500/30 hover:bg-cyan-500/10">
                Go to Health <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/chat" onMouseEnter={() => preloadRoute("/dashboard/chat")}>
          <Card className="border border-cyan-500/20 dark:border-cyan-500/10 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow h-full">
            <CardHeader className="pb-2 bg-gradient-to-r from-cyan-50/80 to-teal-50/80 dark:from-cyan-950/30 dark:to-teal-950/30">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-cyan-500" />
                Chat Assistant
              </CardTitle>
              <CardDescription>Get answers and support</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm mb-4">Ask questions about diabetes management and care</p>
              <Button variant="outline" className="w-full justify-between border-cyan-500/30 hover:bg-cyan-500/10">
                Start Chatting <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/resources" onMouseEnter={() => preloadRoute("/dashboard/resources")}>
          <Card className="border border-cyan-500/20 dark:border-cyan-500/10 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow h-full">
            <CardHeader className="pb-2 bg-gradient-to-r from-cyan-50/80 to-teal-50/80 dark:from-cyan-950/30 dark:to-teal-950/30">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-500" />
                Resources
              </CardTitle>
              <CardDescription>Educational materials</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm mb-4">Access articles, guides, and videos about diabetes</p>
              <Button variant="outline" className="w-full justify-between border-cyan-500/30 hover:bg-cyan-500/10">
                View Resources <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/profile" onMouseEnter={() => preloadRoute("/dashboard/profile")}>
          <Card className="border border-cyan-500/20 dark:border-cyan-500/10 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow h-full">
            <CardHeader className="pb-2 bg-gradient-to-r from-cyan-50/80 to-teal-50/80 dark:from-cyan-950/30 dark:to-teal-950/30">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-500" />
                Profile
              </CardTitle>
              <CardDescription>Manage your account</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm mb-4">Update your personal and medical information</p>
              <Button variant="outline" className="w-full justify-between border-cyan-500/30 hover:bg-cyan-500/10">
                View Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
