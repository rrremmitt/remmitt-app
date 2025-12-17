"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { KYCVerificationForm } from "@/components/profile/kyc-verification-form"
import { useAuthStore } from "@/store/auth-store"
import type { KYCFormData } from "@/lib/types"
import { CheckCircle2 } from "lucide-react"

export default function VerifyPage() {
  const router = useRouter()
  const { updateUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (data: KYCFormData) => {
    setIsLoading(true)

    try {
      // Mock API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // TODO: Replace with actual Xellar API call when available
      // const response = await xellarService.submitKYC(data)

      // Update user KYC status to pending
      updateUser({ kycStatus: "pending" })

      // Show success state
      setIsSuccess(true)

      // Navigate back to profile after a short delay
      setTimeout(() => {
        router.push("/profile")
      }, 2000)
    } catch (error) {
      console.error("[KYC] Submission failed:", error)
      // In a real app, show error toast/message
      alert("Failed to submit KYC. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-background">
        <Header title="Verify Identity" showBack={false} />
        
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="border-3 border-foreground bg-accent/20 p-8 brutal-shadow-lg text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 mx-auto text-accent" />
            <h2 className="text-2xl font-bold uppercase">Submitted Successfully!</h2>
            <p className="text-muted-foreground">
              Your verification documents have been submitted for review.
              <br />
              We'll notify you once the review is complete.
            </p>
            <div className="pt-4">
              <div className="animate-pulse text-sm font-medium text-muted-foreground">
                Redirecting to profile...
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <Header title="Verify Identity" showBack />
      
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold uppercase mb-2">Identity Verification</h1>
          <p className="text-muted-foreground">
            Complete your KYC verification to unlock higher transaction limits and full access to
            all features.
          </p>
        </div>

        <KYCVerificationForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </main>
  )
}
