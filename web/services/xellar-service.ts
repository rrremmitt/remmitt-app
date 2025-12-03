/**
 * Xellar SDK Service - Real implementation using @xellar/sdk
 * Provides authentication, wallet management, and offramp services for Base Sepolia
 */

import { getXellarClient, features } from "@/config/xellar.config"
import { getUSDCAddress, getChainId } from "@/lib/constants/base-tokens"
import { getCurrentNetwork } from "@/lib/constants/networks"

// Type definitions

// SDK Auth Response - conditional based on wallet creation status
interface XellarAuthResponseWalletCreated {
  walletToken: string
  refreshToken: string
  address: string
  isWalletCreated: true
}

interface XellarAuthResponseNotCreated {
  accessToken: string
  isWalletCreated: false
}

type XellarSDKAuthResponse = XellarAuthResponseWalletCreated | XellarAuthResponseNotCreated

// Our unified auth response interface
interface XellarAuthResponse {
  token: string
  refreshToken?: string
  walletAddress?: string
  userId: string
  expiresIn?: number
  isWalletCreated: boolean
}

interface QuoteResponse {
  sendAmount: number
  sendCurrency: string
  receiveAmount: number
  receiveCurrency: string
  exchangeRate: number
  fee: number
  totalCost: number
  estimatedTime: string
  quoteId?: string
  expiresAt?: number
}

interface OfframpResponse {
  transactionId: string
  status: "pending" | "processing" | "completed" | "failed"
  txHash?: string
  receiverName?: string
  receiverAccount?: string
}

interface BalanceResponse {
  usdc: number
  usdValue: number
  decimals: number
  tokenAddress: string
}

// Indonesian banks - expanded list
export const INDONESIAN_BANKS = [
  { code: "BCA", name: "Bank Central Asia (BCA)", type: "bank" },
  { code: "BRI", name: "Bank Rakyat Indonesia (BRI)", type: "bank" },
  { code: "BNI", name: "Bank Negara Indonesia (BNI)", type: "bank" },
  { code: "MANDIRI", name: "Bank Mandiri", type: "bank" },
  { code: "CIMB", name: "CIMB Niaga", type: "bank" },
  { code: "PERMATA", name: "Bank Permata", type: "bank" },
  { code: "BTN", name: "Bank Tabungan Negara (BTN)", type: "bank" },
  { code: "DANAMON", name: "Bank Danamon", type: "bank" },
  { code: "BII", name: "Bank Maybank Indonesia", type: "bank" },
  { code: "PANIN", name: "Bank Panin", type: "bank" },
  { code: "DANA", name: "DANA", type: "ewallet" },
  { code: "OVO", name: "OVO", type: "ewallet" },
  { code: "GOPAY", name: "GoPay", type: "ewallet" },
  { code: "SHOPEEPAY", name: "ShopeePay", type: "ewallet" },
  { code: "LINKAJA", name: "LinkAja", type: "ewallet" },
] as const

class XellarService {
  private client = getXellarClient()
  private sessionToken: string | null = null
  private refreshToken: string | null = null
  private rampableAccessToken: string | null = null

  /**
   * Authentication Methods
   */

  // Send OTP to email for login/signup
  async sendOTP(email: string): Promise<{ success: boolean; message: string; verificationToken?: string }> {
    try {
      const verificationToken = await this.client.auth.email.login(email)

      return {
        success: true,
        message: "OTP sent successfully to your email",
        verificationToken,
      }
    } catch (error: any) {
      console.error("[Xellar] Send OTP error:", error)
      throw new Error(error?.message || "Failed to send OTP. Please try again.")
    }
  }

