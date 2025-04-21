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
import { useAuth } from "@/context/auth-context"
import { HeartPulse, Mail, Lock } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion } from "framer-motion"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-cyan-900 py-12 px-4 sm:px-6 lg:px-8">
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
            <CardTitle className="text-2xl font-bold text-center">Welcome Back to DiaX</CardTitle>
            <CardDescription className="text-center text-cyan-100">
              Enter your credentials to access your account
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="p-8">
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </motion.form>
        </CardContent>
        <CardFooter className="flex justify-center p-6 bg-slate-800/50 border-t border-slate-700">
          <p className="text-sm text-slate-300">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
