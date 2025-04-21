"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HeartPulse, User, Mail, Lock, Phone, Calendar, Users, ArrowRight, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AuthLayout } from "@/components/auth-layout"
import { RegistrationProgress } from "@/components/registration-progress"
import { useThemeContext } from "@/context/theme-context"

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
  const { inputBackground, borderColor } = useThemeContext()

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
      // Redirect is handled in the auth context
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Animation variants
  const formVariants = {
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
      title="Join DiaX"
      description="Create your account in 3 easy steps: register, verify email, and set up your medical profile"
      icon={<HeartPulse className="h-12 w-12" />}
      headerContent={<RegistrationProgress currentStep={1} steps={registrationSteps} />}
      footer={
        <motion.p variants={itemVariants} className="text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 font-medium"
          >
            Login
          </Link>
        </motion.p>
      }
    >
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-4"
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`pl-10 py-6 rounded-xl ${inputBackground} ${borderColor}`}
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2">
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
              className={`pl-10 py-6 rounded-xl ${inputBackground} ${borderColor}`}
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2">
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
              className={`pl-10 py-6 rounded-xl ${inputBackground} ${borderColor}`}
            />
          </div>
          <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="phone_number">Phone Number (optional)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className={`pl-10 py-6 rounded-xl ${inputBackground} ${borderColor}`}
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth (optional)</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
              className={`pl-10 py-6 rounded-xl ${inputBackground} ${borderColor}`}
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="gender">Gender (optional)</Label>
          <div className="relative">
            <Users className="absolute left-3 top-3 text-muted-foreground h-5 w-5 z-10" />
            <Select value={formData.gender} onValueChange={handleGenderChange}>
              <SelectTrigger className={`pl-10 py-6 rounded-xl ${inputBackground} ${borderColor}`}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="pt-4">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white py-6 rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create account <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>
      </motion.form>
    </AuthLayout>
  )
}
