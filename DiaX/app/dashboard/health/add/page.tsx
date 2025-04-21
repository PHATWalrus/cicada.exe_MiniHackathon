"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addHealthMetric, fetchMedicalInfo } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { toastService } from "@/lib/toast-service"
import {
  Droplet,
  Activity,
  Heart,
  Scale,
  TrendingUp,
  Dumbbell,
  Info,
  ArrowLeft,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMobile } from "@/hooks/use-mobile"

interface MetricTypeInfo {
  icon: React.ReactNode
  label: string
  description: string
  units: string
  normalRange: string
  color: string
}

export default function AddHealthMetrics() {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMobile()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [medicalInfo, setMedicalInfo] = useState<any>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    blood_glucose: true, // Blood glucose expanded by default
    blood_pressure: false,
    heart_rate: false,
    weight: false,
    a1c: false,
    exercise: false,
  })
  const [formData, setFormData] = useState({
    // Common fields
    recorded_at: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDThh:mm
    notes: "",

    // Blood Glucose
    blood_glucose_level: "",
    measurement_context: "fasting",

    // Blood Pressure
    systolic_pressure: "",
    diastolic_pressure: "",

    // Heart Rate
    heart_rate: "",

    // Weight
    weight_kg: "",

    // A1C
    a1c_percentage: "",

    // Exercise
    exercise_duration: "",
    exercise_type: "walking",
    exercise_intensity: "5",
  })

  // Load medical info for context (target ranges)
  useEffect(() => {
    const loadMedicalInfo = async () => {
      try {
        const data = await fetchMedicalInfo()
        setMedicalInfo(data)
      } catch (error) {
        console.log("No medical profile found or error loading it")
      }
    }

    loadMedicalInfo()
  }, [])

  const metricTypeInfo: Record<string, MetricTypeInfo> = {
    blood_glucose: {
      icon: <Droplet className="h-5 w-5 text-blue-500" />,
      label: "Blood Glucose",
      description: "Measure of glucose (sugar) in your blood",
      units: "mg/dL",
      normalRange: medicalInfo
        ? `Your target: ${medicalInfo.target_glucose_min}-${medicalInfo.target_glucose_max} mg/dL`
        : "Normal fasting: 70-99 mg/dL",
      color: "border-blue-100",
    },
    blood_pressure: {
      icon: <Activity className="h-5 w-5 text-red-500" />,
      label: "Blood Pressure",
      description: "Pressure of blood against artery walls",
      units: "mmHg (systolic/diastolic)",
      normalRange: "Normal: <120/80 mmHg",
      color: "border-red-100",
    },
    heart_rate: {
      icon: <Heart className="h-5 w-5 text-pink-500" />,
      label: "Heart Rate",
      description: "Number of heartbeats per minute",
      units: "bpm (beats per minute)",
      normalRange: "Normal resting: 60-100 bpm",
      color: "border-pink-100",
    },
    weight: {
      icon: <Scale className="h-5 w-5 text-green-500" />,
      label: "Weight",
      description: "Body weight measurement",
      units: "kg (kilograms)",
      normalRange: "Healthy BMI: 18.5-24.9",
      color: "border-green-100",
    },
    a1c: {
      icon: <TrendingUp className="h-5 w-5 text-purple-500" />,
      label: "A1C",
      description: "Average blood glucose over past 2-3 months",
      units: "% (percentage)",
      normalRange: "Target for diabetes: <7%",
      color: "border-purple-100",
    },
    exercise: {
      icon: <Dumbbell className="h-5 w-5 text-orange-500" />,
      label: "Exercise",
      description: "Physical activity details",
      units: "minutes",
      normalRange: "Recommended: 150+ min/week",
      color: "border-orange-100",
    },
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Check if any data has been entered
      const hasBloodGlucose = !!formData.blood_glucose_level
      const hasBloodPressure = !!formData.systolic_pressure && !!formData.diastolic_pressure
      const hasHeartRate = !!formData.heart_rate
      const hasWeight = !!formData.weight_kg
      const hasA1C = !!formData.a1c_percentage
      const hasExercise = !!formData.exercise_duration

      if (!hasBloodGlucose && !hasBloodPressure && !hasHeartRate && !hasWeight && !hasA1C && !hasExercise) {
        throw new Error("Please enter at least one health metric")
      }

      // Submit each metric that has data
      const submissionPromises = []
      const submittedMetrics = []

      if (hasBloodGlucose) {
        const bloodGlucoseData = {
          recorded_at: formData.recorded_at,
          notes: formData.notes,
          blood_glucose_level: Number.parseFloat(formData.blood_glucose_level),
          measurement_context: formData.measurement_context,
        }
        submissionPromises.push(addHealthMetric(bloodGlucoseData, true)) // Suppress individual toasts
        submittedMetrics.push("blood glucose")
      }

      if (hasBloodPressure) {
        const bloodPressureData = {
          recorded_at: formData.recorded_at,
          notes: formData.notes,
          systolic_pressure: Number.parseInt(formData.systolic_pressure),
          diastolic_pressure: Number.parseInt(formData.diastolic_pressure),
        }
        submissionPromises.push(addHealthMetric(bloodPressureData, true)) // Suppress individual toasts
        submittedMetrics.push("blood pressure")
      }

      if (hasHeartRate) {
        const heartRateData = {
          recorded_at: formData.recorded_at,
          notes: formData.notes,
          heart_rate: Number.parseInt(formData.heart_rate),
        }
        submissionPromises.push(addHealthMetric(heartRateData, true)) // Suppress individual toasts
        submittedMetrics.push("heart rate")
      }

      if (hasWeight) {
        const weightData = {
          recorded_at: formData.recorded_at,
          notes: formData.notes,
          weight_kg: Number.parseFloat(formData.weight_kg),
        }
        submissionPromises.push(addHealthMetric(weightData, true)) // Suppress individual toasts
        submittedMetrics.push("weight")
      }

      if (hasA1C) {
        const a1cData = {
          recorded_at: formData.recorded_at,
          notes: formData.notes,
          a1c_percentage: Number.parseFloat(formData.a1c_percentage),
        }
        submissionPromises.push(addHealthMetric(a1cData, true)) // Suppress individual toasts
        submittedMetrics.push("A1C")
      }

      if (hasExercise) {
        const exerciseData = {
          recorded_at: formData.recorded_at,
          notes: formData.notes,
          exercise_duration: Number.parseInt(formData.exercise_duration),
          exercise_type: formData.exercise_type,
          exercise_intensity: Number.parseInt(formData.exercise_intensity),
        }
        submissionPromises.push(addHealthMetric(exerciseData, true)) // Suppress individual toasts
        submittedMetrics.push("exercise")
      }

      // Wait for all submissions to complete
      await Promise.all(submissionPromises)

      // Show a summary toast for all submitted metrics
      toastService.success(
        "Data Submitted Successfully",
        `Your ${submittedMetrics.join(", ")} data has been saved and can be viewed in your health history.`,
      )

      // Reset form
      resetForm()
    } catch (error) {
      console.error("Error adding health metrics:", error)
      toastService.error("Error Submitting Data", error instanceof Error ? error.message : "Failed to add health data")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      recorded_at: new Date().toISOString().slice(0, 16),
      notes: "",
      blood_glucose_level: "",
      measurement_context: "fasting",
      systolic_pressure: "",
      diastolic_pressure: "",
      heart_rate: "",
      weight_kg: "",
      a1c_percentage: "",
      exercise_duration: "",
      exercise_type: "walking",
      exercise_intensity: "5",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Add Health Metrics</h1>
          <p className="text-muted-foreground">Record all your health metrics in one place</p>
        </div>
        {!isMobile && (
          <Link href="/dashboard/health">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Health
            </Button>
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Common Date/Time and Notes Fields */}
        <Card className="border-border shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-teal-500" />
              Common Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recorded_at">Date & Time</Label>
              <Input
                id="recorded_at"
                name="recorded_at"
                type="datetime-local"
                value={formData.recorded_at}
                onChange={handleInputChange}
                required
              />
              <p className="text-xs text-muted-foreground">When the measurements were taken</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any additional information about these readings"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Blood Glucose Section */}
        <Card className={`border-2 ${metricTypeInfo.blood_glucose.color} shadow-sm rounded-xl overflow-hidden`}>
          <CardHeader
            className="bg-background/5 cursor-pointer flex flex-row items-center justify-between"
            onClick={() => toggleSection("blood_glucose")}
          >
            <CardTitle className="text-lg flex items-center gap-2">
              {metricTypeInfo.blood_glucose.icon}
              <span>{metricTypeInfo.blood_glucose.label}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={(e) => e.stopPropagation()}>
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{metricTypeInfo.blood_glucose.description}</p>
                    <p className="max-w-xs mt-1">Units: {metricTypeInfo.blood_glucose.units}</p>
                    <p className="max-w-xs mt-1">{metricTypeInfo.blood_glucose.normalRange}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {expandedSections.blood_glucose ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.blood_glucose && (
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blood_glucose_level">Blood Glucose Level (mg/dL)</Label>
                <Input
                  id="blood_glucose_level"
                  name="blood_glucose_level"
                  type="number"
                  step="0.1"
                  value={formData.blood_glucose_level}
                  onChange={handleInputChange}
                  placeholder="e.g., 120"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="measurement_context">Measurement Context</Label>
                <Select
                  value={formData.measurement_context}
                  onValueChange={(value) => handleSelectChange("measurement_context", value)}
                >
                  <SelectTrigger id="measurement_context">
                    <SelectValue placeholder="Select context" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fasting">Fasting</SelectItem>
                    <SelectItem value="before_meal">Before Meal</SelectItem>
                    <SelectItem value="after_meal">After Meal</SelectItem>
                    <SelectItem value="before_exercise">Before Exercise</SelectItem>
                    <SelectItem value="after_exercise">After Exercise</SelectItem>
                    <SelectItem value="bedtime">Bedtime</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Blood Pressure Section */}
        <Card className={`border-2 ${metricTypeInfo.blood_pressure.color} shadow-sm rounded-xl overflow-hidden`}>
          <CardHeader
            className="bg-background/5 cursor-pointer flex flex-row items-center justify-between"
            onClick={() => toggleSection("blood_pressure")}
          >
            <CardTitle className="text-lg flex items-center gap-2">
              {metricTypeInfo.blood_pressure.icon}
              <span>{metricTypeInfo.blood_pressure.label}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={(e) => e.stopPropagation()}>
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{metricTypeInfo.blood_pressure.description}</p>
                    <p className="max-w-xs mt-1">Units: {metricTypeInfo.blood_pressure.units}</p>
                    <p className="max-w-xs mt-1">{metricTypeInfo.blood_pressure.normalRange}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {expandedSections.blood_pressure ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.blood_pressure && (
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systolic_pressure">Systolic (mmHg)</Label>
                  <Input
                    id="systolic_pressure"
                    name="systolic_pressure"
                    type="number"
                    value={formData.systolic_pressure}
                    onChange={handleInputChange}
                    placeholder="e.g., 120"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diastolic_pressure">Diastolic (mmHg)</Label>
                  <Input
                    id="diastolic_pressure"
                    name="diastolic_pressure"
                    type="number"
                    value={formData.diastolic_pressure}
                    onChange={handleInputChange}
                    placeholder="e.g., 80"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Heart Rate Section */}
        <Card className={`border-2 ${metricTypeInfo.heart_rate.color} shadow-sm rounded-xl overflow-hidden`}>
          <CardHeader
            className="bg-background/5 cursor-pointer flex flex-row items-center justify-between"
            onClick={() => toggleSection("heart_rate")}
          >
            <CardTitle className="text-lg flex items-center gap-2">
              {metricTypeInfo.heart_rate.icon}
              <span>{metricTypeInfo.heart_rate.label}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={(e) => e.stopPropagation()}>
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{metricTypeInfo.heart_rate.description}</p>
                    <p className="max-w-xs mt-1">Units: {metricTypeInfo.heart_rate.units}</p>
                    <p className="max-w-xs mt-1">{metricTypeInfo.heart_rate.normalRange}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {expandedSections.heart_rate ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.heart_rate && (
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                <Input
                  id="heart_rate"
                  name="heart_rate"
                  type="number"
                  value={formData.heart_rate}
                  onChange={handleInputChange}
                  placeholder="e.g., 72"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Weight Section */}
        <Card className={`border-2 ${metricTypeInfo.weight.color} shadow-sm rounded-xl overflow-hidden`}>
          <CardHeader
            className="bg-background/5 cursor-pointer flex flex-row items-center justify-between"
            onClick={() => toggleSection("weight")}
          >
            <CardTitle className="text-lg flex items-center gap-2">
              {metricTypeInfo.weight.icon}
              <span>{metricTypeInfo.weight.label}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={(e) => e.stopPropagation()}>
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{metricTypeInfo.weight.description}</p>
                    <p className="max-w-xs mt-1">Units: {metricTypeInfo.weight.units}</p>
                    <p className="max-w-xs mt-1">{metricTypeInfo.weight.normalRange}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {expandedSections.weight ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.weight && (
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weight_kg">Weight (kg)</Label>
                <Input
                  id="weight_kg"
                  name="weight_kg"
                  type="number"
                  step="0.1"
                  value={formData.weight_kg}
                  onChange={handleInputChange}
                  placeholder="e.g., 70.5"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* A1C Section */}
        <Card className={`border-2 ${metricTypeInfo.a1c.color} shadow-sm rounded-xl overflow-hidden`}>
          <CardHeader
            className="bg-background/5 cursor-pointer flex flex-row items-center justify-between"
            onClick={() => toggleSection("a1c")}
          >
            <CardTitle className="text-lg flex items-center gap-2">
              {metricTypeInfo.a1c.icon}
              <span>{metricTypeInfo.a1c.label}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={(e) => e.stopPropagation()}>
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{metricTypeInfo.a1c.description}</p>
                    <p className="max-w-xs mt-1">Units: {metricTypeInfo.a1c.units}</p>
                    <p className="max-w-xs mt-1">{metricTypeInfo.a1c.normalRange}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {expandedSections.a1c ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.a1c && (
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="a1c_percentage">A1C Percentage (%)</Label>
                <Input
                  id="a1c_percentage"
                  name="a1c_percentage"
                  type="number"
                  step="0.1"
                  value={formData.a1c_percentage}
                  onChange={handleInputChange}
                  placeholder="e.g., 6.5"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Exercise Section */}
        <Card className={`border-2 ${metricTypeInfo.exercise.color} shadow-sm rounded-xl overflow-hidden`}>
          <CardHeader
            className="bg-background/5 cursor-pointer flex flex-row items-center justify-between"
            onClick={() => toggleSection("exercise")}
          >
            <CardTitle className="text-lg flex items-center gap-2">
              {metricTypeInfo.exercise.icon}
              <span>{metricTypeInfo.exercise.label}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={(e) => e.stopPropagation()}>
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{metricTypeInfo.exercise.description}</p>
                    <p className="max-w-xs mt-1">Units: {metricTypeInfo.exercise.units}</p>
                    <p className="max-w-xs mt-1">{metricTypeInfo.exercise.normalRange}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {expandedSections.exercise ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.exercise && (
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exercise_duration">Duration (minutes)</Label>
                <Input
                  id="exercise_duration"
                  name="exercise_duration"
                  type="number"
                  value={formData.exercise_duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exercise_type">Exercise Type</Label>
                <Select
                  value={formData.exercise_type}
                  onValueChange={(value) => handleSelectChange("exercise_type", value)}
                >
                  <SelectTrigger id="exercise_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walking">Walking</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="cycling">Cycling</SelectItem>
                    <SelectItem value="swimming">Swimming</SelectItem>
                    <SelectItem value="strength_training">Strength Training</SelectItem>
                    <SelectItem value="yoga">Yoga</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exercise_intensity">Intensity (1-10)</Label>
                <Select
                  value={formData.exercise_intensity}
                  onValueChange={(value) => handleSelectChange("exercise_intensity", value)}
                >
                  <SelectTrigger id="exercise_intensity">
                    <SelectValue placeholder="Select intensity" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} - {num <= 3 ? "Light" : num <= 6 ? "Moderate" : "Intense"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Submit Button */}
        <Alert className="bg-muted/30">
          <AlertDescription>
            Fill in the metrics you want to record. You can expand each section by clicking on it. At least one metric
            is required.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2 justify-end sticky bottom-0 bg-background p-4 border-t border-border -mx-4 -mb-4 md:static md:bg-transparent md:p-0 md:border-0 md:-mx-0 md:-mb-0">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isSubmitting}
            className="w-full md:w-auto"
          >
            Reset All
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-teal-500 hover:bg-teal-600 w-full md:w-auto">
            {isSubmitting ? (
              <>
                <span className="mr-2">Submitting...</span>
                <RefreshCw className="h-4 w-4 animate-spin" />
              </>
            ) : (
              "Submit All Data"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
