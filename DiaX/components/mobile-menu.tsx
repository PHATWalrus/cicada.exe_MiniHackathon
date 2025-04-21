"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Home,
  Heart,
  MessageSquare,
  FileText,
  User,
  LogOut,
  X,
  Plus,
  History,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    health: pathname?.includes("/dashboard/health") || false,
  })

  // Close menu when route changes
  useEffect(() => {
    if (isOpen) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  // Animation variants
  const menuVariants = {
    closed: {
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
      },
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    closed: { x: 20, opacity: 0 },
    open: { x: 0, opacity: 1 },
  }

  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 },
  }

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") {
      return true
    }
    return pathname !== "/dashboard" && pathname?.includes(path)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            onClick={onClose}
          />

          {/* Menu panel */}
          <motion.div
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl"
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-teal-500">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">DiaX</span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-slate-400 hover:text-white"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>
            </div>

            {/* User profile */}
            <div className="border-b border-slate-800 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-cyan-500/50">
                  <AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} />
                  <AvatarFallback className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-500">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{user?.name || "User"}</p>
                  <p className="text-xs text-slate-400">{user?.email || ""}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col overflow-y-auto pb-20">
              <nav className="flex-1 p-4">
                <ul className="space-y-2">
                  <motion.li variants={itemVariants}>
                    <Link
                      href="/dashboard"
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white",
                        isActive("/dashboard") && "bg-slate-800 text-white",
                      )}
                    >
                      <Home className="h-5 w-5" />
                      <span>Dashboard</span>
                    </Link>
                  </motion.li>

                  <motion.li variants={itemVariants}>
                    <div>
                      <button
                        onClick={() => toggleSection("health")}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white",
                          (isActive("/dashboard/health") || expandedSections.health) && "bg-slate-800 text-white",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Heart className="h-5 w-5" />
                          <span>Health</span>
                        </div>
                        {expandedSections.health ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedSections.health && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pl-8 pt-2"
                          >
                            <li className="mt-1">
                              <Link
                                href="/dashboard/health"
                                className={cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white",
                                  pathname === "/dashboard/health" && "bg-slate-800/50 text-white",
                                )}
                              >
                                <BarChart3 className="h-4 w-4" />
                                <span>Health Dashboard</span>
                              </Link>
                            </li>
                            <li className="mt-1">
                              <Link
                                href="/dashboard/health/add"
                                className={cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white",
                                  pathname === "/dashboard/health/add" && "bg-slate-800/50 text-white",
                                )}
                              >
                                <Plus className="h-4 w-4" />
                                <span>Add Health Data</span>
                              </Link>
                            </li>
                            <li className="mt-1">
                              <Link
                                href="/dashboard/health/history"
                                className={cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white",
                                  pathname === "/dashboard/health/history" && "bg-slate-800/50 text-white",
                                )}
                              >
                                <History className="h-4 w-4" />
                                <span>Health History</span>
                              </Link>
                            </li>
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.li>

                  <motion.li variants={itemVariants}>
                    <Link
                      href="/dashboard/chat"
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white",
                        isActive("/dashboard/chat") && "bg-slate-800 text-white",
                      )}
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span>Chat</span>
                    </Link>
                  </motion.li>

                  <motion.li variants={itemVariants}>
                    <Link
                      href="/dashboard/resources"
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white",
                        isActive("/dashboard/resources") && "bg-slate-800 text-white",
                      )}
                    >
                      <FileText className="h-5 w-5" />
                      <span>Resources</span>
                    </Link>
                  </motion.li>

                  <motion.li variants={itemVariants}>
                    <Link
                      href="/dashboard/profile"
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white",
                        isActive("/dashboard/profile") && "bg-slate-800 text-white",
                      )}
                    >
                      <User className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>
                  </motion.li>
                </ul>
              </nav>

              {/* Footer */}
              <div className="mt-auto border-t border-slate-800 p-4">
                <motion.div variants={itemVariants}>
                  <Button variant="destructive" className="w-full justify-start gap-3" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                    <span>Sign out</span>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
