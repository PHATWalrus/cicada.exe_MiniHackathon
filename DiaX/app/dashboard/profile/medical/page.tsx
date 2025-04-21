"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchMedicalInfo, updateMedicalInfo } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function MedicalProfilePage() {
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
  const [originalData, setOriginalData] = useState({})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [hasMedicalProfile, setHasMedicalProfile] = useState(false)

  useEffect(() => {
    const loadMedicalInfo = async () => {
      try {
        const data = await fetchMedicalInfo()
        if (data) {
          setHasMedicalProfile(true)
          const medicalData = {
            diabetes_type: data.diabetes_type || "",
            diagnosis_year: data.diagnosis_year ? data.diagnosis_year.toString() : "",
            height_cm: data.height_cm ? data.height_cm.toString() : "",
            weight_kg: data.weight_kg ? data.weight_kg.toString() : "",
            target_glucose_min: data.target_glucose_min ? data.target_glucose_min.toString() : "",
            target_glucose_max: data.target_glucose_max ? data.target_glucose_max.toString() : "",
            medications: data.medications || "",
            allergies: data.allergies || "",
            comorbidities: data.comorbidities || "",
            notes: data.notes || "",
          }
          setFormData(medicalData)
          setOriginalData(medicalData)
        }
      } catch (error) {
        console.error("Error loading medical info:", error)
        // If 404, it means the user doesn't have a medical profile yet
        if (error instanceof Error && error.message.includes("404")) {
          setHasMedicalProfile(false)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadMedicalInfo()
  }, [])

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
    setSuccess("")
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
      setSuccess("Medical information updated successfully")
      setHasMedicalProfile(true)
      setOriginalData(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update medical information. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Medical Profile</h1>
        <p className="text-gray-600">
          {hasMedicalProfile
            ? "Update your medical information to get personalized advice"
            : "Complete your medical profile to get personalized advice"}
        </p>
      </div>

      <Tabs defaultValue="medical">
        <TabsList className="mb-4">
          <TabsTrigger value="account">
            <Link href="/dashboard/profile">Account</Link>
          </TabsTrigger>
          <TabsTrigger value="medical">Medical Information</TabsTrigger>
        </TabsList>

        <TabsContent value="medical">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
              <CardDescription>
                This information helps us provide personalized diabetes management advice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="diabetes_type">Diabetes Type</Label>
                  <Select
                    value={formData.diabetes_type}
                    onValueChange={(value) => handleSelectChange("diabetes_type", value)}
                  >
                    <SelectTrigger>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnosis_year">Year of Diagnosis</Label>
                  <Select
                    value={formData.diagnosis_year}
                    onValueChange={(value) => handleSelectChange("diagnosis_year", value)}
                  >
                    <SelectTrigger>
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height_cm">Height (cm)</Label>
                    <Input
                      id="height_cm"
                      name="height_cm"
                      type="number"
                      value={formData.height_cm}
                      onChange={handleChange}
                      placeholder="e.g., 175"
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
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_glucose_min">Target Glucose Min (mg/dL)</Label>
                    <Input
                      id="target_glucose_min"
                      name="target_glucose_min"
                      type="number"
                      value={formData.target_glucose_min}
                      onChange={handleChange}
                      placeholder="e.g., 70"
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
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea
                    id="medications"
                    name="medications"
                    value={formData.medications}
                    onChange={handleChange}
                    placeholder="List your current medications and dosages"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="List any allergies you have"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comorbidities">Other Health Conditions</Label>
                  <Textarea
                    id="comorbidities"
                    name="comorbidities"
                    value={formData.comorbidities}
                    onChange={handleChange}
                    placeholder="List any other health conditions you have"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any additional information you'd like to share"
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Saving..." : hasMedicalProfile ? "Update Information" : "Save Information"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