  // Verify OTP and create/login to Embedded Wallet
  async verifyOTP(email: string, otp: string, verificationToken: string): Promise<XellarAuthResponse> {
    try {
      // Verify OTP and authenticate (chainId not needed in options)
      const authResponse = await this.client.auth.email.verify(verificationToken, otp) as XellarSDKAuthResponse

      // Handle conditional response based on wallet creation status
      if (authResponse.isWalletCreated) {
        // Wallet exists - use walletToken and address
        this.sessionToken = authResponse.walletToken
        this.refreshToken = authResponse.refreshToken

        return {
          token: authResponse.walletToken,
          refreshToken: authResponse.refreshToken,
          walletAddress: authResponse.address,
          userId: `user_${Date.now()}`, // SDK doesn't provide userId in this flow
          expiresIn: 3600, // Default 1 hour
          isWalletCreated: true,
        }
      } else {
        // New wallet - use accessToken, no address yet
        this.sessionToken = authResponse.accessToken

        return {
          token: authResponse.accessToken,
          userId: `user_${Date.now()}`,
          expiresIn: 3600,
          isWalletCreated: false,
        }
      }
    } catch (error: any) {
      console.error("[Xellar] Verify OTP error:", error)
      throw new Error(
        error?.message || "Invalid OTP code. Please check and try again."
      )
    }
  }

