"use client"

import React from "react"

import { motion } from "framer-motion"

interface RegistrationProgressProps {
  currentStep: number
  steps: Array<{
    number: number
    label: string
  }>
}

export function RegistrationProgress({ currentStep, steps }: RegistrationProgressProps) {
  return (
    <div className="flex justify-between mt-6 px-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= step.number ? "bg-white text-cyan-600" : "bg-white/30 text-white"
              }`}
            >
              {step.number}
            </div>
            <span className={`text-xs mt-1 ${currentStep >= step.number ? "text-white" : "text-white/60"}`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 flex items-center px-2">
              <div className="h-1 w-full bg-white/30 rounded">
                <motion.div
                  className="h-1 bg-white rounded"
                  initial={{ width: "0%" }}
                  animate={{ width: currentStep > step.number ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
