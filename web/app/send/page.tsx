"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { useWalletStore } from "@/store/wallet-store"
import { useRecipientStore, type Recipient } from "@/store/recipient-store"
import { xellarService } from "@/services/xellar-service"
import { getXellarClient } from "@/config/xellar.config"
import { executeBatchTransfer } from "@/lib/batch-contract"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Header } from "@/components/layout/header"
import { RecipientSelector } from "@/components/send/recipient-selector"
import { AddRecipientForm } from "@/components/send/add-recipient-form"
import { AmountInput } from "@/components/send/amount-input"
import { ConfirmationScreen } from "@/components/send/confirmation-screen"
import { SuccessScreen } from "@/components/send/success-screen"
import { BatchSendInput, type BatchRecipientWithAmount } from "@/components/send/batch-send-input"
import { BrutalButton } from "@/components/ui/brutal-button"
import { BrutalCard } from "@/components/ui/brutal-card"
import { ArrowRight, Users } from "lucide-react"

type Step = "recipient" | "add-recipient" | "amount" | "batch-amount" | "confirm" | "batch-confirm" | "success"

interface QuoteData {
  sendAmount: number
  receiveAmount: number
  exchangeRate: number
  fee: number
  estimatedTime: string
}

interface BatchQuoteData {
  sendAmount: number
  receiveAmounts: number[]
  totalReceiveAmount: number
  exchangeRate: number
  fee: number
  estimatedTime: string
  recipients: BatchRecipientWithAmount[]
}

