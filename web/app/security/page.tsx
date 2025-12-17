"use client"

import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { BrutalCard } from "@/components/ui/brutal-card"
import { Shield, Lock, Key, Smartphone, AlertCircle, CheckCircle } from "lucide-react"

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background pb-24">
      <Header title="Security" showBack={true} />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Overview */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 border-3 border-foreground">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wide mb-2">Your Security</h1>
          <p className="text-muted-foreground">Protecting your money and data is our top priority</p>
        </div>

        {/* Security Score */}
        <BrutalCard className="p-6 text-center bg-primary">
          <h2 className="font-bold uppercase mb-4">Security Score</h2>
          <div className="text-4xl font-black mb-2">92%</div>
          <p className="text-sm opacity-90">Excellent Protection</p>
          <div className="w-full bg-foreground/20 rounded-full h-3 mt-4 border-2 border-foreground">
            <div className="bg-accent h-2.5 rounded-full border-2 border-foreground" style={{ width: '92%' }}></div>
          </div>
        </BrutalCard>

        {/* Security Features */}
        <div className="space-y-3">
          <h3 className="font-bold uppercase text-sm tracking-wide">Active Protections</h3>

          <BrutalCard className="flex items-center gap-3 p-4">
            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Extra layer of security for your account</p>
            </div>
          </BrutalCard>

          <BrutalCard className="flex items-center gap-3 p-4">
            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold">End-to-End Encryption</p>
              <p className="text-xs text-muted-foreground">Your data is protected with bank-level encryption</p>
            </div>
          </BrutalCard>

          <BrutalCard className="flex items-center gap-3 p-4">
            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Biometric Authentication</p>
              <p className="text-xs text-muted-foreground">Use fingerprint or Face ID to login</p>
            </div>
          </BrutalCard>

          <BrutalCard className="flex items-center gap-3 p-4">
            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Fraud Detection</p>
              <p className="text-xs text-muted-foreground">24/7 monitoring for suspicious activities</p>
            </div>
          </BrutalCard>
        </div>

        {/* Security Tips */}
        <div className="space-y-3">
          <h3 className="font-bold uppercase text-sm tracking-wide">Security Tips</h3>

          <BrutalCard className="p-4 bg-muted">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm mb-1">Never Share Your Password</p>
                <p className="text-xs text-muted-foreground">Remitt staff will never ask for your password or 2FA codes</p>
              </div>
            </div>
          </BrutalCard>

          <BrutalCard className="p-4 bg-muted">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm mb-1">Keep Your App Updated</p>
                <p className="text-xs text-muted-foreground">Always use the latest version for the best security</p>
              </div>
            </div>
          </BrutalCard>

          <BrutalCard className="p-4 bg-muted">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm mb-1">Use Strong, Unique Passwords</p>
                <p className="text-xs text-muted-foreground">Don't reuse passwords from other services</p>
              </div>
            </div>
          </BrutalCard>
        </div>

        {/* Warning Alert */}
        <BrutalCard className="p-4 border-3 border-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Suspicious Activity?</p>
              <p className="text-xs text-muted-foreground mt-1">
                If you notice any unauthorized transactions, contact us immediately at security@remitt.app
              </p>
            </div>
          </div>
        </BrutalCard>

        {/* Contact Security */}
        <BrutalCard className="p-4 bg-accent">
          <p className="font-bold text-center text-sm">
            Security Team Available 24/7
          </p>
          <p className="text-xs text-center mt-1">
            security@remitt.app
          </p>
        </BrutalCard>
      </div>

      <BottomNav />
    </main>
  )
}