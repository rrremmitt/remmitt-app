"use client"

import { useState } from "react"
import { BrutalCard } from "@/components/ui/brutal-card"
import { BrutalButton } from "@/components/ui/brutal-button"
import { BrutalInput } from "@/components/ui/brutal-input"
import { Users, Plus, Minus, ArrowRight } from "lucide-react"
import type { Recipient } from "@/store/recipient-store"

export interface BatchRecipientWithAmount {
  recipient: Recipient
  amount: number
}

interface BatchSendInputProps {
  recipients: Recipient[]
  selectedRecipients: Recipient[]
  maxAmount: number
  onToggleRecipient: (recipient: Recipient) => void
  onSetAmounts: (amounts: BatchRecipientWithAmount[]) => void
  onBack: () => void
  onContinue: () => void
}

export function BatchSendInput({
  recipients,
  selectedRecipients,
  maxAmount,
  onToggleRecipient,
  onSetAmounts,
  onBack,
  onContinue,
}: BatchSendInputProps) {
  const [amounts, setAmounts] = useState<Record<string, number>>({})
  const [equalAmount, setEqualAmount] = useState("")

  const handleSetEqualAmount = () => {
    const amount = parseFloat(equalAmount)
    if (isNaN(amount) || amount <= 0) return

    const newAmounts: Record<string, number> = {}
    selectedRecipients.forEach((r) => {
      newAmounts[r.id] = amount
    })
    setAmounts(newAmounts)
  }

  const handleAmountChange = (recipientId: string, value: string) => {
    const amount = parseFloat(value)
    setAmounts((prev) => ({
      ...prev,
      [recipientId]: isNaN(amount) ? 0 : amount,
    }))
  }

  const totalAmount = Object.values(amounts).reduce((sum, a) => sum + a, 0)
  const canContinue = selectedRecipients.length > 0 && totalAmount > 0 && totalAmount <= maxAmount

  const handleContinue = () => {
    const batchRecipients: BatchRecipientWithAmount[] = selectedRecipients
      .map((r) => ({
        recipient: r,
        amount: amounts[r.id] || 0,
      }))
      .filter((b) => b.amount > 0)

    onSetAmounts(batchRecipients)
    onContinue()
  }

  return (
    <div className="space-y-4">
      {/* Toggle Mode Button */}
      <BrutalButton
        variant="outline"
        className="w-full"
        onClick={onBack}
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Switch to Single Send
      </BrutalButton>

      {/* Info Card */}
      <BrutalCard className="bg-primary/10 border-primary">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-bold text-sm">Batch Send</p>
            <p className="text-xs text-muted-foreground">
              Send to multiple recipients in one transaction. Save up to 80% on gas fees.
            </p>
          </div>
        </div>
      </BrutalCard>

      {/* Selected Recipients */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold uppercase tracking-wide">
            Selected Recipients ({selectedRecipients.length})
          </label>
        </div>

        {selectedRecipients.length > 0 ? (
          <div className="space-y-2 mb-3">
            {selectedRecipients.map((recipient) => (
              <BrutalCard
                key={recipient.id}
                className="flex items-center gap-3 p-3"
              >
                <div className="w-8 h-8 border-2 border-foreground bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">{recipient.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{recipient.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {recipient.bankCode} • {recipient.accountNumber.slice(-4).padStart(recipient.accountNumber.length, "•")}
                  </p>
                </div>
                <BrutalButton
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleRecipient(recipient)}
                >
                  <Minus className="w-4 h-4" />
                </BrutalButton>
              </BrutalCard>
            ))}
          </div>
        ) : (
          <BrutalCard className="text-center py-4 text-sm text-muted-foreground">
            No recipients selected
          </BrutalCard>
        )}

        {/* Available Recipients */}
        {selectedRecipients.length < recipients.length && (
          <details className="mt-2">
            <summary className="text-sm font-bold cursor-pointer hover:text-primary">
              + Add more recipients
            </summary>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {recipients
                .filter((r) => !selectedRecipients.some((sr) => sr.id === r.id))
                .slice(0, 10)
                .map((recipient) => (
                  <BrutalCard
                    key={recipient.id}
                    className="flex items-center gap-3 p-2 cursor-pointer hover:bg-primary/5"
                    onClick={() => onToggleRecipient(recipient)}
                  >
                    <div className="w-8 h-8 border border-border bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">{recipient.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{recipient.name}</p>
                      <p className="text-xs text-muted-foreground">{recipient.bankCode}</p>
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </BrutalCard>
                ))}
            </div>
          </details>
        )}
      </div>

      {/* Amount Input */}
      {selectedRecipients.length > 0 && (
        <div className="space-y-3">
          {/* Equal Amount Option */}
          <BrutalCard className="p-3">
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Set Equal Amount for All
            </label>
            <div className="flex gap-2">
              <BrutalInput
                type="number"
                placeholder="Amount in USD"
                value={equalAmount}
                onChange={(e) => setEqualAmount(e.target.value)}
                step="0.01"
                min="0"
              />
              <BrutalButton
                variant="primary"
                onClick={handleSetEqualAmount}
                disabled={!equalAmount || parseFloat(equalAmount) <= 0}
              >
                Apply
              </BrutalButton>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total: ${((parseFloat(equalAmount) || 0) * selectedRecipients.length).toFixed(2)}
            </p>
          </BrutalCard>

          {/* Individual Amounts */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Individual Amounts
            </label>
            <div className="space-y-2">
              {selectedRecipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-24 truncate">
                    {recipient.name}
                  </span>
                  <BrutalInput
                    type="number"
                    placeholder="USD"
                    value={amounts[recipient.id] || ""}
                    onChange={(e) => handleAmountChange(recipient.id, e.target.value)}
                    step="0.01"
                    min="0"
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <BrutalCard className="p-3 bg-primary/5 border-primary">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold">Total Amount:</span>
              <span className="text-lg font-bold">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">Est. Gas Savings:</span>
              <span className="text-xs font-bold text-primary">
                ~{((selectedRecipients.length - 1) * 80).toFixed(0)}%
              </span>
            </div>
          </BrutalCard>
        </div>
      )}

      {/* Continue Button */}
      <BrutalButton
        variant="primary"
        className="w-full"
        size="lg"
        disabled={!canContinue}
        onClick={handleContinue}
      >
        Continue with {selectedRecipients.length} Recipient{selectedRecipients.length !== 1 ? "s" : ""}
        <ArrowRight className="w-5 h-5" />
      </BrutalButton>

      {/* Balance Info */}
      {maxAmount > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Available balance: ${maxAmount.toFixed(2)}
        </p>
      )}
    </div>
  )
}
