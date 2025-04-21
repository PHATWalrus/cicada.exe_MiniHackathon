"use client"

import { useRef, useEffect } from "react"
import { Chart, type ChartConfiguration, registerables } from "chart.js"

Chart.register(...registerables)

interface LineChartProps {
  data: number[]
  labels: string[]
  title: string
  color: string
  height?: number
  yAxisLabel?: string
  minimal?: boolean
}

export function LineChart({
  data,
  labels,
  title,
  color,
  height = 200,
  yAxisLabel = "",
  minimal = false,
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Destroy previous chart instance if it exists
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    // Create gradient
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, `${color}50`)
    gradient.addColorStop(1, `${color}01`)

    const chartConfig: ChartConfiguration = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: title,
            data,
            borderColor: color,
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: minimal ? 0 : 3,
            pointBackgroundColor: color,
            pointBorderColor: "rgba(0, 0, 0, 0)",
            pointHoverRadius: 5,
            pointHoverBackgroundColor: color,
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: !minimal,
            position: "top",
            labels: {
              boxWidth: 10,
              usePointStyle: true,
            },
          },
          tooltip: {
            enabled: !minimal,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            titleColor: "#fff",
            bodyColor: "#fff",
            bodySpacing: 4,
            padding: 10,
            cornerRadius: 8,
            usePointStyle: true,
          },
        },
        scales: {
          x: {
            grid: {
              display: !minimal,
              drawBorder: !minimal,
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              display: !minimal,
              maxRotation: 0,
              padding: 8,
              color: "rgba(255, 255, 255, 0.5)",
            },
          },
          y: {
            grid: {
              display: !minimal,
              drawBorder: !minimal,
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              display: !minimal,
              padding: 8,
              color: "rgba(255, 255, 255, 0.5)",
            },
            title: {
              display: !minimal && !!yAxisLabel,
              text: yAxisLabel,
              color: "rgba(255, 255, 255, 0.5)",
            },
            beginAtZero: true,
          },
        },
        elements: {
          line: {
            tension: 0.4,
          },
        },
        interaction: {
          mode: "index",
          intersect: false,
        },
      },
    }

    // Create new chart
    chartRef.current = new Chart(canvasRef.current, chartConfig)

    // Cleanup
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data, labels, title, color, height, yAxisLabel, minimal])

  return (
    <div style={{ height: `${height}px` }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