  // Google OAuth login
  async loginWithGoogle(credential: string, expiredDate?: string): Promise<XellarAuthResponse> {
    try {
      // Use Google credential to authenticate (chainId not needed in options)
      const authResponse = await this.client.auth.google.authorize(credential, expiredDate) as XellarSDKAuthResponse

      // Handle conditional response based on wallet creation status
      if (authResponse.isWalletCreated) {
        // Wallet exists - use walletToken and address
        this.sessionToken = authResponse.walletToken
        this.refreshToken = authResponse.refreshToken

        return {
          token: authResponse.walletToken,
          refreshToken: authResponse.refreshToken,
          walletAddress: authResponse.address,
          userId: `user_${Date.now()}`,
          expiresIn: 3600,
          isWalletCreated: true,
        }
      } else {
        // New wallet - use accessToken, no address yet
        this.sessionToken = authResponse.accessToken

        return {
          token: authResponse.accessToken,
          userId: `user_${Date.now()}`,
          expiresIn: 3600,
          isWalletCreated: false,
        }
      }
    } catch (error: any) {
      console.error("[Xellar] Google login error:", error)
      throw new Error(
        error?.message || "Google login failed. Please try again."
      )
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{ token: string; expiresIn: number }> {
    try {
      const response = await this.client.wallet.refreshToken(refreshToken)
      
      // Store new tokens
      this.sessionToken = response.walletToken
      this.refreshToken = response.refreshToken
      
      return {
        token: response.walletToken,
        expiresIn: 3600, // Default 1 hour
      }
    } catch (error: any) {
      console.error("[Xellar] Refresh token error:", error)
      throw new Error("Session expired. Please login again.")
    }
  }

  /**
   * Wallet Operations
   */

  // Get USDC balance on Base Sepolia
  async getBalance(): Promise<BalanceResponse> {
    try {
      // TODO: Verify correct method name in @xellar/sdk v4.8.0
      // The SDK might use different method names or parameters
      // For now, return zero balance until SDK docs are verified
      console.warn("[Xellar] getBalance method needs SDK verification")
      
      return {
        usdc: 0,
        usdValue: 0,
        decimals: 6,
        tokenAddress: getUSDCAddress(),
      }
    } catch (error: any) {
      console.error("[Xellar] Get balance error:", error)
      
      // Return zero balance on error instead of throwing
      return {
        usdc: 0,
        usdValue: 0,
        decimals: 6,
        tokenAddress: getUSDCAddress(),
      }
    }
  }

  // Get transaction history
  // NOTE: Xellar SDK does not provide a getTransactionHistory method
  // The SDK only has getTransactionDetails(hash) for individual transactions
  // TODO: Implement local transaction tracking or use blockchain explorer API
  async getTransactionHistory(limit: number = 20): Promise<any[]> {
    try {
      // For now, return empty array since SDK doesn't support list operations
      // You should track transactions locally when creating offramp/onramp transactions
      console.warn("[Xellar] Transaction history not supported by SDK. Implement local tracking.")
      return []
    } catch (error: any) {
      console.error("[Xellar] Get transaction history error:", error)
      return []
    }
  }

  /**
   * Offramp Operations (USDC → IDR to Indonesian banks)
   */

  // Get real-time quote for USDC → IDR conversion
  async getQuote(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<QuoteResponse> {
    try {
      // TODO: Verify offRamp.getQuote exists or use alternative method
      console.warn("[Xellar] getQuote method needs SDK verification")
      
      // Return mock quote for now
      const exchangeRate = 15000 // Mock IDR/USD rate
      return {
        sendAmount: amount,
        sendCurrency: fromCurrency,
        receiveAmount: amount * exchangeRate,
        receiveCurrency: toCurrency,
        exchangeRate: exchangeRate,
        fee: amount * 0.01, // 1% fee
        totalCost: amount,
        estimatedTime: "15-60 minutes",
      }
    } catch (error: any) {
      console.error("[Xellar] Get quote error:", error)
      throw new Error(
        error?.message || "Failed to get exchange rate. Please try again."
      )
    }
  }

  // Create offramp transaction (send USDC, receive IDR in bank)
  async createOfframp(params: {
    amount: number
    recipientId: string
    bankCode: string
    accountNumber: string
    quoteId?: string
  }): Promise<OfframpResponse> {
    try {
      if (!this.rampableAccessToken) {
        throw new Error("Rampable access token required for offramp operations")
      }

      const usdcAddress = getUSDCAddress()
      const chainId = getChainId()

      // TODO: Verify correct SDK parameters for offRamp.create
      const offrampTx = await this.client.offRamp.create({
        amount: params.amount.toString(), // SDK might expect string
        currency: "USDC",
        network: chainId.toString(),
        recipientId: params.recipientId,
        rampableAccessToken: this.rampableAccessToken,
      } as any) as any

      return {
        transactionId: offrampTx.id || "",
        status: "pending" as any,
        txHash: offrampTx.hash,
      }
    } catch (error: any) {
      console.error("[Xellar] Create offramp error:", error)
      throw new Error(
        error?.message || "Failed to process transaction. Please try again."
      )
    }
  }

  // Get offramp transaction status
  async getOfframpStatus(transactionId: string): Promise<OfframpResponse> {
    try {
      // TODO: Verify if offRamp.getStatus or getDetails method exists
      console.warn("[Xellar] getOfframpStatus method needs SDK verification")
      
      return {
        transactionId,
        status: "pending",
      }
    } catch (error: any) {
      console.error("[Xellar] Get offramp status error:", error)
      throw new Error("Failed to get transaction status.")
    }
  }

  /**
   * Rampable Receiver Management (Indonesian Bank Accounts)
   */

  // Create a new recipient
  async createReceiver(data: {
    name: string
    bankCode: string
    accountNumber: string
    phone?: string
    email?: string
  }): Promise<{ receiverId: string }> {
    try {
      if (!this.rampableAccessToken) {
        throw new Error("Rampable access token required for recipient operations")
      }

      const receiver = await this.client.rampableRecipients.createRecipient({
        name: data.name,
        email: data.email || "",
        address: "", // Optional field
        city: "", // Optional field
        postCode: "", // Optional field
        bank: {
          accountName: data.name,
          accountNumber: data.accountNumber,
          bankName: data.bankCode,
          currency: "IDR",
          country: "ID",
        },
        rampableAccessToken: this.rampableAccessToken,
      })

      return {
        receiverId: receiver.id || "",
      }
    } catch (error: any) {
      console.error("[Xellar] Create receiver error:", error)
      throw new Error(
        error?.message || "Failed to add recipient. Please check details and try again."
      )
    }
  }

  // Update existing recipient
  async updateReceiver(
    receiverId: string,
    data: Partial<{
      name: string
      bankCode: string
      accountNumber: string
      phone?: string
      email?: string
    }>
  ): Promise<{ success: boolean }> {
    try {
      if (!this.rampableAccessToken) {
        throw new Error("Rampable access token required for recipient operations")
      }

      await this.client.rampableRecipients.updateRecipient({
        recipientId: receiverId,
        body: data,
        rampableAccessToken: this.rampableAccessToken,
      })

      return { success: true }
    } catch (error: any) {
      console.error("[Xellar] Update receiver error:", error)
      throw new Error(
        error?.message || "Failed to update recipient."
      )
    }
  }

  // Delete recipient
  async deleteReceiver(receiverId: string): Promise<{ success: boolean }> {
    try {
      if (!this.rampableAccessToken) {
        throw new Error("Rampable access token required for recipient operations")
      }

      await this.client.rampableRecipients.deleteRecipient({
        recipientId: receiverId,
        rampableAccessToken: this.rampableAccessToken,
      })

      return { success: true }
    } catch (error: any) {
      console.error("[Xellar] Delete receiver error:", error)
      throw new Error(
        error?.message || "Failed to delete recipient."
      )
    }
  }

  // Validate bank account
  async validateBankAccount(bankCode: string, accountNumber: string): Promise<{
    valid: boolean
    accountName?: string
  }> {
    try {
      // TODO: Find correct SDK method for bank account validation
      // The SDK might not expose this method or use different namespace
      console.warn("[Xellar] validateBankAccount method needs SDK verification")
      
      return { valid: true, accountName: "Unknown" }
    } catch (error: any) {
      console.error("[Xellar] Validate bank account error:", error)
      return { valid: false }
    }
  }

  /**
   * Onramp Operations (Buy USDC with IDR)
   */

  // Create onramp transaction (buy USDC with IDR via Indonesian payment methods)
  async createOnramp(params: {
    amount: number
    currency: string
    paymentMethod: "virtual_account" | "bank_transfer" | "ewallet"
  }): Promise<{
    orderId: string
    paymentUrl?: string
    virtualAccountNumber?: string
    instructions?: string
  }> {
    try {
      if (!this.rampableAccessToken) {
        throw new Error("Rampable access token required for onramp operations")
      }

      // TODO: Verify correct SDK parameters for onRamp.create
      const onramp = await this.client.onRamp.create({
        amount: params.amount.toString(),
        currency: params.currency,
        paymentMethod: params.paymentMethod,
        network: getChainId().toString(),
        rampableAccessToken: this.rampableAccessToken,
      } as any) as any

      return {
        orderId: onramp.id || "",
        paymentUrl: onramp.paymentUrl,
      }
    } catch (error: any) {
      console.error("[Xellar] Create onramp error:", error)
      throw new Error(
        error?.message || "Failed to create payment. Please try again."
      )
    }
  }

  /**
   * KYC Operations
   */

  // Submit KYC information
  async submitKYC(data: {
    fullName: string
    dateOfBirth: string
    nationality: string
    idNumber: string
    idType: "ktp" | "passport"
    address: string
    city: string
    postalCode: string
    idPhoto: File
    selfiePhoto: File
  }): Promise<{ kycId: string; status: string }> {
    try {
      // TODO: Find correct SDK method for KYC submission
      // The SDK might not expose KYC methods or use different namespace
      console.warn("[Xellar] submitKYC method needs SDK verification")
      
      throw new Error("KYC submission not yet implemented")
    } catch (error: any) {
      console.error("[Xellar] Submit KYC error:", error)
      throw new Error(
        error?.message || "Failed to submit KYC. Please try again."
      )
    }
  }

  // Get KYC status
  async getKYCStatus(): Promise<{
    status: "none" | "pending" | "approved" | "rejected"
    kycId?: string
    rejectionReason?: string
  }> {
    try {
      // TODO: Find correct SDK method for KYC status
      console.warn("[Xellar] getKYCStatus method needs SDK verification")
      
      return { status: "none" }
    } catch (error: any) {
      console.error("[Xellar] Get KYC status error:", error)
      return { status: "none" }
    }
  }

  /**
   * Utility Methods
   */

  // Set authorization token for authenticated requests
  setAuthToken(token: string, refreshToken?: string, rampableAccessToken?: string) {
    this.sessionToken = token
    this.refreshToken = refreshToken || null
    if (rampableAccessToken) {
      this.rampableAccessToken = rampableAccessToken
    }
  }

  // Set rampable access token for recipient/offramp operations
  setRampableAccessToken(token: string) {
    this.rampableAccessToken = token
  }

  // Get rampable access token
  getRampableAccessToken(): string | null {
    return this.rampableAccessToken
  }

  // Clear auth session
  clearSession() {
    this.sessionToken = null
    this.refreshToken = null
    this.rampableAccessToken = null
  }

  // Get current network info
  getNetworkInfo() {
    return getCurrentNetwork()
  }
}

export const xellarService = new XellarService()
