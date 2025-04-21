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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HeartPulse, User, Mail, Lock, Phone, Calendar, Users } from "lucide-react"
import { motion } from "framer-motion"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone_number: "",
    date_of_birth: "",
    gender: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { register } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenderChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await register(formData)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-cyan-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-0 shadow-xl rounded-2xl overflow-hidden bg-slate-800/30 backdrop-blur-md border-white/10">
        <CardHeader className="space-y-1 bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-8">
          <motion.div
            className="flex justify-center mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <HeartPulse className="h-12 w-12" />
          </motion.div>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <CardTitle className="text-2xl font-bold text-center">Join DiaX</CardTitle>
            <CardDescription className="text-center text-cyan-100">
              Create your account to start managing your diabetes
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="p-8">
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
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
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="pl-10 py-6 rounded-xl bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-10 py-6 rounded-xl bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="pl-10 py-6 rounded-xl bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <p className="text-xs text-slate-400">Must be at least 8 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="pl-10 py-6 rounded-xl bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth (optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="pl-10 py-6 rounded-xl bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender (optional)</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 text-muted-foreground h-5 w-5 z-10" />
                <Select value={formData.gender} onValueChange={handleGenderChange}>
                  <SelectTrigger className="pl-10 py-6 rounded-xl bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white py-6 rounded-xl mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </motion.form>
        </CardContent>
        <CardFooter className="flex justify-center p-6 bg-slate-800/50 border-t border-slate-700">
          <p className="text-sm text-slate-300">
            Already have an account?{" "}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
