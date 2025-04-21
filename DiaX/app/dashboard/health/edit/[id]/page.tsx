"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label as UILable } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchHealthMetrics, updateHealthMetric } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Droplet, Activity, Heart, Scale, TrendingUp, Dumbbell, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditHealthMetric() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [metricType, setMetricType] = useState("")
  const [formData, setFormData] = useState({
    // Blood Glucose
    blood_glucose_level: "",
    measurement_context: "",

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
    exercise_type: "",
    exercise_intensity: "",

    // Common fields
    medication_notes: "",
    food_notes: "",
    carbs_grams: "",
    notes: "",
    recorded_at: "",
  })

  useEffect(() => {
    const loadMetric = async () => {
      try {
        setIsLoading(true)

        // Fetch the specific metric by ID
        // Note: This is a workaround since the API doesn't have a direct endpoint to get a single metric
        // In a real implementation, you would have a dedicated endpoint
        const data = await fetchHealthMetrics()

        if (data && data.metrics) {
          const metric = data.metrics.find((m: any) => m.id === Number(params.id))

          if (metric) {
            // Determine metric type
            if (metric.blood_glucose_level !== undefined) setMetricType("blood_glucose")
            else if (metric.systolic_pressure !== undefined) setMetricType("blood_pressure")
            else if (metric.heart_rate !== undefined && !metric.exercise_duration) setMetricType("heart_rate")
            else if (metric.weight_kg !== undefined) setMetricType("weight")
            else if (metric.a1c_percentage !== undefined) setMetricType("a1c")
            else if (metric.exercise_duration !== undefined) setMetricType("exercise")

            // Set form data
            setFormData({
              blood_glucose_level: metric.blood_glucose_level?.toString() || "",
              measurement_context: metric.measurement_context || "",
              systolic_pressure: metric.systolic_pressure?.toString() || "",
              diastolic_pressure: metric.diastolic_pressure?.toString() || "",
              heart_rate: metric.heart_rate?.toString() || "",
              weight_kg: metric.weight_kg?.toString() || "",
              a1c_percentage: metric.a1c_percentage?.toString() || "",
              exercise_duration: metric.exercise_duration?.toString() || "",
              exercise_type: metric.exercise_type || "",
              exercise_intensity: metric.exercise_intensity?.toString() || "",
              medication_notes: metric.medication_notes || "",
              food_notes: metric.food_notes || "",
              carbs_grams: metric.carbs_grams?.toString() || "",
              notes: metric.notes || "",
              recorded_at: new Date(metric.recorded_at).toISOString().slice(0, 16), // Format: YYYY-MM-DDThh:mm
            })
          } else {
            toast({
              title: "Error",
              description: "Metric not found",
              variant: "destructive",
            })
            router.push("/dashboard/health/history")
          }
        }
      } catch (error) {
        console.error("Error loading health metric:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load health metric",
          variant: "destructive",
        })
        router.push("/dashboard/health/history")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      loadMetric()
    }
  }, [params.id, router, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Prepare the data based on the metric type
      const metricData: any = {
        recorded_at: formData.recorded_at,
        notes: formData.notes,
      }

      // Add specific fields based on metric type
      switch (metricType) {
        case "blood_glucose":
          metricData.blood_glucose_level = Number.parseFloat(formData.blood_glucose_level)
          metricData.measurement_context = formData.measurement_context
          if (formData.food_notes) metricData.food_notes = formData.food_notes
          if (formData.carbs_grams) metricData.carbs_grams = Number.parseInt(formData.carbs_grams)
          if (formData.medication_notes) metricData.medication_notes = formData.medication_notes
          break

        case "blood_pressure":
          metricData.systolic_pressure = Number.parseInt(formData.systolic_pressure)
          metricData.diastolic_pressure = Number.parseInt(formData.diastolic_pressure)
          if (formData.heart_rate) metricData.heart_rate = Number.parseInt(formData.heart_rate)
          if (formData.medication_notes) metricData.medication_notes = formData.medication_notes
          break

        case "heart_rate":
          metricData.heart_rate = Number.parseInt(formData.heart_rate)
          if (formData.medication_notes) metricData.medication_notes = formData.medication_notes
          break

        case "weight":
          metricData.weight_kg = Number.parseFloat(formData.weight_kg)
          break

        case "a1c":
          metricData.a1c_percentage = Number.parseFloat(formData.a1c_percentage)
          if (formData.medication_notes) metricData.medication_notes = formData.medication_notes
          break

        case "exercise":
          metricData.exercise_duration = Number.parseInt(formData.exercise_duration)
          metricData.exercise_type = formData.exercise_type
          metricData.exercise_intensity = Number.parseInt(formData.exercise_intensity)
          if (formData.heart_rate) metricData.heart_rate = Number.parseInt(formData.heart_rate)
          break
      }

      // Submit the data
      await updateHealthMetric(Number(params.id), metricData)

      toast({
        title: "Success",
        description: "Health metric updated successfully",
        variant: "default",
      })

      // Redirect to the health history page
      router.push("/dashboard/health/history")
    } catch (error) {
      console.error("Error updating health metric:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update health metric",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  const getMetricIcon = () => {
    switch (metricType) {
      case "blood_glucose":
        return <Droplet className="h-5 w-5" />
      case "blood_pressure":
        return <Activity className="h-5 w-5" />
      case "heart_rate":
        return <Heart className="h-5 w-5" />
      case "weight":
        return <Scale className="h-5 w-5" />
      case "a1c":
        return <TrendingUp className="h-5 w-5" />
      case "exercise":
        return <Dumbbell className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const getMetricTitle = () => {
    switch (metricType) {
      case "blood_glucose":
        return "Blood Glucose"
      case "blood_pressure":
        return "Blood Pressure"
      case "heart_rate":
        return "Heart Rate"
      case "weight":
        return "Weight"
      case "a1c":
        return "A1C"
      case "exercise":
        return "Exercise"
      default:
        return "Health Metric"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/health/history">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit {getMetricTitle()}</h1>
      </div>

      <Card className="border-border shadow-sm rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="bg-teal-500/20 p-2 rounded-full">{getMetricIcon()}</div>
            <div>
              <CardTitle>Edit {getMetricTitle()}</CardTitle>
              <CardDescription>Update your health measurement</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common Date/Time Field */}
            <div className="space-y-2">
              <UILable htmlFor="recorded_at">Date & Time</UILable>
              <Input
                id="recorded_at"
                name="recorded_at"
                type="datetime-local"
                value={formData.recorded_at}
                onChange={handleInputChange}
                required
              />
              <p className="text-xs text-muted-foreground">When the measurement was taken</p>
            </div>

            {/* Blood Glucose Fields */}
            {metricType === "blood_glucose" && (
              <>
                <div className="space-y-2">
                  <UILable htmlFor="blood_glucose_level">Blood Glucose Level (mg/dL)</UILable>
                  <Input
                    id="blood_glucose_level"
                    name="blood_glucose_level"
                    type="number"
                    step="0.1"
                    value={formData.blood_glucose_level}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <UILable htmlFor="measurement_context">Measurement Context</UILable>
                  <Select
                    value={formData.measurement_context}
                    onValueChange={(value) => handleSelectChange("measurement_context", value)}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <UILable htmlFor="food_notes">Food Notes</UILable>
                  <Textarea
                    id="food_notes"
                    name="food_notes"
                    value={formData.food_notes}
                    onChange={handleInputChange}
                    placeholder="What did you eat?"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <UILable htmlFor="carbs_grams">Carbohydrates (grams)</UILable>
                  <Input
                    id="carbs_grams"
                    name="carbs_grams"
                    type="number"
                    value={formData.carbs_grams}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <UILable htmlFor="medication_notes">Medication Notes</UILable>
                  <Textarea
                    id="medication_notes"
                    name="medication_notes"
                    value={formData.medication_notes}
                    onChange={handleInputChange}
                    placeholder="Any medications taken?"
                    rows={2}
                  />
                </div>
              </>
            )}

            {/* Blood Pressure Fields */}
            {metricType === "blood_pressure" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <UILable htmlFor="systolic_pressure">Systolic (mmHg)</UILable>
                    <Input
                      id="systolic_pressure"
                      name="systolic_pressure"
                      type="number"
                      value={formData.systolic_pressure}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <UILable htmlFor="diastolic_pressure">Diastolic (mmHg)</UILable>
                    <Input
                      id="diastolic_pressure"
                      name="diastolic_pressure"
                      type="number"
                      value={formData.diastolic_pressure}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <UILable htmlFor="heart_rate">Heart Rate (bpm)</UILable>
                  <Input
                    id="heart_rate"
                    name="heart_rate"
                    type="number"
                    value={formData.heart_rate}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <UILable htmlFor="medication_notes">Medication Notes</UILable>
                  <Textarea
                    id="medication_notes"
                    name="medication_notes"
                    value={formData.medication_notes}
                    onChange={handleInputChange}
                    placeholder="Any medications taken?"
                    rows={2}
                  />
                </div>
              </>
            )}

            {/* Heart Rate Fields */}
            {metricType === "heart_rate" && (
              <>
                <div className="space-y-2">
                  <UILable htmlFor="heart_rate">Heart Rate (bpm)</UILable>
                  <Input
                    id="heart_rate"
                    name="heart_rate"
                    type="number"
                    value={formData.heart_rate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <UILable htmlFor="medication_notes">Medication Notes</UILable>
                  <Textarea
                    id="medication_notes"
                    name="medication_notes"
                    value={formData.medication_notes}
                    onChange={handleInputChange}
                    placeholder="Any medications taken?"
                    rows={2}
                  />
                </div>
              </>
            )}

            {/* Weight Fields */}
            {metricType === "weight" && (
              <>
                <div className="space-y-2">
                  <UILable htmlFor="weight_kg">Weight (kg)</UILable>
                  <Input
                    id="weight_kg"
                    name="weight_kg"
                    type="number"
                    step="0.1"
                    value={formData.weight_kg}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

            {/* A1C Fields */}
            {metricType === "a1c" && (
              <>
                <div className="space-y-2">
                  <UILable htmlFor="a1c_percentage">A1C Percentage (%)</UILable>
                  <Input
                    id="a1c_percentage"
                    name="a1c_percentage"
                    type="number"
                    step="0.1"
                    value={formData.a1c_percentage}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <UILable htmlFor="medication_notes">Medication Notes</UILable>
                  <Textarea
                    id="medication_notes"
                    name="medication_notes"
                    value={formData.medication_notes}
                    onChange={handleInputChange}
                    placeholder="Any medications taken?"
                    rows={2}
                  />
                </div>
              </>
            )}

            {/* Exercise Fields */}
            {metricType === "exercise" && (
              <>
                <div className="space-y-2">
                  <UILable htmlFor="exercise_duration">Duration (minutes)</UILable>
                  <Input
                    id="exercise_duration"
                    name="exercise_duration"
                    type="number"
                    value={formData.exercise_duration}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <UILable htmlFor="exercise_type">Exercise Type</UILable>
                  <Select
                    value={formData.exercise_type}
                    onValueChange={(value) => handleSelectChange("exercise_type", value)}
                  >
                    <SelectTrigger>
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
                  <UILable htmlFor="exercise_intensity">Intensity (1-10)</UILable>
                  <Select
                    value={formData.exercise_intensity}
                    onValueChange={(value) => handleSelectChange("exercise_intensity", value)}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <UILable htmlFor="heart_rate">Heart Rate (bpm)</UILable>
                  <Input
                    id="heart_rate"
                    name="heart_rate"
                    type="number"
                    value={formData.heart_rate}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
              </>
            )}

            {/* Common Notes Field */}
            <div className="space-y-2">
              <UILable htmlFor="notes">Additional Notes</UILable>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional information"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/health/history")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-teal-500 hover:bg-teal-600">
                {isSubmitting ? "Saving..." : "Update Metric"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
