"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWalletStore } from "@/store/wallet-store"
import { xellarService } from "@/services/xellar-service"
import { BrutalCard } from "@/components/ui/brutal-card"
import { BrutalButton } from "@/components/ui/brutal-button"
import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Copy, CheckCircle2, Wallet, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CryptoDepositPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [walletAddress, setWalletAddress] = useState("")
  const [network, setNetwork] = useState("")
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadWalletInfo = async () => {
      try {
        const wallet = await xellarService.getWalletAddress()
        setWalletAddress(wallet.address)
        setNetwork(wallet.network)
      } catch (error) {
        console.error("Failed to load wallet:", error)
        toast({
          title: "Error",
          description: "Failed to load wallet information",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadWalletInfo()
  }, [toast])

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background pb-24">
        <Header title="Crypto Deposit" showBack />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-foreground border-t-transparent"></div>
          </div>
        </div>
        <BottomNav />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <Header title="Crypto Deposit" showBack />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Instructions */}
        <BrutalCard className="p-6 bg-primary">
          <div className="flex gap-3">
            <Wallet className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold mb-2">How to Deposit</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside opacity-90">
                <li>Copy your wallet address below</li>
                <li>Send USDC, USDT, or IDRX from your wallet</li>
                <li>Use <span className="font-bold">{network}</span> network</li>
                <li>Wait 1-2 minutes for confirmation</li>
              </ol>
            </div>
          </div>
        </BrutalCard>

        {/* Wallet Address Card */}
        <BrutalCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold uppercase text-sm">Your Wallet Address</h3>
            <div className="px-2 py-1 border-2 border-foreground bg-accent text-xs font-bold">
              {network}
            </div>
          </div>

          <div className="mb-4 p-4 bg-muted border-2 border-foreground break-all font-mono text-sm">
            {walletAddress}
          </div>

          <BrutalButton onClick={copyAddress} className="w-full" variant="secondary">
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Address
              </>
            )}
          </BrutalButton>
        </BrutalCard>

        {/* Supported Tokens */}
        <BrutalCard className="p-6">
          <h3 className="font-bold uppercase text-sm mb-4">Supported Tokens</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted">
              <div className="text-2xl">💵</div>
              <div className="flex-1">
                <p className="font-bold">USDC</p>
                <p className="text-xs text-muted-foreground">USD Coin</p>
              </div>
              <div className="text-xs font-bold text-muted-foreground">{network}</div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted">
              <div className="text-2xl">💲</div>
              <div className="flex-1">
                <p className="font-bold">USDT</p>
                <p className="text-xs text-muted-foreground">Tether USD</p>
              </div>
              <div className="text-xs font-bold text-muted-foreground">{network}</div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted">
              <div className="text-2xl">🇮🇩</div>
              <div className="flex-1">
                <p className="font-bold">IDRX</p>
                <p className="text-xs text-muted-foreground">Indonesian Rupiah Token</p>
              </div>
              <div className="text-xs font-bold text-muted-foreground">{network}</div>
            </div>
          </div>
        </BrutalCard>

        {/* Warning */}
        <BrutalCard className="p-4 bg-destructive/10 border-destructive">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-destructive mb-1">Important</p>
              <p className="text-muted-foreground">
                Only send tokens on <span className="font-bold">{network}</span> network. 
                Sending on wrong network may result in permanent loss of funds.
              </p>
            </div>
          </div>
        </BrutalCard>

        <BrutalButton onClick={() => router.push("/dashboard")} variant="outline" className="w-full">
          Done
        </BrutalButton>
      </div>

      <BottomNav />
    </main>
  )
}
