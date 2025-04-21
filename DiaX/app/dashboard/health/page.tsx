"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  Activity,
  Droplet,
  Heart,
  Scale,
  ClipboardList,
  Download,
  FileJson,
  FileSpreadsheet,
  Info,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { CACHE_KEYS } from "@/lib/cache-manager"
import { LineChart } from "@/components/ui/chart"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useNavigationManager } from "@/lib/navigation-manager"
import { motion } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { healthService } from "@/lib/api-services/health-service"
import { exportAsCSV, exportAsJSON } from "@/lib/export-utils"
import { Skeleton } from "@/components/ui/skeleton"

const HealthStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i} className="border border-cyan-500/20 dark:border-cyan-500/10 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="pb-6 bg-gradient-to-r from-cyan-50/80 to-teal-50/80 dark:from-cyan-950/30 dark:to-teal-950/30">
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-40" />
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                <Skeleton className="h-3 w-12" />
              </p>
              <p className="text-2xl font-semibold">
                <Skeleton className="h-6 w-16" />
              </p>
            </div>
            <div className="p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                <Skeleton className="h-3 w-12" />
              </p>
              <p className="text-2xl font-semibold">
                <Skeleton className="h-6 w-16" />
              </p>
            </div>
          </div>
          <div className="mt-4 h-[180px]">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                <Skeleton className="h-3 w-12" />
              </p>
              <p>
                <Skeleton className="h-4 w-20" />
              </p>
            </div>
            <div className="p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                <Skeleton className="h-3 w-12" />
              </p>
              <p>
                <Skeleton className="h-4 w-20" />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