export default function SendPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { totalUsdBalance, addTransaction } = useWalletStore()
  const {
    recipients,
    selectedRecipient,
    selectedRecipients,
    isBatchMode,
    selectRecipient,
    selectRecipients,
    addRecipient,
    toggleRecipientSelection,
    setBatchMode,
    clearBatchSelection,
  } = useRecipientStore()

  const [step, setStep] = useState<Step>("recipient")
  const [amount, setAmount] = useState(0)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [batchQuote, setBatchQuote] = useState<BatchQuoteData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionId, setTransactionId] = useState("")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    // If there's a pre-selected recipient, go to appropriate amount step
    if (isBatchMode && selectedRecipients.length > 0) {
      setStep("batch-amount")
    } else if (selectedRecipient) {
      setStep("amount")
    }
  }, [isAuthenticated, router, selectedRecipient, isBatchMode, selectedRecipients])

  const handleSelectRecipient = (recipient: Recipient) => {
    selectRecipient(recipient)
    setStep("amount")
  }

  const handleAddRecipient = (recipientData: Omit<Recipient, "id" | "createdAt">) => {
    const newRecipient: Recipient = {
      ...recipientData,
      id: `recv_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    addRecipient(newRecipient)
    selectRecipient(newRecipient)
    setStep("amount")
  }

  const handleAmountChange = useCallback((newAmount: number, newQuote: QuoteData | null) => {
    setAmount(newAmount)
    setQuote(newQuote)
  }, [])

  const handleConfirmTransfer = async () => {
    if (!selectedRecipient || !quote) return

    setIsProcessing(true)
    try {
      const response = await xellarService.createOfframp({
        amount,
        recipientId: selectedRecipient.id,
        bankCode: selectedRecipient.bankCode,
        accountNumber: selectedRecipient.accountNumber,
      })

      setTransactionId(response.transactionId)

      addTransaction({
        id: response.transactionId,
        type: "offramp",
        status: "processing",
        amount,
        currency: "USD",
        fiatAmount: quote.receiveAmount,
        fiatCurrency: "IDR",
        recipientName: selectedRecipient.name,
        recipientBank: selectedRecipient.bankCode,
        recipientAccount: selectedRecipient.accountNumber,
        createdAt: new Date().toISOString(),
        fee: quote.fee,
        exchangeRate: quote.exchangeRate,
        txHash: response.txHash,
      })

      setStep("success")
    } catch (error) {
      console.error("[v0] Transfer failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendAnother = () => {
    selectRecipient(null)
    clearBatchSelection()
    setAmount(0)
    setQuote(null)
    setBatchQuote(null)
    setStep("recipient")
  }

  const handleToggleBatchMode = (enabled: boolean) => {
    setBatchMode(enabled)
    if (enabled) {
      selectRecipient(null)
      setQuote(null)
    } else {
      clearBatchSelection()
      setBatchQuote(null)
    }
  }

  const handleSetBatchAmounts = (batchRecipients: BatchRecipientWithAmount[]) => {
    const totalAmount = batchRecipients.reduce((sum, b) => sum + b.amount, 0)
    const exchangeRate = 15000 // Mock IDR/USD rate - should come from API
    const fee = totalAmount * 0.01 // 1% fee

    const receiveAmounts = batchRecipients.map((b) => b.amount * exchangeRate)

    setBatchQuote({
      sendAmount: totalAmount,
      receiveAmounts,
      totalReceiveAmount: receiveAmounts.reduce((sum, a) => sum + a, 0),
      exchangeRate,
      fee,
      estimatedTime: "15-60 minutes",
      recipients: batchRecipients,
    })
  }

  const handleConfirmBatchTransfer = async () => {
    if (!batchQuote) return

    setIsProcessing(true)
    try {
      // Execute batch transfer via smart contract
      const xellarClient = getXellarClient()

      // Prepare recipients with wallet addresses
      // For testing, we'll use the recipient's ID as a mock wallet address
      // In production, recipients should have actual wallet addresses
      const recipients = batchQuote.recipients.map((item) => ({
        id: item.recipient.id,
        name: item.recipient.name,
        walletAddress: item.recipient.walletAddress || `0x${item.recipient.id.slice(0, 40).padEnd(40, "0")}` as `0x${string}`,
      }))

      const amounts = batchQuote.recipients.map((item) => item.amount)

      console.log("[Batch] Executing smart contract transfer:", {
        recipientCount: recipients.length,
        totalAmount: batchQuote.sendAmount,
      })

      // Execute batch transfer
      const result = await executeBatchTransfer(xellarClient, {
        recipients,
        amounts,
      })

      if (!result.success) {
        throw new Error(result.error || "Batch transfer failed")
      }

      // Add batch transaction record
      addTransaction({
        id: result.batchId,
        type: "send",
        status: "processing",
        amount: batchQuote.sendAmount,
        currency: "USD",
        fiatAmount: batchQuote.totalReceiveAmount,
        fiatCurrency: "IDR",
        recipientName: `${recipients.length} recipients`,
        createdAt: new Date().toISOString(),
        fee: batchQuote.fee,
        exchangeRate: batchQuote.exchangeRate,
        txHash: result.txHash,
      })

      setTransactionId(result.batchId)
      setStep("success")
    } catch (error: any) {
      console.error("[Batch] Transfer failed:", error)
      // Show error to user
      alert(error?.message || "Batch transfer failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  const renderStep = () => {
    switch (step) {
      case "recipient":
        return (
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <BrutalButton
                variant={!isBatchMode ? "primary" : "outline"}
                className="flex-1"
                onClick={() => handleToggleBatchMode(false)}
              >
                Single Send
              </BrutalButton>
              <BrutalButton
                variant={isBatchMode ? "primary" : "outline"}
                className="flex-1"
                onClick={() => handleToggleBatchMode(true)}
              >
                <Users className="w-4 h-4" />
                Batch Send
              </BrutalButton>
            </div>

            {isBatchMode ? (
              <BatchSendInput
                recipients={recipients}
                selectedRecipients={selectedRecipients}
                maxAmount={totalUsdBalance}
                onToggleRecipient={toggleRecipientSelection}
                onSetAmounts={handleSetBatchAmounts}
                onBack={() => handleToggleBatchMode(false)}
                onContinue={() => setStep("batch-confirm")}
              />
            ) : (
              <RecipientSelector
                recipients={recipients}
                onSelect={handleSelectRecipient}
                onAddNew={() => setStep("add-recipient")}
              />
            )}
          </div>
        )

      case "add-recipient":
        return <AddRecipientForm onAdd={handleAddRecipient} onCancel={() => setStep("recipient")} />

      case "batch-amount":
        return (
          <BatchSendInput
            recipients={recipients}
            selectedRecipients={selectedRecipients}
            maxAmount={totalUsdBalance}
            onToggleRecipient={toggleRecipientSelection}
            onSetAmounts={handleSetBatchAmounts}
            onBack={() => setStep("recipient")}
            onContinue={() => setStep("batch-confirm")}
          />
        )

      case "amount":
        return (
          <div className="space-y-4">
            {selectedRecipient && (
              <button
                onClick={() => {
                  selectRecipient(null)
                  setStep("recipient")
                }}
                className="flex items-center gap-3 w-full p-3 border-3 border-foreground bg-card brutal-shadow"
              >
                <div className="w-10 h-10 border-2 border-foreground bg-primary flex items-center justify-center">
                  <span className="font-bold">{selectedRecipient.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm">{selectedRecipient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedRecipient.bankCode} • ••••{selectedRecipient.accountNumber.slice(-4)}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">Change</span>
              </button>
            )}

            <AmountInput maxAmount={totalUsdBalance} onAmountChange={handleAmountChange} />

            <BrutalButton
              variant="primary"
              className="w-full"
              size="lg"
              disabled={!quote || amount <= 0}
              onClick={() => setStep("confirm")}
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </BrutalButton>
          </div>
        )

      case "confirm":
        if (!selectedRecipient || !quote) return null
        return (
          <ConfirmationScreen
            recipient={selectedRecipient}
            sendAmount={amount}
            receiveAmount={quote.receiveAmount}
            exchangeRate={quote.exchangeRate}
            fee={quote.fee}
            estimatedTime={quote.estimatedTime}
            onConfirm={handleConfirmTransfer}
            onBack={() => setStep("amount")}
            isLoading={isProcessing}
          />
        )

      case "batch-confirm":
        if (!batchQuote) return null
        return (
          <BrutalCard className="space-y-4">
            <h2 className="text-lg font-bold">Confirm Batch Transfer</h2>

            {/* Recipients List */}
            <div className="space-y-2">
              <p className="text-sm font-bold uppercase tracking-wide">Recipients ({batchQuote.recipients.length})</p>
              {batchQuote.recipients.map((item, index) => (
                <div key={item.recipient.id} className="flex justify-between items-center p-2 border border-border">
                  <div>
                    <p className="font-medium text-sm">{item.recipient.name}</p>
                    <p className="text-xs text-muted-foreground">{item.recipient.bankCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${item.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Rp {(item.amount * batchQuote.exchangeRate).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Send Amount</span>
                <span className="font-bold">${batchQuote.sendAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Receive Amount</span>
                <span className="font-bold">Rp {batchQuote.totalReceiveAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Exchange Rate</span>
                <span className="font-bold">1 USD = {batchQuote.exchangeRate.toLocaleString()} IDR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Fee (1%)</span>
                <span className="font-bold">${batchQuote.fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span>${(batchQuote.sendAmount + batchQuote.fee).toFixed(2)}</span>
              </div>
            </div>

            {/* Gas Savings Notice */}
            <BrutalCard className="bg-primary/10 border-primary text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-sm font-bold">Gas Savings: ~{((batchQuote.recipients.length - 1) * 80).toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">
                Estimated arrival: {batchQuote.estimatedTime}
              </p>
            </BrutalCard>

            {/* Actions */}
            <div className="flex gap-2">
              <BrutalButton
                variant="outline"
                className="flex-1"
                onClick={() => setStep("batch-amount")}
                disabled={isProcessing}
              >
                Back
              </BrutalButton>
              <BrutalButton
                variant="primary"
                className="flex-1"
                onClick={handleConfirmBatchTransfer}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Confirm Batch Send"}
              </BrutalButton>
            </div>
          </BrutalCard>
        )

      case "success":
        // Handle both single and batch success
        if (batchQuote) {
          return (
            <BrutalCard className="space-y-4 text-center py-6">
              <div className="w-16 h-16 mx-auto border-4 border-primary bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-xl font-bold">Batch Transfer Initiated!</h2>
              <p className="text-muted-foreground">
                {batchQuote.recipients.length} recipient{batchQuote.recipients.length !== 1 ? "s" : ""} will receive funds
              </p>

              <div className="border-t border-border pt-4 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span>Total Sent</span>
                  <span className="font-bold">${batchQuote.sendAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Transaction ID</span>
                  <span className="font-mono text-xs">{transactionId.slice(0, 16)}...</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Estimated Time</span>
                  <span>{batchQuote.estimatedTime}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <BrutalButton
                  variant="outline"
                  className="flex-1"
                  onClick={handleSendAnother}
                >
                  Send Another
                </BrutalButton>
                <BrutalButton
                  variant="primary"
                  className="flex-1"
                  onClick={() => router.push("/dashboard")}
                >
                  Dashboard
                </BrutalButton>
              </div>
            </BrutalCard>
          )
        }

        if (!selectedRecipient || !quote) return null
        return (
          <SuccessScreen
            transactionId={transactionId}
            recipientName={selectedRecipient.name}
            receiveAmount={quote.receiveAmount}
            estimatedTime={quote.estimatedTime}
            onSendAnother={handleSendAnother}
            onGoHome={() => router.push("/dashboard")}
          />
        )
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <Header
        title={step === "success" ? "Success" : "Send Money"}
        showBack={step !== "recipient" && step !== "success"}
      />

      <div className="max-w-lg mx-auto px-4 py-6">{renderStep()}</div>

      {step !== "success" && <BottomNav />}
    </main>
  )
}
