"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion } from "framer-motion"
import { useThemeContext } from "@/context/theme-context"

interface AuthLayoutProps {
  title: string
  description: string
  icon: React.ReactNode
  headerContent?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
}

export function AuthLayout({ title, description, icon, headerContent, footer, children }: AuthLayoutProps) {
  const { headerGradient, cardBackground } = useThemeContext()

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-slate-100 to-cyan-100 dark:from-slate-950 dark:to-cyan-950 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full max-w-md">
        <Card className={`border shadow-xl rounded-2xl overflow-hidden ${cardBackground}`}>
          <CardHeader className={`space-y-1 ${headerGradient} text-white p-8`}>
            <div className="flex justify-between items-center mb-4">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 10, scale: 1 }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              >
                {icon}
              </motion.div>
              <ThemeToggle />
            </div>
            <motion.div variants={itemVariants}>
              <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
              <CardDescription className="text-center text-white/80">{description}</CardDescription>
            </motion.div>

            {headerContent && <motion.div variants={itemVariants}>{headerContent}</motion.div>}
          </CardHeader>
          <CardContent className="p-8">{children}</CardContent>
          {footer && (
            <CardFooter className="flex justify-center p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
              {footer}
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
