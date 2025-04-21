"use client"

import { useRef, useEffect } from "react"
import { Chart, type ChartConfiguration, registerables } from "chart.js"

Chart.register(...registerables)

interface DonutChartProps {
  data: number[]
  labels: string[]
  title: string
  colors: string[]
  height?: number
  minimal?: boolean
}

export function DonutChart({ data, labels, title, colors, height = 200, minimal = false }: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Destroy previous chart instance if it exists
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const chartConfig: ChartConfiguration = {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            label: title,
            data,
            backgroundColor: colors,
            borderColor: "rgba(0, 0, 0, 0)",
            borderWidth: 0,
            cutout: "70%",
            borderRadius: 5,
            hoverOffset: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: !minimal,
            position: "bottom",
            labels: {
              boxWidth: 12,
              padding: 15,
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
            callbacks: {
              label: (context) => {
                const label = context.label || ""
                const value = context.formattedValue
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                const percentage = Math.round((context.parsed / total) * 100)
                return `${label}: ${value} (${percentage}%)`
              },
            },
          },
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
  }, [data, labels, title, colors, height, minimal])

  return (
    <div style={{ height: `${height}px` }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
