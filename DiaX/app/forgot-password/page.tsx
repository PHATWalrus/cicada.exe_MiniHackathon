"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { HeartPulse, Mail, ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { requestPasswordReset } from "@/lib/api"
import { motion } from "framer-motion"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await requestPasswordReset(email)
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request password reset. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-cyan-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-0 shadow-xl rounded-2xl overflow-hidden bg-slate-800/30 backdrop-blur-md border-white/10">
        <CardHeader className="space-y-1 bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-8">
          <div className="flex justify-between items-center mb-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <HeartPulse className="h-12 w-12" />
            </motion.div>
            <ThemeToggle />
          </div>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
            <CardDescription className="text-center text-cyan-100">
              Enter your email to receive a password reset link
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="p-8">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4"
            >
              <div className="bg-teal-500/20 p-4 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-teal-500" />
              </div>
              <h3 className="text-lg font-medium">Check Your Email</h3>
              <p className="text-muted-foreground">
                If the email address exists in our system, we've sent a password reset link to {email}.
              </p>
              <p className="text-muted-foreground text-sm">
                Please check your inbox and spam folder. The link will expire in 1 hour.
              </p>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-5"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 py-6 rounded-xl bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white py-6 rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </motion.form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center p-6 bg-slate-800/50 border-t border-slate-700">
          <p className="text-sm text-slate-300">
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
