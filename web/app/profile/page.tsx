"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Header } from "@/components/layout/header"
import { BrutalCard } from "@/components/ui/brutal-card"
import { BrutalButton } from "@/components/ui/brutal-button"
import { Mail, Shield, LogOut, ChevronRight, HelpCircle, FileText, Bell, Lock } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const kycStatusColors = {
    none: "bg-destructive",
    pending: "bg-primary",
    verified: "bg-accent",
  }

  const kycStatusLabels = {
    none: "Not Verified",
    pending: "Pending",
    verified: "Verified",
  }

  const menuItems = [
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: Lock, label: "Security", href: "#" },
    { icon: HelpCircle, label: "Help Center", href: "#" },
    { icon: FileText, label: "Terms & Privacy", href: "#" },
  ]

  return (
    <main className="min-h-screen bg-background pb-24">
      <Header title="Profile" showNotifications={false} />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* User Info */}
        <BrutalCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 border-3 border-foreground bg-primary flex items-center justify-center">
              <span className="text-2xl font-bold">{user.name?.charAt(0).toUpperCase() || "U"}</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">{user.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>
        </BrutalCard>

        {/* KYC Status */}
        <BrutalCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-foreground bg-card flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Identity Verification</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 ${kycStatusColors[user.kycStatus]}`} />
                  <span className="text-xs text-muted-foreground">{kycStatusLabels[user.kycStatus]}</span>
                </div>
              </div>
            </div>
            {user.kycStatus === "none" && (
              <BrutalButton size="sm" onClick={() => router.push("/profile/verify")}>
                Verify Now
              </BrutalButton>
            )}
          </div>
        </BrutalCard>

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item) => (
            <BrutalCard 
              key={item.label} 
              hover 
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() => item.href !== "#" && router.push(item.href)}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="font-bold text-sm">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </BrutalCard>
          ))}
        </div>

        {/* Logout */}
        <BrutalButton variant="danger" className="w-full" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Sign Out
        </BrutalButton>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground">Remitt v1.0.0 • Made with love for migrant workers</p>
      </div>

      <BottomNav />
    </main>
  )
}
