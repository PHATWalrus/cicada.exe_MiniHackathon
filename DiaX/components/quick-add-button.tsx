"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, X, Droplet, Activity, Heart, Scale, ClipboardList } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { usePathname } from "next/navigation"

export default function QuickAddButton() {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useMobile()
  const pathname = usePathname()

  // Don't show on the add metrics page
  if (!isMobile || pathname === "/dashboard/health/add" || pathname.includes("/dashboard/chat")) return null

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const quickAddOptions = [
    {
      name: "All Metrics",
      href: "/dashboard/health/add",
      icon: <ClipboardList className="h-4 w-4" />,
      color: "bg-teal-500 hover:bg-teal-600",
    },
    {
      name: "Blood Glucose",
      href: "/dashboard/health/add",
      icon: <Droplet className="h-4 w-4" />,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      name: "Blood Pressure",
      href: "/dashboard/health/add",
      icon: <Activity className="h-4 w-4" />,
      color: "bg-red-500 hover:bg-red-600",
    },
    {
      name: "Heart Rate",
      href: "/dashboard/health/add",
      icon: <Heart className="h-4 w-4" />,
      color: "bg-pink-500 hover:bg-pink-600",
    },
    {
      name: "Weight",
      href: "/dashboard/health/add",
      icon: <Scale className="h-4 w-4" />,
      color: "bg-green-500 hover:bg-green-600",
    },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-30">
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-2 items-end">
          {quickAddOptions.map((option, index) => (
            <div
              key={option.name}
              className="flex items-center gap-2 transition-all duration-300"
              style={{
                opacity: isOpen ? 1 : 0,
                transform: `translateY(${isOpen ? 0 : 20}px)`,
                transitionDelay: `${index * 50}ms`,
              }}
            >
              <div className="bg-background shadow-md rounded-lg px-3 py-2 text-sm font-medium">{option.name}</div>
              <Link href={option.href}>
                <Button
                  size="icon"
                  className={cn("rounded-full shadow-md", option.color)}
                  onClick={() => setIsOpen(false)}
                >
                  {option.icon}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          isOpen ? "bg-red-500 hover:bg-red-600 rotate-45" : "bg-teal-500 hover:bg-teal-600",
        )}
        onClick={toggleMenu}
      >
        {isOpen ? <X className="h-6 w-6" /> : <PlusCircle className="h-6 w-6" />}
      </Button>
    </div>
  )
}
