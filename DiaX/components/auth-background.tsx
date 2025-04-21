"use client"

import { motion } from "framer-motion"
import { useThemeContext } from "@/context/theme-context"

export function AuthBackground() {
  const { isDark } = useThemeContext()

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Background gradient */}
      <div
        className={`absolute inset-0 ${
          isDark ? "bg-gradient-to-b from-slate-950 to-cyan-950" : "bg-gradient-to-b from-slate-100 to-cyan-100"
        }`}
      />

      {/* Animated circles */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${
              isDark
                ? "bg-gradient-to-r from-cyan-900/20 to-teal-900/20"
                : "bg-gradient-to-r from-cyan-500/20 to-teal-500/20"
            }`}
            style={{
              width: `${Math.random() * 400 + 100}px`,
              height: `${Math.random() * 400 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
            animate={{
              x: [0, Math.random() * 50 - 25],
              y: [0, Math.random() * 50 - 25],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Subtle grid overlay */}
      <div
        className={`absolute inset-0 ${isDark ? "bg-grid-white/[0.02]" : "bg-grid-black/[0.02]"} bg-[length:20px_20px]`}
      />
    </div>
  )
}