export default function HealthPage() {
  const [timeframe, setTimeframe] = useState("30")
  const { toast } = useToast()
  const { navigateTo, preloadRoute } = useNavigationManager()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [distributionData, setDistributionData] = useState<any>(null) // Initialize distributionData

  // Use enhanced cached fetch for health stats
  const {
    data: statsData,
    error: statsError,
    isLoading: isLoadingStats,
    mutate: refreshStats,
  } = useCachedFetch<any>(CACHE_KEYS.HEALTH_STATS(Number.parseInt(timeframe)), {
    prioritizePrefetchedData: true,
    backgroundUpdate: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  // Use enhanced cached fetch for medical info
  const {
    data: medicalInfo,
    error: medicalError,
    isLoading: isLoadingMedical,
  } = useCachedFetch<any>(CACHE_KEYS.MEDICAL_INFO, {
    prioritizePrefetchedData: true,
    backgroundUpdate: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  // Use enhanced cached fetch for health metrics (for export)
  const {
    data: metricsData,
    error: metricsError,
    isLoading: isLoadingMetrics,
    mutate: refreshMetrics,
  } = useCachedFetch<any>(CACHE_KEYS.HEALTH_METRICS("days=" + timeframe), {
    prioritizePrefetchedData: true,
    backgroundUpdate: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  // Use enhanced cached fetch for chart data
  const {
    data: chartData,
    error: chartError,
    isLoading: isLoadingChartData,
    mutate: refreshChartData,
  } = useCachedFetch<any>(CACHE_KEYS.HEALTH_CHARTS(`days=${timeframe}`), {
    prioritizePrefetchedData: true,
    backgroundUpdate: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  // We don't need to fetch distribution data anymore since we removed the chart
  // const [distributionData, setDistributionData] = useState<any>(null)

  // Extract stats from statsData with safe fallbacks
  const stats = statsData?.stats || {}

  // Prefetch related routes for better UX
  useEffect(() => {
    // Use preloadRoute instead of prefetchRoute
    preloadRoute("/dashboard/health/add")
    preloadRoute("/dashboard/health/history")
    preloadRoute("/dashboard/profile/medical")
  }, [preloadRoute])

  // Set up auto-refresh timer (every 5 minutes)
  useEffect(() => {
    refreshTimerRef.current = setInterval(
      () => {
        refreshStats()
        refreshMetrics()
        refreshChartData()
        setLastUpdated(new Date())
      },
      5 * 60 * 1000,
    ) // 5 minutes

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [refreshStats, refreshMetrics, refreshChartData])

  // Handle errors
  useEffect(() => {
    if (statsError || chartError) {
      setApiError("Error loading health data. Please try refreshing.")
      toast({
        title: "Error loading health data",
        description: statsError instanceof Error ? statsError.message : "Please try again later",
        variant: "destructive",
      })
    } else {
      setApiError(null)
    }
  }, [statsError, chartError, toast])

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value)
  }

  // Manual refresh function with loading state
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    setApiError(null)

    try {
      // Use our new service to fetch fresh data
      const freshStats = await healthService.getHealthStats(Number.parseInt(timeframe))

      // Update the SWR cache with the fresh data
      refreshStats(freshStats, false)

      // Also refresh metrics data
      refreshMetrics()
      refreshChartData()

      // Update last updated timestamp
      setLastUpdated(new Date())

      toast({
        title: "Data refreshed",
        description: "Your health data has been updated with the latest information",
        variant: "default",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      setApiError("Failed to refresh data. Please try again.")
      toast({
        title: "Refresh failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Determine if we're in a loading state
  const isLoading = isLoadingStats || isLoadingMedical || isLoadingChartData

  // Safely prepare chart data with error handling
  const prepareGlucoseChartData = useCallback(() => {
    try {
      if (!chartData || !chartData.chart_data || !Array.isArray(chartData.chart_data)) {
        return healthService.generateEmptyDataForTimeframe(Number.parseInt(timeframe))
      }

      // Use the health service to format the data
      return healthService.formatChartData(chartData.chart_data, "blood_glucose")
    } catch (error) {
      console.error("Error preparing glucose chart data:", error)
      return healthService.generateEmptyDataForTimeframe(Number.parseInt(timeframe))
    }
  }, [chartData, timeframe])

  // Safely prepare blood pressure chart data
  const prepareBloodPressureChartData = useCallback(() => {
    try {
      if (!chartData || !chartData.chart_data || !Array.isArray(chartData.chart_data)) {
        return healthService.generateEmptyDataForTimeframe(Number.parseInt(timeframe))
      }

      // Use the health service to format the data
      return healthService.formatChartData(chartData.chart_data, "blood_pressure_systolic")
    } catch (error) {
      console.error("Error preparing blood pressure chart data:", error)
      return healthService.generateEmptyDataForTimeframe(Number.parseInt(timeframe))
    }
  }, [chartData, timeframe])

  // Safely prepare heart rate chart data
  const prepareHeartRateChartData = useCallback(() => {
    try {
      if (!chartData || !chartData.chart_data || !Array.isArray(chartData.chart_data)) {
        return healthService.generateEmptyDataForTimeframe(Number.parseInt(timeframe))
      }

      // Use the health service to format the data
      return healthService.formatChartData(chartData.chart_data, "heart_rate")
    } catch (error) {
      console.error("Error preparing heart rate chart data:", error)
      return healthService.generateEmptyDataForTimeframe(Number.parseInt(timeframe))
    }
  }, [chartData, timeframe])

  // Safely prepare weight chart data
  const prepareWeightChartData = useCallback(() => {
    try {
      if (!chartData || !chartData.chart_data || !Array.isArray(chartData.chart_data)) {
        return healthService.generateEmptyDataForTimeframe(Number.parseInt(timeframe))
      }

      // Use the health service to format the data
      return healthService.formatChartData(chartData.chart_data, "weight")
    } catch (error) {
      console.error("Error preparing weight chart data:", error)
      return healthService.generateEmptyDataForTimeframe(Number.parseInt(timeframe))
    }
  }, [chartData, timeframe])

  // Safely prepare A1C chart data
  const prepareA1CChartData = useCallback(() => {
    try {
      if (!chartData || !chartData.chart_data || !Array.isArray(chartData.chart_data)) {
        return healthService.generateEmptyDataForTimeframe(Number.parseInt(timeframe))
      }

      // Use the health service to format the data
      return healthService.formatChartData(chartData.chart_data, "a1c")
    } catch (error) {
      console.error("Error preparing A1C chart data:", error)
      return healthService.generateEmptyDataForTimeframe(Number.parseInt(timeframe))
    }
  }, [chartData, timeframe])

  // Safely prepare exercise type distribution data
  const prepareExerciseTypeData = useCallback(() => {
    try {
      if (!distributionData) {
        return []
      }

      // Use the health service to format the data
      return healthService.formatExerciseTypeData(distributionData)
    } catch (error) {
      console.error("Error preparing exercise type data:", error)
      return []
    }
  }, [distributionData])

  // Handle data export
  const handleExport = (format: "csv" | "json") => {
    try {
      if (!metricsData || !metricsData.metrics || !Array.isArray(metricsData.metrics)) {
        toast({
          title: "Export failed",
          description: "No data available to export",
          variant: "destructive",
        })
        return
      }

      const filename = `diax-health-data-${formatDateForFilename()}.${format}`

      if (format === "csv") {
        exportAsCSV(metricsData.metrics, filename)
      } else {
        exportAsJSON(metricsData, filename)
      }

      toast({
        title: "Export successful",
        description: `Your health data has been exported as ${format.toUpperCase()}`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  // Helper function for filename formatting
  const formatDateForFilename = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  }

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  // Safely get conditions and medications arrays
  const conditions = medicalInfo?.comorbidities
    ? medicalInfo.comorbidities
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean)
    : []

  const medications = medicalInfo?.medications
    ? medicalInfo.medications
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean)
    : []

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Health Tracking</h1>
          <p className="text-gray-600">Monitor your diabetes health metrics</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/health/add" onMouseEnter={() => preloadRoute("/dashboard/health/add")}>
            <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 rounded-xl flex items-center gap-2">
              <ClipboardList size={16} />
              Record Health Data
            </Button>
          </Link>
          <Link href="/dashboard/health/history" onMouseEnter={() => preloadRoute("/dashboard/health/history")}>
            <Button variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10 rounded-xl">
              View History
            </Button>
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-teal-500/30 hover:bg-teal-500/10 rounded-xl">
                      <Download size={16} className="mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport("csv")} disabled={isLoadingMetrics}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      <span>Export as CSV</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("json")} disabled={isLoadingMetrics}>
                      <FileJson className="mr-2 h-4 w-4" />
                      <span>Export as JSON</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export your health data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="outline"
            className="border-cyan-500/30 hover:bg-cyan-500/10 rounded-xl"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </motion.div>

      {apiError && (
        <motion.div variants={item}>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div variants={item}>
        <Tabs defaultValue="30" value={timeframe} onValueChange={handleTimeframeChange}>
          <TabsList className="mb-4 bg-gradient-to-r from-cyan-500/10 to-teal-500/10">
            <TabsTrigger
              value="7"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-teal-500/20"
            >
              7 Days
            </TabsTrigger>
            <TabsTrigger
              value="30"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-teal-500/20"
            >
              30 Days
            </TabsTrigger>
            <TabsTrigger
              value="90"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-teal-500/20"
            >
              90 Days
            </TabsTrigger>
          </TabsList>

          <TabsContent value={timeframe}>
            {isLoading ? (
              <HealthStatsSkeleton />
            ) : !stats || Object.keys(stats).length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 p-4 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8 text-cyan-500" />
                </div>
                <h3 className="text-lg font-medium">No health data yet</h3>
                <p className="text-muted-foreground mt-2 mb-6">
                  Start tracking your health metrics to see statistics here
                </p>
                <Link href="/dashboard/health/add">
                  <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 rounded-xl">
                    Record Your First Metrics
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Blood Glucose Card */}
                {stats.blood_glucose && (
                  <Card className="border border-cyan-500/20 dark:border-cyan-500/10 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-6 bg-gradient-to-r from-cyan-50/80 to-teal-50/80 dark:from-cyan-950/30 dark:to-teal-950/30">
                      <CardTitle className="bg-gradient-to-r from-cyan-700 to-teal-700 dark:from-cyan-300 dark:to-teal-300 bg-clip-text text-transparent flex items-center gap-2">
                        <Droplet className="h-5 w-5 text-cyan-500" />
                        Blood Glucose
                      </CardTitle>
                      <CardDescription>
                        {stats.blood_glucose.count} readings in the past {timeframe} days
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gradient-to-r from-cyan-500/5 to-teal-500/5 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Average</p>
                          <p className="text-2xl font-semibold text-cyan-600">
                            {stats.blood_glucose.avg} <span className="text-sm font-normal">mg/dL</span>
                          </p>
                        </div>
                        <div className="bg-gradient-to-r from-cyan-500/5 to-teal-500/5 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Last Reading</p>
                          <p className="text-2xl font-semibold text-cyan-600">
                            {stats.blood_glucose.last} <span className="text-sm font-normal">mg/dL</span>
                          </p>
                        </div>
                      </div>

                      {/* Add chart if we have data points */}
                      <div className="mt-4 h-[180px]">
                        <LineChart
                          data={prepareGlucoseChartData()}
                          index="date"
                          categories={["Blood Glucose"]}
                          colors={["#06b6d4"]}
                          valueFormatter={(value) => `${value} mg/dL`}
                          height={180}
                          showGridLines={true}
                          isLoading={isRefreshing}
                          error={apiError}
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Range</p>
                          <p className="text-sm">
                            <span className="text-cyan-500">{stats.blood_glucose.min}</span> -{" "}
                            <span className="text-cyan-500">{stats.blood_glucose.max}</span> mg/dL
                          </p>
                        </div>
                        <div className="p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">In Target</p>
                          <p className="text-sm">
                            <span
                              className={
                                stats.blood_glucose.in_range_percentage > 70 ? "text-teal-500" : "text-amber-500"
                              }
                            >
                              {stats.blood_glucose.in_range_percentage}%
                            </span>{" "}
                            of readings
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Blood Pressure Card */}
                {stats.blood_pressure && (
                  <Card className="border border-cyan-500/20 dark:border-cyan-500/10 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-6 bg-gradient-to-r from-cyan-50/80 to-teal-50/80 dark:from-cyan-950/30 dark:to-teal-950/30">
                      <CardTitle className="bg-gradient-to-r from-cyan-700 to-teal-700 dark:from-cyan-300 dark:to-teal-300 bg-clip-text text-transparent flex items-center gap-2">
                        <Activity className="h-5 w-5 text-cyan-500" />
                        Blood Pressure
                      </CardTitle>
                      <CardDescription>
                        {stats.blood_pressure.count} readings in the past {timeframe} days
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-cyan-500/5 to-teal-500/5 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Average</p>
                          <p className="text-2xl font-semibold text-cyan-600">
                            {stats.blood_pressure.avg_systolic}/{stats.blood_pressure.avg_diastolic}{" "}
                            <span className="text-sm font-normal">mmHg</span>
                          </p>
                        </div>
                        <div className="bg-gradient-to-r from-cyan-500/5 to-teal-500/5 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Last Reading</p>
                          <p className="text-2xl font-semibold text-cyan-600">{stats.blood_pressure.last}</p>
                        </div>
                      </div>

                      {/* Add chart if we have data points */}
                      <div className="mt-4 h-[180px]">
                        <LineChart
                          data={prepareBloodPressureChartData()}
                          index="date"
                          categories={["Systolic"]}
                          colors={["#ef4444"]}
                          valueFormatter={(value) => `${value} mmHg`}
                          height={180}
                          showGridLines={true}
                          isLoading={isRefreshing}
                          error={apiError}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Heart Rate Card */}
                {stats.heart_rate && (
                  <Card className="border border-cyan-500/20 dark:border-cyan-500/10 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-6 bg-gradient-to-r from-cyan-50/80 to-teal-50/80 dark:from-cyan-950/30 dark:to-teal-950/30">
                      <CardTitle className="bg-gradient-to-r from-cyan-700 to-teal-700 dark:from-cyan-300 dark:to-teal-300 bg-clip-text text-transparent flex items-center gap-2">
                        <Heart className="h-5 w-5 text-cyan-500" />
                        Heart Rate
                      </CardTitle>
                      <CardDescription>
                        {stats.heart_rate.count} readings in the past {timeframe} days
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-cyan-500/5 to-teal-500/5 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Average</p>
                          <p className="text-2xl font-semibold text-cyan-600">
                            {stats.heart_rate.avg} <span className="text-sm font-normal">bpm</span>
                          </p>
                        </div>
                        <div className="bg-gradient-to-r from-cyan-500/5 to-teal-500/5 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Last Reading</p>
                          <p className="text-2xl font-semibold text-cyan-600">
                            {stats.heart_rate.last} <span className="text-sm font-normal">bpm</span>
                          </p>
                        </div>
                      </div>

                      {/* Add chart if we have data points */}
                      <div className="mt-4 h-[180px]">
                        <LineChart
                          data={prepareHeartRateChartData()}
                          index="date"
                          categories={["Heart Rate"]}
                          colors={["#ec4899"]}
                          valueFormatter={(value) => `${value} bpm`}
                          height={180}
                          showGridLines={true}
                          isLoading={isRefreshing}
                          error={apiError}
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Range</p>
                          <p className="text-sm">
                            <span className="text-cyan-500">{stats.heart_rate.min}</span> -{" "}
                            <span className="text-cyan-500">{stats.heart_rate.max}</span> bpm
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Weight Card */}
                {stats.weight && (
                  <Card className="border border-cyan-500/20 dark:border-cyan-500/10 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-6 bg-gradient-to-r from-cyan-50/80 to-teal-50/80 dark:from-cyan-950/30 dark:to-teal-950/30">
                      <CardTitle className="bg-gradient-to-r from-cyan-700 to-teal-700 dark:from-cyan-300 dark:to-teal-300 bg-clip-text text-transparent flex items-center gap-2">
                        <Scale className="h-5 w-5 text-cyan-500" />
                        Weight
                      </CardTitle>
                      <CardDescription>
                        {stats.weight.count} readings in the past {timeframe} days
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-cyan-500/5 to-teal-500/5 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Last Weight</p>
                          <p className="text-2xl font-semibold text-cyan-600">
                            {stats.weight.last} <span className="text-sm font-normal">kg</span>
                          </p>
                        </div>
                        <div className="bg-gradient-to-r from-cyan-500/5 to-teal-500/5 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Change</p>
                          <p
                            className={`text-2xl font-semibold ${stats.weight.change < 0 ? "text-green-500" : stats.weight.change > 0 ? "text-red-500" : "text-muted-foreground"}`}
                          >
                            {stats.weight.change > 0 ? "+" : ""}
                            {stats.weight.change} <span className="text-sm font-normal">kg</span>
                          </p>
                        </div>
                      </div>

                      {/* Add chart if we have data points */}
                      <div className="mt-4 h-[180px]">
                        <LineChart
                          data={prepareWeightChartData()}
                          index="date"
                          categories={["Weight"]}
                          colors={["#10b981"]}
                          valueFormatter={(value) => `${value} kg`}
                          height={180}
                          showGridLines={true}
                          isLoading={isRefreshing}
                          error={apiError}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
      <motion.div variants={item}>
        {/* Medical Info Card */}
        <Card className="border border-cyan-500/20 dark:border-cyan-500/10 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="pb-6 bg-gradient-to-r from-cyan-50/80 to-teal-50/80 dark:from-cyan-950/30 dark:to-teal-950/30">
            <CardTitle className="bg-gradient-to-r from-cyan-700 to-teal-700 dark:from-cyan-300 dark:to-teal-300 bg-clip-text text-transparent flex items-center gap-2">
              <Info className="h-5 w-5 text-cyan-500" />
              Medical Information
            </CardTitle>
            <CardDescription>Your recorded medical conditions and medications</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Conditions</h4>
              {conditions.length > 0 ? (
                <ul className="list-disc list-inside text-sm">
                  {conditions.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No conditions recorded.</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Medications</h4>
              {medications.length > 0 ? (
                <ul className="list-disc list-inside text-sm">
                  {medications.map((medication, index) => (
                    <li key={index}>{medication}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No medications recorded.</p>
              )}
            </div>
            <Link href="/dashboard/profile/medical" onMouseEnter={() => preloadRoute("/dashboard/profile/medical")}>
              <Button variant="link" className="mt-4">
                Edit Medical Information
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
