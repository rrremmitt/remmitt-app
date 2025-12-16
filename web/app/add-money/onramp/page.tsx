"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { xellarService } from "@/services/xellar-service"
import { BrutalCard } from "@/components/ui/brutal-card"
import { BrutalButton } from "@/components/ui/brutal-button"
import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { CreditCard, Wallet as WalletIcon, Building2, QrCode, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Token = "USDC" | "USDT" | "IDRX"
type PaymentMethod = "virtual_account" | "ewallet" | "qris" | "bank_transfer"

export default function OnrampPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [selectedToken, setSelectedToken] = useState<Token>("USDC")
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const tokens: { id: Token; name: string; emoji: string }[] = [
    { id: "USDC", name: "USD Coin", emoji: "💵" },
    { id: "USDT", name: "Tether", emoji: "💲" },
    { id: "IDRX", name: "IDR Token", emoji: "🇮🇩" },
  ]

  const paymentMethods: { id: PaymentMethod; name: string; icon: any; fee: string }[] = [
    { id: "virtual_account", name: "Virtual Account", icon: Building2, fee: "1.0%" },
    { id: "ewallet", name: "E-Wallet (DANA/OVO)", icon: WalletIcon, fee: "1.5%" },
    { id: "qris", name: "QRIS", icon: QrCode, fee: "1.8%" },
    { id: "bank_transfer", name: "Bank Transfer", icon: CreditCard, fee: "1.2%" },
  ]

  const handleProceed = async () => {
    if (!amount || parseFloat(amount) < 10000) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is IDR 10,000",
        variant: "destructive",
      })
      return
    }

    if (!selectedMethod) {
      toast({
        title: "Select Payment Method",
        description: "Please choose a payment method",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const order = await xellarService.topUpViaOnramp({
        amount: parseFloat(amount),
        currency: "IDR",
        token: selectedToken,
        paymentMethod: selectedMethod,
      })

      toast({
        title: "Order Created",
        description: "Redirecting to payment...",
      })

      // In production, you would redirect to payment page or show payment instructions
      console.log("Order:", order)
      
      // For now, just go back to dashboard
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      console.error("Failed to create order:", error)
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateReceiveAmount = () => {
    if (!amount) return "0.00"
    const amountNum = parseFloat(amount)
    const rate = 15800 // Approximate USD to IDR rate
    return (amountNum / rate).toFixed(2)
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <Header title="Buy Crypto" showBack />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Info Banner */}
        <BrutalCard className="p-4 bg-primary">
          <div className="flex gap-3">
            <CreditCard className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold mb-1">Buy Crypto with IDR</p>
              <p className="opacity-90">
                Purchase crypto instantly using Indonesian payment methods
              </p>
            </div>
          </div>
        </BrutalCard>

        {/* Amount Input */}
        <BrutalCard className="p-6">
          <h3 className="font-bold uppercase text-sm mb-4">Amount to Pay (IDR)</h3>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10,000"
              className="w-full px-4 py-3 border-3 border-foreground text-2xl font-bold bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              min="10000"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
              IDR
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Minimum: IDR 10,000</p>

          {amount && (
            <div className="mt-4 p-3 bg-muted">
              <p className="text-xs text-muted-foreground mb-1">You will receive approximately</p>
              <p className="text-xl font-bold">{calculateReceiveAmount()} {selectedToken}</p>
            </div>
          )}
        </BrutalCard>

        {/* Token Selection */}
        <BrutalCard className="p-6">
          <h3 className="font-bold uppercase text-sm mb-4">Select Token</h3>
          <div className="grid grid-cols-3 gap-3">
            {tokens.map((token) => (
              <button
                key={token.id}
                onClick={() => setSelectedToken(token.id)}
                className={`p-3 border-3 border-foreground transition-colors ${
                  selectedToken === token.id
                    ? "bg-accent"
                    : "bg-card hover:bg-muted"
                }`}
              >
                <div className="text-2xl mb-1">{token.emoji}</div>
                <div className="font-bold text-sm">{token.id}</div>
              </button>
            ))}
          </div>
        </BrutalCard>

        {/* Payment Method Selection */}
        <BrutalCard className="p-6">
          <h3 className="font-bold uppercase text-sm mb-4">Payment Method</h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full p-4 border-3 border-foreground transition-colors flex items-center gap-3 ${
                    selectedMethod === method.id
                      ? "bg-accent"
                      : "bg-card hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm">{method.name}</p>
                    <p className="text-xs text-muted-foreground">Fee: {method.fee}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <div className="w-6 h-6 border-2 border-foreground bg-primary flex items-center justify-center">
                      <div className="w-3 h-3 bg-foreground"></div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </BrutalCard>

        {/* Warning */}
        <BrutalCard className="p-4 bg-muted border-foreground/30">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <p className="font-bold mb-1">Processing Time</p>
              <p>
                Virtual Account & E-Wallet: Instant<br />
                Bank Transfer: 1-2 hours<br />
                QRIS: Instant
              </p>
            </div>
          </div>
        </BrutalCard>

        {/* Action Buttons */}
        <div className="space-y-3">
          <BrutalButton
            onClick={handleProceed}
            disabled={!amount || !selectedMethod || isLoading}
            className="w-full"
          >
            {isLoading ? "Processing..." : "Proceed to Payment"}
          </BrutalButton>
          <BrutalButton
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            Cancel
          </BrutalButton>
        </div>
      </div>

      <BottomNav />
    </main>
  )
}
