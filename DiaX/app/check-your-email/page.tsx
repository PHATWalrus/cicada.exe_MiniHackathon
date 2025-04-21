"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HeartPulse, Mail, RefreshCw, ArrowLeft } from "lucide-react"
import { resendVerification } from "@/lib/api"
import { motion } from "framer-motion"
import { AuthLayout } from "@/components/auth-layout"
import { RegistrationProgress } from "@/components/registration-progress"
import { useThemeContext } from "@/context/theme-context"

export default function CheckYourEmailPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { inputBackground, borderColor } = useThemeContext()

  useEffect(() => {
    // Get email from URL query parameter
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResendVerification = async () => {
    if (!email || isResending || countdown > 0) return

    setIsResending(true)
    setResendSuccess(false)

    try {
      await resendVerification(email)
      // Show success message and start countdown
      setResendSuccess(true)
      setCountdown(60) // 60 seconds cooldown
    } catch (error) {
      console.error("Error resending verification:", error)
    } finally {
      setIsResending(false)
    }
  }

  // Animation variants
  const contentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

  // Envelope animation
  const envelopeVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      y: [0, -15, 0],
      transition: {
        y: {
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "easeInOut",
        },
        scale: { duration: 0.5 },
        opacity: { duration: 0.5 },
      },
    },
  }

  const registrationSteps = [
    { number: 1, label: "Register" },
    { number: 2, label: "Verify" },
    { number: 3, label: "Profile" },
  ]

  return (
    <AuthLayout
      title="Check Your Email"
      description="We've sent a verification link to your email"
      icon={<HeartPulse className="h-12 w-12" />}
      headerContent={<RegistrationProgress currentStep={2} steps={registrationSteps} />}
      footer={
        <motion.p variants={itemVariants} className="text-sm text-slate-600 dark:text-slate-400">
          <Link
            href="/login"
            className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </motion.p>
      }
    >
      <motion.div variants={contentVariants} initial="hidden" animate="visible" className="text-center space-y-6">
        <motion.div
          variants={envelopeVariants}
          initial="initial"
          animate="animate"
          className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 dark:from-cyan-500/10 dark:to-teal-500/10 p-6 rounded-full mx-auto w-24 h-24 flex items-center justify-center mb-4"
        >
          <Mail className="h-12 w-12 text-cyan-600 dark:text-cyan-400" />
        </motion.div>

        <motion.h3 variants={itemVariants} className="text-xl font-medium">
          Verify Your Email Address
        </motion.h3>

        <motion.p variants={itemVariants} className="text-muted-foreground">
          We've sent a verification link to{" "}
          <span className="font-medium text-cyan-600 dark:text-cyan-400">{email || "your email address"}</span>.
        </motion.p>

        <motion.div variants={itemVariants}>
          <div className="bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-100 dark:border-cyan-900 rounded-lg p-4 text-sm">
            <p className="text-cyan-800 dark:text-cyan-300">
              Please click the link in the email to verify your account and complete your registration.
            </p>
          </div>
        </motion.div>

        <motion.p variants={itemVariants} className="text-sm text-muted-foreground">
          If you don't see the email, check your spam folder or request a new verification link.
        </motion.p>

        <motion.div variants={itemVariants} className="pt-2">
          <Button
            variant="outline"
            className={`w-full border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 ${borderColor}`}
            onClick={handleResendVerification}
            disabled={isResending || countdown > 0}
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              "Resend Verification Email"
            )}
          </Button>

          {resendSuccess && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-green-600 dark:text-green-400 mt-2"
            >
              Verification email sent successfully!
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AuthLayout>
  )
}
