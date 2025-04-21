"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react"

interface CollapsibleQuickChatProps {
  onMessageClick: (message: string) => void
}

export function CollapsibleQuickChat({ onMessageClick }: CollapsibleQuickChatProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const commonMessages = [
    {
      text: "What's my blood sugar trend?",
      category: "stats",
    },
    {
      text: "How can I lower my A1C?",
      category: "advice",
    },
    {
      text: "What foods should I avoid?",
      category: "nutrition",
    },
    {
      text: "What are symptoms of low blood sugar?",
      category: "health",
    },
    {
      text: "What exercises are best for diabetes?",
      category: "activity",
    },
    {
      text: "How does stress affect diabetes?",
      category: "lifestyle",
    },
  ]

  return (
    <div className="w-full">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-300 rounded-full px-3 py-1 mb-2"
      >
        <div className="flex items-center">
          <MessageSquare className="h-3.5 w-3.5 mr-2" />
          <span className="text-xs">Quick Questions</span>
        </div>
        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 py-2">
              {commonMessages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onMessageClick(msg.text)
                      setIsExpanded(false) // Collapse after selection
                    }}
                    className="text-xs bg-slate-800/50 border-slate-700 hover:bg-slate-700 hover:text-white text-slate-300 rounded-full px-3 py-1"
                  >
                    {msg.text}
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
