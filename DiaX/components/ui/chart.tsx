"use client"

import { useEffect, useRef, useState } from "react"
import { Chart, registerables, type ChartConfiguration } from "chart.js"

// Register Chart.js components
Chart.register(...registerables)

interface LineChartProps {
  data: Array<{ date: string; value: number }>
  index: string
  categories: string[]
  colors: string[]
  valueFormatter?: (value: number) => string
  showLegend?: boolean
  showGridLines?: boolean
  height?: number
  isLoading?: boolean
  error?: string | null
}

export function LineChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => `${value}`,
  showLegend = true,
  showGridLines = true,
  height = 300,
  isLoading = false,
  error = null,
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const [chartError, setChartError] = useState<string | null>(error)

  useEffect(() => {
    if (!canvasRef.current) return

    // Destroy previous chart instance if it exists
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    // If we're in a loading state or have an error, don't render the chart
    if (isLoading || error) {
      setChartError(error)
      return
    }

    // Validate data
    if (!data || data.length === 0) {
      setChartError("No data available")
      return
    }

    try {
      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) {
        setChartError("Could not get canvas context")
        return
      }

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, `${colors[0]}40`)
      gradient.addColorStop(1, `${colors[0]}05`)

      // Extract labels and values
      const labels = data.map((item) => item[index as keyof typeof item] as string)
      const values = data.map((item) => item.value)

      // Create chart configuration
      const chartConfig: ChartConfiguration = {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: categories[0],
              data: values,
              borderColor: colors[0],
              backgroundColor: gradient,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: colors[0],
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: showLegend,
              position: "top",
              labels: {
                usePointStyle: true,
                boxWidth: 6,
                boxHeight: 6,
              },
            },
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              padding: 10,
              cornerRadius: 4,
              callbacks: {
                label: (context) => {
                  const value = context.parsed.y
                  return valueFormatter(value)
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: showGridLines,
                color: "rgba(0, 0, 0, 0.05)",
              },
            },
            y: {
              grid: {
                display: showGridLines,
                color: "rgba(0, 0, 0, 0.05)",
              },
              beginAtZero: true,
            },
          },
          interaction: {
            mode: "index",
            intersect: false,
          },
          animation: {
            duration: 1000,
          },
        },
      }

      // Create chart
      chartRef.current = new Chart(ctx, chartConfig)
      setChartError(null)
    } catch (err) {
      console.error("Error creating chart:", err)
      setChartError("Failed to create chart")
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data, index, categories, colors, valueFormatter, showLegend, showGridLines, height, isLoading, error])

  if (isLoading) {
    return (
      <div style={{ height: `${height}px`, width: "100%" }} className="flex items-center justify-center">
        <div className="animate-pulse rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (chartError || !data || data.length === 0) {
    return (
      <div
        style={{ height: `${height}px`, width: "100%" }}
        className="flex items-center justify-center bg-muted/20 rounded-md"
      >
        <div className="text-center text-muted-foreground">
          <p>{chartError || "No data available for this time period"}</p>
          <p className="text-xs mt-1">Try selecting a different time range or adding more data</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: `${height}px`, width: "100%" }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

interface DonutChartProps {
  data: Array<{ name: string; value: number }>
  index: string
  category: string
  colors: string[]
  valueFormatter?: (value: number) => string
  showAnimation?: boolean
  height?: number
  isLoading?: boolean
  error?: string | null
}

export function DonutChart({
  data,
  index,
  category,
  colors,
  valueFormatter = (value) => `${value}`,
  showAnimation = true,
  height = 300,
  isLoading = false,
  error = null,
}: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const [chartError, setChartError] = useState<string | null>(error)

  useEffect(() => {
    if (!canvasRef.current) return

    // Destroy previous chart instance if it exists
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    // If we're in a loading state or have an error, don't render the chart
    if (isLoading || error) {
      setChartError(error)
      return
    }

    // Validate data
    if (!data || data.length === 0) {
      setChartError("No data available")
      return
    }

    // Check if all values are zero
    const allZeros = data.every((item) => (item[category as keyof typeof item] as number) === 0)
    if (allZeros) {
      setChartError("No data recorded yet")
      return
    }

    try {
      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) {
        setChartError("Could not get canvas context")
        return
      }

      // Extract labels and values
      const labels = data.map((item) => item[index as keyof typeof item] as string)
      const values = data.map((item) => item[category as keyof typeof item] as number)

      // Create chart configuration
      const chartConfig: ChartConfiguration = {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors.slice(0, data.length), // Only use as many colors as we have data points
              borderWidth: 0,
              hoverOffset: 10,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "70%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                usePointStyle: true,
                boxWidth: 6,
                boxHeight: 6,
                padding: 20,
              },
            },
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              padding: 10,
              cornerRadius: 4,
              callbacks: {
                label: (context) => {
                  const value = context.parsed
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                  const percentage = Math.round((value / total) * 100)
                  return `${context.label}: ${valueFormatter(value)} (${percentage}%)`
                },
              },
            },
          },
          animation: showAnimation
            ? {
                animateRotate: true,
                animateScale: true,
                duration: 1000,
              }
            : false,
        },
      }

      // Create chart
      chartRef.current = new Chart(ctx, chartConfig)
      setChartError(null)
    } catch (err) {
      console.error("Error creating chart:", err)
      setChartError("Failed to create chart")
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data, index, category, colors, valueFormatter, showAnimation, height, isLoading, error])

  if (isLoading) {
    return (
      <div style={{ height: `${height}px`, width: "100%" }} className="flex items-center justify-center">
        <div className="animate-pulse rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (chartError || !data || data.length === 0) {
    return (
      <div
        style={{ height: `${height}px`, width: "100%" }}
        className="flex items-center justify-center bg-muted/20 rounded-md"
      >
        <div className="text-center text-muted-foreground">
          <p>{chartError || "No data available for this time period"}</p>
          <p className="text-xs mt-1">Try selecting a different time range or adding more data</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: `${height}px`, width: "100%" }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
