import { CACHE_KEYS, cacheManager } from "../cache-manager"
import { getToken, handleResponse, fetchWithTimeout, fetchHealthChartData, fetchHealthDistribution } from "../api"

// Health metrics service
export const healthService = {
  // Get health statistics with error handling and retry logic
  async getHealthStats(days = 30, retryCount = 2): Promise<any> {
    try {
      const response = await fetchWithTimeout(
        `https://diax.fileish.com/api/health/stats?days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
        10000, // 10 second timeout
      )

      const data = await handleResponse(response)

      // Update the cache with the new data
      cacheManager.updateCache(CACHE_KEYS.HEALTH_STATS(days), data, false)

      return data
    } catch (error) {
      console.error(`Error fetching health stats (attempt ${3 - retryCount}/3):`, error)

      // Retry logic for transient errors
      if (
        retryCount > 0 &&
        error instanceof Error &&
        (error.message.includes("network") || error.message.includes("timeout") || error.message.includes("failed"))
      ) {
        console.log(`Retrying health stats fetch in 1 second...`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return healthService.getHealthStats(days, retryCount - 1)
      }

      // If we've exhausted retries or it's not a retryable error, throw
      throw error
    }
  },

  // Get health metrics with pagination and filtering
  async getHealthMetrics(params?: {
    type?: string
    days?: number
    from?: string
    to?: string
    limit?: number
    page?: number
  }): Promise<any> {
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
        15000, // 15 second timeout for potentially large data sets
      )

      const data = await handleResponse(response)

      // Update the cache with the new data
      cacheManager.updateCache(cacheKey, data, false)

      return data
    } catch (error) {
      console.error("Error fetching health metrics:", error)
      throw error
    }
  },

  // Get medical information
  async getMedicalInfo(): Promise<any> {
    try {
      const response = await fetchWithTimeout(
        "https://diax.fileish.com/api/users/medical-info",
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
        10000, // 10 second timeout
      )

      const data = await handleResponse(response)

      // Update the cache with the new data
      cacheManager.updateCache(CACHE_KEYS.MEDICAL_INFO, data, false)

      return data
    } catch (error) {
      console.error("Error fetching medical info:", error)
      throw error
    }
  },

  // Get chart data from the dedicated API endpoint
  async getChartData(type: string, days: number): Promise<any> {
    try {
      const data = await fetchHealthChartData({
        type,
        days,
      })

      return data.chart_data || []
    } catch (error) {
      console.error(`Error fetching chart data for ${type}:`, error)
      return []
    }
  },

  // Get distribution data from the dedicated API endpoint
  async getDistributionData(days: number): Promise<any> {
    try {
      const data = await fetchHealthDistribution({
        days,
      })

      return data
    } catch (error) {
      console.error("Error fetching distribution data:", error)
      return {}
    }
  },

  // Format chart data for the LineChart component
  formatChartData(data: any[], metricType: string): any[] {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return []
    }

    return data.map((item) => {
      let value = 0

      switch (metricType) {
        case "blood_glucose":
          value = item.blood_glucose || 0
          break
        case "blood_pressure_systolic":
          value = item.systolic_pressure || 0
          break
        case "blood_pressure_diastolic":
          value = item.diastolic_pressure || 0
          break
        case "heart_rate":
          value = item.heart_rate || 0
          break
        case "weight":
          value = item.weight_kg || 0
          break
        case "a1c":
          value = item.a1c || 0
          break
        default:
          value = 0
      }

      return {
        date: item.date,
        value,
      }
    })
  },

  // Format distribution data for the DonutChart component
  formatDistributionData(data: any): any[] {
    if (!data) {
      return []
    }

    const metrics = [
      { name: "Blood Glucose", value: data.blood_glucose?.total_readings || 0 },
      { name: "Blood Pressure", value: data.blood_pressure?.total_readings || 0 },
      { name: "Heart Rate", value: data.heart_rate?.total_readings || 0 },
      { name: "Exercise", value: data.exercise?.total_readings || 0 },
      { name: "Weight", value: data.weight?.total_readings || 0 },
      { name: "A1C", value: data.a1c?.total_readings || 0 },
    ]

    // Filter out metrics with zero counts only if we have at least one metric with data
    const nonZeroMetrics = metrics.filter((item) => item.value > 0)

    // If we have at least one metric with data, return only those
    // Otherwise return all metrics with zeros to show the empty state
    return nonZeroMetrics.length > 0 ? nonZeroMetrics : metrics
  },

  // Format exercise type distribution data for the DonutChart component
  formatExerciseTypeData(data: any): any[] {
    if (!data || !data.exercise || !data.exercise.types) {
      return []
    }

    return Object.entries(data.exercise.types).map(([name, count]) => ({
      name,
      value: count as number,
    }))
  },

  // Generate empty data for a timeframe (fallback)
  generateEmptyDataForTimeframe(days: number): any[] {
    const result = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      const formattedDate =
        days <= 7
          ? date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
          : date.toLocaleDateString("en-US", { weekday: "short" })

      result.push({ date: formattedDate, value: 0 })
    }

    return result
  },
}
