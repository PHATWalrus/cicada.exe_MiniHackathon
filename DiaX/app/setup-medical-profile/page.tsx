"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateMedicalInfo } from "@/lib/api"
import { HeartPulse, ArrowRight, CheckCircle, Stethoscope, Loader2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import { AuthLayout } from "@/components/auth-layout"
import { RegistrationProgress } from "@/components/registration-progress"
import { useThemeContext } from "@/context/theme-context"

export default function SetupMedicalProfilePage() {
  const [formData, setFormData] = useState({
    diabetes_type: "",
    diagnosis_year: "",
    height_cm: "",
    weight_kg: "",
    target_glucose_min: "",
    target_glucose_max: "",
    medications: "",
    allergies: "",
    comorbidities: "",
    notes: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const router = useRouter()
  const { user } = useAuth()
  const { inputBackground, borderColor } = useThemeContext()

  // Redirect to login if not in registration flow
  useEffect(() => {
    // Check if we're coming from email verification
    const isFromVerification = sessionStorage.getItem("fromEmailVerification")

    if (!user && !isFromVerification) {
      router.push("/login")
    }
  }, [user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Convert numeric fields
    const processedData = {
      ...formData,
      diagnosis_year: formData.diagnosis_year ? Number.parseInt(formData.diagnosis_year) : undefined,
      height_cm: formData.height_cm ? Number.parseFloat(formData.height_cm) : undefined,
      weight_kg: formData.weight_kg ? Number.parseFloat(formData.weight_kg) : undefined,
      target_glucose_min: formData.target_glucose_min ? Number.parseFloat(formData.target_glucose_min) : undefined,
      target_glucose_max: formData.target_glucose_max ? Number.parseFloat(formData.target_glucose_max) : undefined,
    }

    try {
      await updateMedicalInfo(processedData)
      setIsCompleted(true)

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        // Clear the registration flow marker
        sessionStorage.removeItem("fromEmailVerification")
        router.push("/dashboard")
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update medical information. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

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

  const pageVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  }

  const registrationSteps = [
    { number: 1, label: "Register" },
    { number: 2, label: "Verify" },
    { number: 3, label: "Profile" },
  ]

  if (isCompleted) {
    return (
      <AuthLayout
        title="Setup Complete!"
        description="Your medical profile has been saved"
        icon={<HeartPulse className="h-12 w-12" />}
        headerContent={<RegistrationProgress currentStep={3} steps={registrationSteps} />}
      >
        <motion.div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.3 }}
            className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full mx-auto w-24 h-24 flex items-center justify-center mb-4"
          >
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </motion.div>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl font-medium mb-2"
          >
            Registration Complete
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-muted-foreground mb-6"
          >
            Your account is now fully set up. You'll be redirected to your dashboard.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Button
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Set Up Your Medical Profile"
      description="This information helps us provide personalized diabetes management advice"
      icon={<Stethoscope className="h-12 w-12" />}
      headerContent={<RegistrationProgress currentStep={3} steps={registrationSteps} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={pageVariants}
              className="space-y-4"
            >
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="diabetes_type">Diabetes Type</Label>
                <Select
                  value={formData.diabetes_type}
                  onValueChange={(value) => handleSelectChange("diabetes_type", value)}
                  required
                >
                  <SelectTrigger className={`${inputBackground} ${borderColor}`}>
                    <SelectValue placeholder="Select diabetes type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="type1">Type 1</SelectItem>
                    <SelectItem value="type2">Type 2</SelectItem>
                    <SelectItem value="gestational">Gestational</SelectItem>
                    <SelectItem value="prediabetes">Prediabetes</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="diagnosis_year">Year of Diagnosis</Label>
                <Select
                  value={formData.diagnosis_year}
                  onValueChange={(value) => handleSelectChange("diagnosis_year", value)}
                >
                  <SelectTrigger className={`${inputBackground} ${borderColor}`}>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height_cm">Height (cm)</Label>
                  <Input
                    id="height_cm"
                    name="height_cm"
                    type="number"
                    value={formData.height_cm}
                    onChange={handleChange}
                    placeholder="e.g., 175"
                    className={`${inputBackground} ${borderColor}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight_kg">Weight (kg)</Label>
                  <Input
                    id="weight_kg"
                    name="weight_kg"
                    type="number"
                    value={formData.weight_kg}
                    onChange={handleChange}
                    placeholder="e.g., 70"
                    className={`${inputBackground} ${borderColor}`}
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_glucose_min">Target Glucose Min (mg/dL)</Label>
                  <Input
                    id="target_glucose_min"
                    name="target_glucose_min"
                    type="number"
                    value={formData.target_glucose_min}
                    onChange={handleChange}
                    placeholder="e.g., 70"
                    className={`${inputBackground} ${borderColor}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_glucose_max">Target Glucose Max (mg/dL)</Label>
                  <Input
                    id="target_glucose_max"
                    name="target_glucose_max"
                    type="number"
                    value={formData.target_glucose_max}
                    onChange={handleChange}
                    placeholder="e.g., 120"
                    className={`${inputBackground} ${borderColor}`}
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-4 flex justify-end">
                <Button
                  type="button"
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                  onClick={() => setCurrentStep(2)}
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={pageVariants}
              className="space-y-4"
            >
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="medications">Current Medications</Label>
                <Textarea
                  id="medications"
                  name="medications"
                  value={formData.medications}
                  onChange={handleChange}
                  placeholder="List your current medications and dosages"
                  rows={3}
                  className={`${inputBackground} ${borderColor}`}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="List any allergies you have"
                  rows={2}
                  className={`${inputBackground} ${borderColor}`}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="comorbidities">Other Health Conditions</Label>
                <Textarea
                  id="comorbidities"
                  name="comorbidities"
                  value={formData.comorbidities}
                  onChange={handleChange}
                  placeholder="List any other health conditions you have"
                  rows={2}
                  className={`${inputBackground} ${borderColor}`}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information you'd like to share"
                  rows={3}
                  className={`${inputBackground} ${borderColor}`}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="pt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className={`border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 ${borderColor}`}
                  onClick={() => setCurrentStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete Setup <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p variants={itemVariants} className="text-xs text-center text-muted-foreground mt-6">
          You can update this information later in your profile settings
        </motion.p>
      </form>
    </AuthLayout>
  )
}
