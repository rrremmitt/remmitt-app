"use client"

import type * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { BrutalButton } from "@/components/ui/brutal-button"
import { BrutalInput } from "@/components/ui/brutal-input"
import { useAuthStore } from "@/store/auth-store"
import { xellarService } from "@/services/xellar-service"
import { Mail, ArrowRight, Shield } from "lucide-react"

export function EmailLogin() {
  const router = useRouter()
  const { setLoading, setOtpSent, login, isLoading, otpSent, otpEmail, verificationToken } = useAuthStore()

  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)
    try {
      const response = await xellarService.sendOTP(email)
      setOtpSent(true, email, response.verificationToken)
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    if (!verificationToken) {
      setError("Verification session expired. Please request a new code.")
      return
    }

    setLoading(true)
    try {
      const response = await xellarService.verifyOTP(otpEmail!, otp, verificationToken)

      // Set rampable access token if available
      if (response.rampableAccessToken) {
        xellarService.setRampableAccessToken(response.rampableAccessToken)
      }

      login(
        {
          id: response.userId,
          email: otpEmail!,
          name: otpEmail!.split("@")[0],
          walletAddress: response.walletAddress,
          walletStatus: response.walletStatus || "created",
          kycStatus: "none",
          createdAt: new Date().toISOString(),
        },
        response.token,
        response.refreshToken,
        response.expiresIn,
      )

      // Show warning if wallet is pending
      if (response.walletStatus === "pending") {
        console.warn("[Auth] Wallet creation pending. User can retry later.")
      }

      router.push("/dashboard")
    } catch (err: any) {
      setError(err?.message || "Invalid OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("Google login is not yet implemented in this demo. Please use email login.")
    // setLoading(true)
    // try {
    //   const response = await xellarService.loginWithGoogle(googleCredential, expiredDate)
    //
    //   login(
    //     {
    //       id: response.userId,
    //       email: "demo@remitt.app",
    //       name: "Demo User",
    //       walletAddress: response.walletAddress,
    //       kycStatus: "verified",
    //       createdAt: new Date().toISOString(),
    //     },
    //     response.token,
    //     response.refreshToken,
    //     response.expiresIn,
    //   )
    //
    //   router.push("/dashboard")
    // } catch (err: any) {
    //   setError(err?.message || "Failed to login with Google")
    // } finally {
    //   setLoading(false)
    // }
  }

  if (otpSent) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary border-3 border-foreground brutal-shadow mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold uppercase mb-2">Enter Code</h2>
          <p className="text-muted-foreground">
            {"We sent a 6-digit code to"} <span className="font-bold text-foreground">{otpEmail}</span>
          </p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <BrutalInput
            type="text"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-2xl tracking-[0.5em] font-mono"
            error={error}
            maxLength={6}
          />

          <BrutalButton type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Verify & Continue
            <ArrowRight className="w-5 h-5" />
          </BrutalButton>

          <button
            type="button"
            onClick={() => setOtpSent(false)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground underline"
          >
            Use a different email
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary border-3 border-foreground brutal-shadow mb-4">
          <Mail className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold uppercase mb-2">Sign In</h2>
        <p className="text-muted-foreground">Send money home in minutes</p>
      </div>

      <form onSubmit={handleSendOTP} className="space-y-4">
        <BrutalInput
          type="email"
          label="Email Address"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-5 h-5" />}
          error={error}
        />

        <BrutalButton type="submit" className="w-full" size="lg" isLoading={isLoading}>
          Continue with Email
          <ArrowRight className="w-5 h-5" />
        </BrutalButton>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-foreground" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-sm text-muted-foreground uppercase">Or</span>
        </div>
      </div>

      <BrutalButton variant="outline" className="w-full" size="lg" onClick={handleGoogleLogin} isLoading={isLoading}>
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </BrutalButton>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  )
}
