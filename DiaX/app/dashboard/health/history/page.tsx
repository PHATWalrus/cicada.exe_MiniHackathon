"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchHealthMetrics, deleteHealthMetric } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  Activity,
  Droplet,
  Heart,
  Scale,
  TrendingUp,
  Dumbbell,
  PlusCircle,
  Trash2,
  Edit,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type HealthMetric = {
  id: number
  blood_glucose_level?: number | null
  measurement_context?: string | null
  systolic_pressure?: number | null
  diastolic_pressure?: number | null
  heart_rate?: number | null
  weight_kg?: number | null
  a1c_percentage?: number | null
  exercise_duration?: number | null
  exercise_type?: string | null
  exercise_intensity?: number | null
  medication_notes?: string | null
  food_notes?: string | null
  carbs_grams?: number | null
  notes?: string
  recorded_at: string
  created_at: string
  updated_at: string
}

export default function HealthHistory() {
  const { toast } = useToast()
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [metricType, setMetricType] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({})
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadMetrics()
  }, [metricType, currentPage, dateRange, searchQuery])

  const loadMetrics = async () => {
    try {
      setIsLoading(true)

      const params: any = {
        limit: 10,
        page: currentPage,
      }

      if (metricType && metricType !== "all") {
        params.type = metricType
      }

      if (dateRange.from) {
        params.from = dateRange.from
      }

      if (dateRange.to) {
        params.to = dateRange.to
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      console.log("Fetching metrics with params:", params)
      const data = await fetchHealthMetrics(params)

      if (data && data.metrics) {
        setMetrics(data.metrics)
        // Ensure totalPages is at least 1
        setTotalPages(Math.max(data.pagination.total_pages || 1, 1))

        console.log(`Pagination update: currentPage=${currentPage}, totalPages=${data.pagination.total_pages || 1}`)

        // Ensure current page is valid
        if (currentPage > data.pagination.total_pages && data.pagination.total_pages > 0) {
          setCurrentPage(data.pagination.total_pages)
        }

        console.log(`Loaded page ${currentPage} of ${data.pagination.total_pages}`)
      } else {
        setMetrics([])
        setTotalPages(1)
        console.log("No metrics data returned")
      }
    } catch (error) {
      console.error("Error loading health metrics:", error)
      toast({
        title: "Error loading metrics",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
      setMetrics([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadMetrics()
  }

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true)
      await deleteHealthMetric(id)

      toast({
        title: "Success",
        description: "Health metric deleted successfully",
        variant: "default",
      })

      // Reload metrics
      loadMetrics()
    } catch (error) {
      console.error("Error deleting health metric:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete health metric",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getMetricTypeIcon = (metric: HealthMetric) => {
    if (metric.blood_glucose_level !== null && metric.blood_glucose_level !== undefined)
      return <Droplet className="h-4 w-4 text-blue-500" />
    if (metric.systolic_pressure !== null && metric.systolic_pressure !== undefined)
      return <Activity className="h-4 w-4 text-red-500" />
    if (
      metric.heart_rate !== null &&
      metric.heart_rate !== undefined &&
      (metric.exercise_duration === null || metric.exercise_duration === undefined)
    )
      return <Heart className="h-4 w-4 text-pink-500" />
    if (metric.weight_kg !== null && metric.weight_kg !== undefined) return <Scale className="h-4 w-4 text-green-500" />
    if (metric.a1c_percentage !== null && metric.a1c_percentage !== undefined)
      return <TrendingUp className="h-4 w-4 text-purple-500" />
    if (metric.exercise_duration !== null && metric.exercise_duration !== undefined)
      return <Dumbbell className="h-4 w-4 text-orange-500" />
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  const getMetricTypeLabel = (metric: HealthMetric) => {
    if (metric.blood_glucose_level !== null && metric.blood_glucose_level !== undefined) return "Blood Glucose"
    if (metric.systolic_pressure !== null && metric.systolic_pressure !== undefined) return "Blood Pressure"
    if (
      metric.heart_rate !== null &&
      metric.heart_rate !== undefined &&
      (metric.exercise_duration === null || metric.exercise_duration === undefined)
    )
      return "Heart Rate"
    if (metric.weight_kg !== null && metric.weight_kg !== undefined) return "Weight"
    if (metric.a1c_percentage !== null && metric.a1c_percentage !== undefined) return "A1C"
    if (metric.exercise_duration !== null && metric.exercise_duration !== undefined) return "Exercise"
    return "Other"
  }

  const getMetricValue = (metric: HealthMetric) => {
    if (metric.blood_glucose_level !== null && metric.blood_glucose_level !== undefined)
      return `${metric.blood_glucose_level} mg/dL`
    if (metric.systolic_pressure !== null && metric.systolic_pressure !== undefined)
      return `${metric.systolic_pressure}/${metric.diastolic_pressure} mmHg`
    if (
      metric.heart_rate !== null &&
      metric.heart_rate !== undefined &&
      (metric.exercise_duration === null || metric.exercise_duration === undefined)
    )
      return `${metric.heart_rate} bpm`
    if (metric.weight_kg !== null && metric.weight_kg !== undefined) return `${metric.weight_kg} kg`
    if (metric.a1c_percentage !== null && metric.a1c_percentage !== undefined) return `${metric.a1c_percentage}%`
    if (metric.exercise_duration !== null && metric.exercise_duration !== undefined)
      return `${metric.exercise_duration} min ${metric.exercise_type || ""}`
    return "N/A"
  }

  const getMetricContext = (metric: HealthMetric) => {
    if (metric.measurement_context) {
      const contexts: Record<string, string> = {
        fasting: "Fasting",
        before_meal: "Before Meal",
        after_meal: "After Meal",
        before_exercise: "Before Exercise",
        after_exercise: "After Exercise",
        bedtime: "Bedtime",
        random: "Random",
      }
      return contexts[metric.measurement_context] || metric.measurement_context
    }

    if (metric.exercise_intensity) {
      return `Intensity: ${metric.exercise_intensity}/10`
    }

    return null
  }

  // Function to render pagination buttons
  const renderPaginationButtons = () => {
    // Always show pagination controls, even with just one page
    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Fixed pagination buttons */}
        <div className="flex items-center gap-1">
          {(() => {
            // Create an array to hold the page numbers we want to display
            const pageButtons = []

            // Always show first page
            if (currentPage > 3) {
              pageButtons.push(
                <Button
                  key={1}
                  variant={currentPage === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  className={`h-8 w-8 ${
                    currentPage === 1 ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white" : ""
                  }`}
                >
                  1
                </Button>,
              )

              // Add ellipsis if needed
              if (currentPage > 4) {
                pageButtons.push(
                  <span key="ellipsis1" className="px-1">
                    ...
                  </span>,
                )
              }
            }

            // Calculate the range of pages to show around current page
            const startPage = Math.max(1, currentPage - 1)
            const endPage = Math.min(totalPages, currentPage + 1)

            // Add the page numbers around current page
            for (let i = startPage; i <= endPage; i++) {
              pageButtons.push(
                <Button
                  key={i}
                  variant={currentPage === i ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i)}
                  className={`h-8 w-8 ${
                    currentPage === i ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white" : ""
                  }`}
                >
                  {i}
                </Button>,
              )
            }

            // Add ellipsis and last page if needed
            if (currentPage < totalPages - 2) {
              if (currentPage < totalPages - 3) {
                pageButtons.push(
                  <span key="ellipsis2" className="px-1">
                    ...
                  </span>,
                )
              }

              pageButtons.push(
                <Button
                  key={totalPages}
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className={`h-8 w-8 ${
                    currentPage === totalPages ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white" : ""
                  }`}
                >
                  {totalPages}
                </Button>,
              )
            }

            return pageButtons
          })()}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Health History</h1>
          <p className="text-gray-600">View and manage your health metrics</p>
        </div>
        <Link href="/dashboard/health/add">
          <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 rounded-xl flex items-center gap-2">
            <PlusCircle size={16} />
            Add Metric
          </Button>
        </Link>
      </div>

      <Card className="border-border shadow-sm rounded-2xl">
        <CardHeader className="pb-6 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20">
          <CardTitle className="text-cyan-700 dark:text-cyan-300">Filter Metrics</CardTitle>
          <CardDescription>Search and filter your health metrics</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="metric-type">Metric Type</Label>
              <Select
                value={metricType || "all"}
                onValueChange={(value) => {
                  setMetricType(value === "all" ? undefined : value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="blood_glucose">Blood Glucose</SelectItem>
                  <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                  <SelectItem value="heart_rate">Heart Rate</SelectItem>
                  <SelectItem value="weight">Weight</SelectItem>
                  <SelectItem value="a1c">A1C</SelectItem>
                  <SelectItem value="exercise">Exercise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateRange.from || ""}
                onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateRange.to || ""}
                onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                setDateRange({})
                setMetricType(undefined)
                setCurrentPage(1)
                loadMetrics()
              }}
              variant="outline"
              className="mr-2"
            >
              Reset Filters
            </Button>
            <Button
              onClick={loadMetrics}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
            >
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm rounded-2xl">
        <CardHeader className="pb-6 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20">
          <CardTitle className="text-cyan-700 dark:text-cyan-300">Health Metrics</CardTitle>
          <CardDescription>
            {metricType ? `Showing ${metricType.replace("_", " ")} metrics` : "Showing all health metrics"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-muted/60 rounded-full animate-pulse"></div>
                      <div>
                        <div className="h-4 w-32 bg-muted/60 rounded animate-pulse"></div>
                        <div className="h-3 w-24 bg-muted/40 rounded animate-pulse mt-2"></div>
                      </div>
                    </div>
                    <div className="h-4 w-24 bg-muted/60 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : metrics.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 p-4 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
                <Activity className="h-8 w-8 text-cyan-500" />
              </div>
              <h3 className="text-lg font-medium">No health metrics found</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                {metricType || dateRange.from || dateRange.to
                  ? "Try adjusting your filters"
                  : "Start tracking your health metrics"}
              </p>
              <Link href="/dashboard/health/add">
                <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 rounded-xl">
                  Record Your First Metric
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 p-2 rounded-full mt-1">
                        {getMetricTypeIcon(metric)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{getMetricTypeLabel(metric)}</h4>
                          <span className="text-sm text-cyan-500 font-medium">{getMetricValue(metric)}</span>
                        </div>

                        {getMetricContext(metric) && (
                          <p className="text-xs text-muted-foreground mt-1">{getMetricContext(metric)}</p>
                        )}

                        {metric.notes && <p className="text-sm mt-2 text-muted-foreground">{metric.notes}</p>}

                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(parseISO(metric.recorded_at), "MMM d, yyyy 'at' h:mm a")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Link href={`/dashboard/health/edit/${metric.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-cyan-500"
                        >
                          <Edit size={16} />
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Health Metric</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this health metric? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(metric.id)}
                              className="bg-red-500 hover:bg-red-600"
                              disabled={isDeleting}
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}

              {/* Always show pagination, even with just one page */}
              {renderPaginationButtons()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper component for the Label
function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium mb-2 block">
      {children}
    </label>
  )
}
