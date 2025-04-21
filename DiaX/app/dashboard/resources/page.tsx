"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { CACHE_KEYS } from "@/lib/cache-manager"
import { useNavigationManager } from "@/lib/navigation-manager"
import { BookOpen, FileText, Video, LinkIcon, Search, ExternalLink } from "lucide-react"

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { preloadRoute } = useNavigationManager()

  const { data: resources, isLoading } = useCachedFetch(CACHE_KEYS.RESOURCES(searchQuery), {
    prioritizePrefetchedData: true,
    backgroundUpdate: true,
  })

  // Prefetch other main sections
  useEffect(() => {
    preloadRoute("/dashboard/health")
    preloadRoute("/dashboard/chat")
    preloadRoute("/dashboard/profile")
  }, [preloadRoute])

  // Filter resources based on search query
  const filteredResources = resources?.filter((resource: any) => {
    if (!searchQuery) return true
    return (
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Get icon based on resource type
  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "article":
        return <FileText className="h-5 w-5 text-cyan-500" />
      case "video":
        return <Video className="h-5 w-5 text-cyan-500" />
      case "guide":
        return <BookOpen className="h-5 w-5 text-cyan-500" />
      default:
        return <LinkIcon className="h-5 w-5 text-cyan-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Diabetes Resources</h1>
        <p className="text-gray-600">Educational materials to help you manage your diabetes</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          className="pl-10 bg-background"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <ResourcesSkeleton />
      ) : filteredResources?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource: any) => (
            <Card
              key={resource.id}
              className="border border-cyan-500/20 dark:border-cyan-500/10 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2 bg-gradient-to-r from-cyan-50/80 to-teal-50/80 dark:from-cyan-950/30 dark:to-teal-950/30">
                <CardTitle className="flex items-center gap-2">
                  {getResourceIcon(resource.type)}
                  {resource.title}
                </CardTitle>
                <CardDescription>{resource.type}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm">{resource.description}</p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full justify-between border-cyan-500/30 hover:bg-cyan-500/10"
                  onClick={() => window.open(resource.url, "_blank")}
                >
                  View Resource <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 p-4 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-cyan-500" />
          </div>
          <h3 className="text-lg font-medium">No resources found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search or check back later for new resources</p>
        </div>
      )}
    </div>
  )
}

// Skeleton loader for resources
const ResourcesSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Card key={i} className="border border-border shadow-sm rounded-xl">
        <CardHeader className="pb-2">
          <div className="h-5 w-32 bg-muted/60 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-muted/40 rounded animate-pulse mt-2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-16 w-full bg-muted/40 rounded animate-pulse"></div>
        </CardContent>
        <CardFooter>
          <div className="h-9 w-full bg-muted/40 rounded animate-pulse"></div>
        </CardFooter>
      </Card>
    ))}
  </div>
)
