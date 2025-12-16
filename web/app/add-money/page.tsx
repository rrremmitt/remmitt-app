"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWalletStore } from "@/store/wallet-store"
import { BrutalCard } from "@/components/ui/brutal-card"
import { BrutalButton } from "@/components/ui/brutal-button"
import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { ArrowLeft, Wallet, CreditCard } from "lucide-react"

export default function AddMoneyPage() {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<"crypto" | "onramp" | null>(null)

  const handleMethodSelect = (method: "crypto" | "onramp") => {
    setSelectedMethod(method)
    if (method === "crypto") {
      router.push("/add-money/crypto")
    } else {
      router.push("/add-money/onramp")
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <Header title="Add Money" showBack />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Choose Payment Method</h1>
          <p className="text-sm text-muted-foreground">
            Select how you want to add funds to your wallet
          </p>
        </div>

        <div className="space-y-4">
          {/* Crypto Deposit Option */}
          <BrutalCard
            className="p-6 cursor-pointer hover:border-foreground/50 transition-colors"
            onClick={() => handleMethodSelect("crypto")}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 border-4 border-foreground bg-primary flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Crypto Deposit</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Send USDC, USDT, or IDRX directly from your wallet
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 border-2 border-foreground bg-card font-bold">
                    💵 USDC
                  </span>
                  <span className="text-xs px-2 py-1 border-2 border-foreground bg-card font-bold">
                    💲 USDT
                  </span>
                  <span className="text-xs px-2 py-1 border-2 border-foreground bg-card font-bold">
                    🇮🇩 IDRX
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-bold">⚡ Fast: 1-2 minutes</span>
                  <span>•</span>
                  <span className="font-bold">🌐 Base Network</span>
                </div>
              </div>
            </div>
          </BrutalCard>

          {/* Onramp Option */}
          <BrutalCard
            className="p-6 cursor-pointer hover:border-foreground/50 transition-colors"
            onClick={() => handleMethodSelect("onramp")}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 border-4 border-foreground bg-secondary flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Buy with IDR</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Purchase crypto with Indonesian Rupiah
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 border-2 border-foreground bg-card font-bold">
                    🏦 Bank Transfer
                  </span>
                  <span className="text-xs px-2 py-1 border-2 border-foreground bg-card font-bold">
                    💳 Virtual Account
                  </span>
                  <span className="text-xs px-2 py-1 border-2 border-foreground bg-card font-bold">
                    📱 E-Wallet
                  </span>
                  <span className="text-xs px-2 py-1 border-2 border-foreground bg-card font-bold">
                    📷 QRIS
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-bold">💰 Fee: 1.0% - 1.8%</span>
                  <span>•</span>
                  <span className="font-bold">⏱️ Instant - 2 hours</span>
                </div>
              </div>
            </div>
          </BrutalCard>
        </div>
      </div>

      <BottomNav />
    </main>
  )
}
