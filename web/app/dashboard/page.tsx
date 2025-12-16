"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { useWalletStore } from "@/store/wallet-store"
import { useRecipientStore } from "@/store/recipient-store"
import { xellarService } from "@/services/xellar-service"
import { useXellarWallet } from "@/lib/hooks/useXellarWallet"
import { getCurrentNetwork } from "@/lib/constants/networks"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Header } from "@/components/layout/header"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { QuickSend } from "@/components/dashboard/quick-send"
import { TransactionList } from "@/components/dashboard/transaction-list"
import { BrutalCard } from "@/components/ui/brutal-card"
import { ArrowRight, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { totalUsdBalance, setBalances, transactions, setTransactions, isLoading, setLoading } = useWalletStore()
  const { recipients, selectRecipient } = useRecipientStore()
  const { balance, transactions: xellarTxs, refresh } = useXellarWallet()
  const [exchangeRate, setExchangeRate] = useState(15800)
  const network = getCurrentNetwork()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    const loadData = async () => {
      setLoading(true)
      try {
        // Use real balance from Xellar hook
        setBalances([
          {
            token: "USDC",
            symbol: "USDC",
            amount: balance.usdc,
            usdValue: balance.usdValue,
            network: network.displayName, // "Base Sepolia" or "Base"
          },
        ])

        // Load mock transactions (will be replaced with real ones from xellarTxs later)
        setTransactions([
          {
            id: "txn_1",
            type: "offramp",
            status: "completed",
            amount: 100,
            currency: "USD",
            fiatAmount: 1580000,
            fiatCurrency: "IDR",
            recipientName: "Siti Rahayu",
            recipientBank: "BCA",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            fee: 1.4,
            exchangeRate: 15800,
          },
          {
            id: "txn_2",
            type: "offramp",
            status: "completed",
            amount: 50,
            currency: "USD",
            fiatAmount: 790000,
            fiatCurrency: "IDR",
            recipientName: "Ahmad Wijaya",
            recipientBank: "BRI",
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            fee: 0.7,
            exchangeRate: 15800,
          },
        ])

        // Get current exchange rate from Xellar
        try {
          const quote = await xellarService.getQuote(100, "USDC", "IDR")
          setExchangeRate(quote.exchangeRate)
        } catch (error) {
          console.error("Failed to fetch exchange rate:", error)
          // Keep default rate on error
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated, router, setBalances, setTransactions, setLoading, balance.usdc, balance.usdValue, network.displayName])

  if (!isAuthenticated) {
    return null
  }

  const handleSelectRecipient = (recipient: (typeof recipients)[0]) => {
    selectRecipient(recipient)
    router.push("/send")
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <Header title={`Hi, ${user?.name?.split(" ")[0] || "there"}!`} />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Balance Card */}
        <BalanceCard balance={totalUsdBalance} onSend={() => router.push("/send")} onTopUp={() => router.push("/add-money")} />

        {/* Exchange Rate Banner */}
        <BrutalCard className="flex items-center justify-between p-3 bg-muted">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-sm">
              <span className="font-bold">1 USD</span>
              <span className="text-muted-foreground"> = </span>
              <span className="font-bold">{exchangeRate.toLocaleString()} IDR</span>
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Live rate</span>
        </BrutalCard>

        {/* KYC Alert */}
        {user?.kycStatus === "none" && (
          <BrutalCard className="flex items-start gap-3 p-3 bg-primary">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-sm">Complete Your Profile</p>
              <p className="text-xs opacity-80">Verify your identity to increase your transfer limits</p>
            </div>
            <Link href="/profile" className="font-bold text-sm underline">
              Verify
            </Link>
          </BrutalCard>
        )}

        {/* Quick Send */}
        <QuickSend
          recipients={recipients}
          onSelectRecipient={handleSelectRecipient}
          onAddNew={() => router.push("/send")}
        />

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wide">Recent Transfers</h3>
            <Link
              href="/history"
              className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              See All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <TransactionList transactions={transactions} limit={3} />
        </div>
      </div>

      <BottomNav />
    </main>
  )
}
