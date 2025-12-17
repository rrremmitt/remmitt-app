"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Bell } from "lucide-react"

interface HeaderProps {
  title: string
  showBack?: boolean
  showNotifications?: boolean
}

export function Header({ title, showBack = false, showNotifications = true }: HeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 bg-background border-b-3 border-foreground">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="w-10 h-10 border-2 border-foreground bg-card flex items-center justify-center brutal-shadow-sm brutal-hover"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-bold uppercase tracking-wide">{title}</h1>
        </div>

        {showNotifications && (
          <button 
            onClick={() => router.push("/notifications")}
            className="w-10 h-10 border-2 border-foreground bg-card flex items-center justify-center brutal-shadow-sm brutal-hover relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive border border-foreground" />
          </button>
        )}
      </div>
    </header>
  )
}
