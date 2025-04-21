"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { LogOut, HeartPulse, User, Menu } from "lucide-react"
import { useNavigationManager } from "@/lib/navigation-manager"
import { GlowMenu } from "@/components/glow-menu"
import { ScrollProgress } from "@/components/scroll-progress"
import { MobileMenu } from "@/components/mobile-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function DashboardHeader() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { navigateTo } = useNavigationManager()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Track scroll position to add shadow when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <ScrollProgress />
      <header
        className={cn(
          "sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md transition-all duration-200",
          scrolled ? "shadow-md" : "shadow-sm",
        )}
      >
        <div className="w-[90%] mx-auto">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full p-1.5">
                <HeartPulse className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                DiaX
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <GlowMenu />
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* User menu */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-full h-8 w-8 p-0">
                      <Avatar className="h-8 w-8 border border-cyan-500/20">
                        <AvatarImage src={user.avatar || ""} alt={user.name || "User"} />
                        <AvatarFallback className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-600 dark:text-cyan-400">
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigateTo("/dashboard/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  )
}
