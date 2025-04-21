"use client"

import { useEffect, useRef } from "react"

export const BeamsBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Configuration
    const BEAM_COUNT = 6
    const BEAM_WIDTH_FACTOR = 0.15
    const MOTION_BLUR = 0.85

    // Create beams
    const beams = Array.from({ length: BEAM_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 100 + 100,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      hue: Math.random() * 60 + 160, // Teal range
    }))

    // Animation
    const animate = () => {
      // Apply motion blur
      ctx.fillStyle = `rgba(8, 8, 25, ${MOTION_BLUR})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw and update beams
      beams.forEach((beam) => {
        // Update position
        beam.x += beam.vx
        beam.y += beam.vy

        // Bounce off edges
        if (beam.x <= 0 || beam.x >= canvas.width) beam.vx *= -1
        if (beam.y <= 0 || beam.y >= canvas.height) beam.vy *= -1

        // Draw gradient
        const gradient = ctx.createRadialGradient(beam.x, beam.y, 0, beam.x, beam.y, beam.radius)

        gradient.addColorStop(0, `hsla(${beam.hue}, 100%, 65%, 0.4)`)
        gradient.addColorStop(BEAM_WIDTH_FACTOR, `hsla(${beam.hue}, 100%, 65%, 0.1)`)
        gradient.addColorStop(1, `hsla(${beam.hue}, 100%, 65%, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(beam.x, beam.y, beam.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10 bg-slate-950" />
}
