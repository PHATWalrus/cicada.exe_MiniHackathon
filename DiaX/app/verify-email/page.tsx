"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HeartPulse, Mail, CheckCircle, AlertTriangle, ArrowRight, RefreshCw, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { verifyEmail, resendVerification } from "@/lib/api"
import { AuthLayout } from "@/components/auth-layout"
import { RegistrationProgress } from "@/components/registration-progress"
import { useThemeContext } from "@/context/theme-context"
import { useAuth } from "@/context/auth-context"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [countdown, setCountdown] = useState(0)
  const { inputBackground, borderColor } = useThemeContext()
  const { refreshUserState } = useAuth()

  useEffect(() => {
    // Get token and email from URL query parameters
    const tokenParam = searchParams.get("token")
    const emailParam = searchParams.get("email")

    if (tokenParam) {
      setToken(tokenParam)
      // Automatically verify if token is present
      handleVerify(tokenParam)
    }

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

  const handleVerify = async (verificationToken: string) => {
    setIsVerifying(true)
    setVerificationStatus("verifying")
    setErrorMessage("")

    try {
      const response = await verifyEmail(verificationToken)
      setVerificationStatus("success")

      // Update the user object in localStorage to mark email as verified
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const user = JSON.parse(storedUser)
        user.email_verified = true
        localStorage.setItem("user", JSON.stringify(user))

        // Refresh the user state in the auth context
        refreshUserState()

        console.log("Updated user verification status in localStorage:", user)
      }

      // Redirect to medical profile setup after a short delay
      setTimeout(() => {
        // Set a session flag to indicate we're coming from email verification
        sessionStorage.setItem("fromEmailVerification", "true")
        router.push("/setup-medical-profile")
      }, 3000)
    } catch (error) {
      setVerificationStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to verify email. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email || isResending || countdown > 0) return

    setIsResending(true)
    setErrorMessage("")

    try {
      await resendVerification(email)
      // Start countdown
      setCountdown(60) // 60 seconds cooldown
    } catch (error) {
      // Don't show specific errors for security reasons
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

  const registrationSteps = [
    { number: 1, label: "Register" },
    { number: 2, label: "Verify" },
    { number: 3, label: "Profile" },
  ]

  return (
    <AuthLayout
      title="Verify Your Email"
      description={
        verificationStatus === "idle" || verificationStatus === "verifying"
          ? "Verifying your email address..."
          : verificationStatus === "success"
            ? "Your email has been verified successfully!"
            : "There was a problem verifying your email"
      }
      icon={<HeartPulse className="h-12 w-12" />}
      headerContent={<RegistrationProgress currentStep={2} steps={registrationSteps} />}
      footer={
        <motion.p variants={itemVariants} className="text-sm text-slate-600 dark:text-slate-400">
          <Link
            href="/login"
            className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 font-medium"
          >
            Back to Login
          </Link>
        </motion.p>
      }
    >
      <AnimatePresence mode="wait">
        {verificationStatus === "verifying" && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 text-cyan-500 animate-spin" />
              <h3 className="text-xl font-medium">Verifying Your Email</h3>
              <p className="text-muted-foreground">Please wait while we verify your email address...</p>
            </div>
          </motion.div>
        )}

        {verificationStatus === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full mx-auto w-24 h-24 flex items-center justify-center mb-4"
            >
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </motion.div>
            <h3 className="text-xl font-medium">Email Verified Successfully!</h3>
            <p className="text-muted-foreground">
              Your email has been verified. You'll be redirected to set up your medical profile.
            </p>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                onClick={() => {
                  sessionStorage.setItem("fromEmailVerification", "true")
                  router.push("/setup-medical-profile")
                }}
              >
                Continue to Medical Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {verificationStatus === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="bg-red-100 dark:bg-red-900/30 p-6 rounded-full mx-auto w-24 h-24 flex items-center justify-center mb-4"
            >
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </motion.div>
            <h3 className="text-xl font-medium">Verification Failed</h3>
            <p className="text-muted-foreground">
              {errorMessage || "The verification link may be invalid or expired."}
            </p>

            {email && (
              <div className="pt-4">
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
              </div>
            )}
          </motion.div>
        )}

        {verificationStatus === "idle" && !token && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
              className="bg-cyan-100 dark:bg-cyan-900/30 p-6 rounded-full mx-auto w-24 h-24 flex items-center justify-center mb-4"
            >
              <Mail className="h-12 w-12 text-cyan-600 dark:text-cyan-400" />
            </motion.div>
            <h3 className="text-xl font-medium">Check Your Email</h3>
            <p className="text-muted-foreground">We've sent a verification link to {email || "your email address"}.</p>
            <p className="text-muted-foreground text-sm">
              Please click the link in the email to verify your account. If you don't see it, check your spam folder.
            </p>

            <div className="pt-4">
              <Button
                variant="outline"
                className={`w-full border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 ${borderColor}`}
                onClick={handleResendVerification}
                disabled={isResending || countdown > 0 || !email}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
