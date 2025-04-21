"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface QuickChatMessagesProps {
  onMessageClick: (message: string) => void
}

export function QuickChatMessages({ onMessageClick }: QuickChatMessagesProps) {
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
    <div className="mt-4 mb-2">
      <p className="text-xs text-slate-400 mb-2">Quick Questions:</p>
      <div className="flex flex-wrap gap-2">
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
              onClick={() => onMessageClick(msg.text)}
              className="text-xs bg-slate-800/50 border-slate-700 hover:bg-slate-700 hover:text-white text-slate-300 rounded-full px-3 py-1"
            >
              {msg.text}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
