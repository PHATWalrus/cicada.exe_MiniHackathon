"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useNavigationManager } from "@/lib/navigation-manager"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Home, Heart, MessageSquare, FileText, User, Activity, History, Plus } from "lucide-react"

export function GlowMenu() {
  const pathname = usePathname()
  const { preloadRoute } = useNavigationManager()

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/dashboard" legacyBehavior passHref>
            <NavigationMenuLink
              className={cn(
                navigationMenuTriggerStyle(),
                "bg-background hover:bg-accent/50 dark:bg-background dark:hover:bg-accent/50",
                pathname === "/dashboard" && "bg-accent/50 dark:bg-accent/50",
              )}
              onMouseEnter={() => preloadRoute("/dashboard")}
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              "bg-background hover:bg-accent/50 dark:bg-background dark:hover:bg-accent/50",
              pathname.includes("/dashboard/health") && "bg-accent/50 dark:bg-accent/50",
            )}
            onMouseEnter={() => preloadRoute("/dashboard/health")}
          >
            <Heart className="mr-2 h-4 w-4" />
            Health
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 w-[400px] md:grid-cols-2">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    href="/dashboard/health"
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-cyan-500/20 to-teal-500/20 p-6 no-underline outline-none focus:shadow-md"
                    onMouseEnter={() => preloadRoute("/dashboard/health")}
                  >
                    <Activity className="h-6 w-6 text-cyan-600" />
                    <div className="mb-2 mt-4 text-lg font-medium">Health Dashboard</div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      View your health metrics and track your progress
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <ListItem
                href="/dashboard/health/add"
                title="Add Health Data"
                icon={<Plus className="h-4 w-4 mr-2 text-cyan-600" />}
                onMouseEnter={() => preloadRoute("/dashboard/health/add")}
              >
                Record new health measurements
              </ListItem>
              <ListItem
                href="/dashboard/health/history"
                title="Health History"
                icon={<History className="h-4 w-4 mr-2 text-cyan-600" />}
                onMouseEnter={() => preloadRoute("/dashboard/health/history")}
              >
                View your historical health data
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link href="/dashboard/chat" legacyBehavior passHref>
            <NavigationMenuLink
              className={cn(
                navigationMenuTriggerStyle(),
                "bg-background hover:bg-accent/50 dark:bg-background dark:hover:bg-accent/50",
                pathname === "/dashboard/chat" && "bg-accent/50 dark:bg-accent/50",
              )}
              onMouseEnter={() => preloadRoute("/dashboard/chat")}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link href="/dashboard/resources" legacyBehavior passHref>
            <NavigationMenuLink
              className={cn(
                navigationMenuTriggerStyle(),
                "bg-background hover:bg-accent/50 dark:bg-background dark:hover:bg-accent/50",
                pathname === "/dashboard/resources" && "bg-accent/50 dark:bg-accent/50",
              )}
              onMouseEnter={() => preloadRoute("/dashboard/resources")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Resources
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link href="/dashboard/profile" legacyBehavior passHref>
            <NavigationMenuLink
              className={cn(
                navigationMenuTriggerStyle(),
                "bg-background hover:bg-accent/50 dark:bg-background dark:hover:bg-accent/50",
                pathname === "/dashboard/profile" && "bg-accent/50 dark:bg-accent/50",
              )}
              onMouseEnter={() => preloadRoute("/dashboard/profile")}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

interface ListItemProps extends React.ComponentPropsWithoutRef<"a"> {
  title: string
  icon?: React.ReactNode
  onMouseEnter?: () => void
}

const ListItem = React.forwardRef<React.ElementRef<"a">, ListItemProps>(
  ({ className, title, icon, children, onMouseEnter, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className,
            )}
            onMouseEnter={onMouseEnter}
            {...props}
          >
            <div className="flex items-center text-sm font-medium leading-none">
              {icon}
              {title}
            </div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    )
  },
)
ListItem.displayName = "ListItem"
