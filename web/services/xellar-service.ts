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
  rampableAccessToken?: string
  walletStatus?: "pending" | "created" | "failed"
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

interface TokenInfo {
  symbol: "USDC" | "USDT" | "IDRX"
  name: string
  address: string
  decimals: number
  icon?: string
}

interface TopUpCryptoResponse {
  walletAddress: string
  network: string
  supportedTokens: TokenInfo[]
  instructions: string[]
}

interface OnrampOrderResponse {
  orderId: string
  paymentUrl?: string
  virtualAccountNumber?: string
  qrCode?: string
  instructions: string[]
  expiresAt?: string
  status: "pending" | "processing" | "completed" | "failed" | "expired"
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
  private walletAddress: string | null = null

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
        this.walletAddress = authResponse.address

        return {
          token: authResponse.walletToken,
          refreshToken: authResponse.refreshToken,
          walletAddress: authResponse.address,
          userId: `user_${Date.now()}`, // SDK doesn't provide userId in this flow
          expiresIn: 3600, // Default 1 hour
          isWalletCreated: true,
        }
      } else {
        // New user - create wallet automatically
        console.log("[Xellar] New user detected, creating wallet...")
        
        try {
          const walletData = await this.createWallet(authResponse.accessToken)
          
          return {
            token: walletData.walletToken,
            refreshToken: walletData.refreshToken,
            walletAddress: walletData.address,
            userId: `user_${Date.now()}`,
            expiresIn: 3600,
            isWalletCreated: true,
            rampableAccessToken: walletData.rampableAccessToken,
          }
        } catch (walletError: any) {
          console.error("[Xellar] Auto wallet creation failed:", walletError)
          
          // Allow login but mark wallet as pending
          this.sessionToken = authResponse.accessToken
          
          return {
            token: authResponse.accessToken,
            userId: `user_${Date.now()}`,
            expiresIn: 3600,
            isWalletCreated: false,
            walletStatus: "pending",
          }
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
        this.walletAddress = authResponse.address

        return {
          token: authResponse.walletToken,
          refreshToken: authResponse.refreshToken,
          walletAddress: authResponse.address,
          userId: `user_${Date.now()}`,
          expiresIn: 3600,
          isWalletCreated: true,
        }
      } else {
        // New user - create wallet automatically
        console.log("[Xellar] New user detected (Google), creating wallet...")
        
        try {
          const walletData = await this.createWallet(authResponse.accessToken, expiredDate)
          
          return {
            token: walletData.walletToken,
            refreshToken: walletData.refreshToken,
            walletAddress: walletData.address,
            userId: `user_${Date.now()}`,
            expiresIn: 3600,
            isWalletCreated: true,
            rampableAccessToken: walletData.rampableAccessToken,
          }
        } catch (walletError: any) {
          console.error("[Xellar] Auto wallet creation failed:", walletError)
          
          // Allow login but mark wallet as pending
          this.sessionToken = authResponse.accessToken
          
          return {
            token: authResponse.accessToken,
            userId: `user_${Date.now()}`,
            expiresIn: 3600,
            isWalletCreated: false,
            walletStatus: "pending",
          }
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

  // Create wallet for new users (when isWalletCreated = false)
  async createWallet(accessToken: string, expiredDate?: string): Promise<{
    walletToken: string
    refreshToken: string
    address: string
    rampableAccessToken?: string
  }> {
    try {
      console.log("[Xellar] Creating new wallet for user...")
      
      const walletResponse = await this.client.account.wallet.create({
        accessToken,
        expiredDate,
      })

      // Store tokens
      this.sessionToken = walletResponse.walletToken
      this.refreshToken = walletResponse.refreshToken
      if (walletResponse.rampableAccessToken) {
        this.rampableAccessToken = walletResponse.rampableAccessToken
      }

      // Extract first address from array
      const walletAddress = walletResponse.address && walletResponse.address.length > 0
        ? walletResponse.address[0].address
        : ""

      // Store wallet address for future use
      this.walletAddress = walletAddress

      if (!walletAddress) {
        throw new Error("Wallet created but no address returned")
      }

      console.log("[Xellar] Wallet created successfully:", walletAddress)

      return {
        walletToken: walletResponse.walletToken,
        refreshToken: walletResponse.refreshToken,
        address: walletAddress,
        rampableAccessToken: walletResponse.rampableAccessToken,
      }
    } catch (error: any) {
      console.error("[Xellar] Create wallet error:", error)
      throw new Error(
        error?.message || "Failed to create wallet. Please try again later."
      )
    }
  }

  // Retry wallet creation for users with pending wallet status
  async retryCreateWallet(): Promise<{
    success: boolean
    walletAddress?: string
    error?: string
  }> {
    try {
      if (!this.sessionToken) {
        throw new Error("No access token available. Please login again.")
      }

      const walletData = await this.createWallet(this.sessionToken)
      
      // Update stored tokens
      this.sessionToken = walletData.walletToken
      this.refreshToken = walletData.refreshToken
      if (walletData.rampableAccessToken) {
        this.rampableAccessToken = walletData.rampableAccessToken
      }

      return {
        success: true,
        walletAddress: walletData.address,
      }
    } catch (error: any) {
      console.error("[Xellar] Retry create wallet error:", error)
      return {
        success: false,
        error: error?.message || "Failed to create wallet",
      }
    }
  }

  // Get user's wallet address for receiving crypto deposits
  async getWalletAddress(): Promise<{
    address: string
    network: string
    chainId: number
  }> {
    try {
      if (!this.sessionToken) {
        throw new Error("Authentication required. Please login first.")
      }

      // If we have stored wallet address, return it immediately
      if (this.walletAddress) {
        console.log("[Xellar] Using stored wallet address:", this.walletAddress?.substring(0, 10) + "...")
        return {
          address: this.walletAddress,
          network: getCurrentNetwork().displayName,
          chainId: getChainId(),
        }
      }

      // Try to create wallet if user doesn't have one yet
      console.log("[Xellar] No stored address. Attempting to create/retrieve wallet...")
      try {
        const walletData = await this.createWallet(this.sessionToken)
        
        // Wallet created successfully, return the address
        console.log("[Xellar] Wallet created/retrieved:", walletData.address?.substring(0, 10) + "...")
        return {
          address: walletData.address,
          network: getCurrentNetwork().displayName,
          chainId: getChainId(),
        }
      } catch (walletError: any) {
        console.error("[Xellar] Auto wallet creation/retrieval failed:", walletError)
        throw new Error("Unable to retrieve wallet address. Please log out and log in again.")
      }
    } catch (error: any) {
      console.error("[Xellar] Get wallet address error:", error)
      throw new Error(
        error?.message || "Failed to retrieve wallet address. Please ensure your wallet is created."
      )
    }
  }

  /**
   * Top-Up Operations
   */

  // Get supported tokens for deposits
  private getSupportedTokens(): TokenInfo[] {
    const usdcAddress = getUSDCAddress()
    
    return [
      {
        symbol: "USDC",
        name: "USD Coin",
        address: usdcAddress,
        decimals: 6,
        icon: "💵",
      }
      // {
      //   symbol: "USDT",
      //   name: "Tether USD",
      //   address: usdcAddress, // TODO: Add actual USDT address for Base Sepolia
      //   decimals: 6,
      //   icon: "💲",
      // },
      // {
      //   symbol: "IDRX",
      //   name: "Indonesian Rupiah Token",
      //   address: usdcAddress, // TODO: Add actual IDRX address for Base Sepolia
      //   decimals: 2,
      //   icon: "🇮🇩",
      // },
    ]
  }

  // Top up from external crypto wallet (supports USDC, USDT, IDRX)
  async topUpFromCrypto(): Promise<TopUpCryptoResponse> {
    try {
      const walletInfo = await this.getWalletAddress()
      const supportedTokens = this.getSupportedTokens()

      return {
        walletAddress: walletInfo.address,
        network: walletInfo.network,
        supportedTokens,
        instructions: [
          "Send tokens from any wallet (MetaMask, Coinbase, Trust Wallet, etc.)",
          `Network: ${walletInfo.network} (Base Sepolia Testnet)`,
          `Your Wallet Address: ${walletInfo.address}`,
          "",
          "✅ Supported Tokens:",
          ...supportedTokens.map(token => 
            `  ${token.icon} ${token.symbol} - ${token.name} (${token.address})`
          ),
          "",
          "⏱️ Processing Time:",
          "  • USDC: 1-2 minutes",
          "  • USDT: 1-2 minutes",
          "  • IDRX: 1-2 minutes",
          "",
          "⚠️ IMPORTANT:",
          "  • Only send tokens on Base Sepolia network",
          "  • Double-check the token contract address",
          "  • Other tokens or networks will result in loss of funds",
          "  • Minimum deposit: 1 USDC/USDT or 15,000 IDRX",
        ],
      }
    } catch (error: any) {
      console.error("[Xellar] Top up from crypto error:", error)
      throw new Error(
        error?.message || "Failed to get deposit instructions."
      )
    }
  }

  // Top up via onramp (buy crypto with IDR - Indonesian payment methods)
  async topUpViaOnramp(params: {
    amount: number
    currency: string
    token: "USDC" | "USDT" | "IDRX"
    paymentMethod: "virtual_account" | "bank_transfer" | "ewallet" | "qris"
    bankCode?: string
  }): Promise<OnrampOrderResponse> {
    try {
      // TODO: This is a placeholder implementation
      // Once Xellar SDK onramp is verified, update with actual SDK call
      console.warn("[Xellar] topUpViaOnramp - Using placeholder implementation")
      
      if (!this.rampableAccessToken) {
        throw new Error("Rampable access token required for onramp operations")
      }

      // Generate mock order ID for now
      const orderId = `onramp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Calculate crypto amount based on token
      let exchangeRate: number
      let tokenAmount: number
      
      switch (params.token) {
        case "USDC":
        case "USDT":
          exchangeRate = 15750 // 1 USD = 15,750 IDR
          tokenAmount = params.amount / exchangeRate
          break
        case "IDRX":
          exchangeRate = 1 // 1 IDRX = 1 IDR
          tokenAmount = params.amount
          break
        default:
          throw new Error("Unsupported token")
      }

      const fee = params.amount * 0.015 // 1.5% fee

      const instructions: string[] = [
        `💰 Amount to pay: ${params.currency} ${params.amount.toLocaleString()}`,
        `📥 You will receive: ${tokenAmount.toFixed(params.token === "IDRX" ? 0 : 2)} ${params.token}`,
        `💵 Fee: ${params.currency} ${fee.toLocaleString()} (1.5%)`,
        "",
      ]

      // Add payment method specific instructions
      switch (params.paymentMethod) {
        case "virtual_account":
          instructions.push(
            "📱 Virtual Account Payment:",
            "1. Copy the virtual account number below",
            "2. Open your mobile banking app",
            "3. Select transfer to virtual account",
            "4. Enter the VA number and amount",
            "5. Complete payment within 24 hours",
            "6. Tokens credited automatically after confirmation",
            "",
            `💳 VA Number: 8808${Math.random().toString().slice(2, 14)}`,
            `🏦 Bank: ${params.bankCode || "Any Indonesian Bank"}`,
            "⏱️ Processing: Instant - 5 minutes"
          )
          break
        case "bank_transfer":
          instructions.push(
            "🏦 Bank Transfer:",
            "1. Transfer to the account below",
            "2. Include the unique code: " + Math.floor(100 + Math.random() * 900),
            "3. Send proof of transfer (optional)",
            "4. Processing time: 1-2 hours after confirmation",
            "",
            "📝 Bank Details:",
            "  Account Name: Remmit Indonesia",
            "  Bank: BCA",
            "  Account: 1234567890"
          )
          break
        case "ewallet":
          instructions.push(
            "📲 E-Wallet Payment:",
            "1. Click the payment link below",
            "2. You'll be redirected to your e-wallet app",
            "3. Confirm payment in the app",
            "4. Return to Remmit to see your balance",
            "",
            `💰 Wallet: ${params.bankCode || "DANA/OVO/GoPay/ShopeePay"}`,
            "⏱️ Processing: Instant"
          )
          break
        case "qris":
          instructions.push(
            "📷 QRIS Payment:",
            "1. Open any banking app with QRIS",
            "2. Scan the QR code below",
            "3. Confirm the amount",
            "4. Complete payment",
            "",
            "⏱️ Processing: Instant - 1 minute",
            "💡 Works with: All Indonesian banking apps"
          )
          break
      }

      instructions.push(
        "",
        "⚡ After Payment:",
        `  • ${params.token} will appear in your balance`,
        "  • Check transaction history for status",
        "  • Contact support if delayed > 1 hour"
      )

      // Return placeholder response
      return {
        orderId,
        paymentUrl: `https://payment.example.com/order/${orderId}`,
        virtualAccountNumber: params.paymentMethod === "virtual_account" 
          ? `8808${Math.random().toString().slice(2, 14)}`
          : undefined,
        qrCode: params.paymentMethod === "qris"
          ? `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`
          : undefined,
        instructions,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
      }

      /* TODO: Replace with actual SDK call once verified:
      const onrampOrder = await this.client.onRamp.create({
        amount: params.amount.toString(),
        currency: params.currency,
        token: params.token,
        paymentMethod: params.paymentMethod,
        network: getChainId().toString(),
        bankCode: params.bankCode,
        rampableAccessToken: this.rampableAccessToken,
      })

      return {
        orderId: onrampOrder.id,
        paymentUrl: onrampOrder.paymentUrl,
        virtualAccountNumber: onrampOrder.virtualAccountNumber,
        qrCode: onrampOrder.qrCode,
        instructions: onrampOrder.instructions || [],
        expiresAt: onrampOrder.expiresAt,
        status: onrampOrder.status,
      }
      */
    } catch (error: any) {
      console.error("[Xellar] Top up via onramp error:", error)
      throw new Error(
        error?.message || "Failed to create payment. Please try again."
      )
    }
  }

  // Get onramp order status
  async getOnrampStatus(orderId: string): Promise<{
    orderId: string
    status: "pending" | "processing" | "completed" | "failed" | "expired"
    amount?: number
    currency?: string
    token?: string
    tokenAmount?: number
    transactionHash?: string
    createdAt?: string
    completedAt?: string
    paymentMethod?: string
  }> {
    try {
      // TODO: Replace with actual SDK call once verified
      console.warn("[Xellar] getOnrampStatus - Using placeholder implementation")

      // Return placeholder status
      return {
        orderId,
        status: "pending",
        amount: 150000,
        currency: "IDR",
        token: "USDC",
        tokenAmount: 10,
        createdAt: new Date().toISOString(),
        paymentMethod: "virtual_account",
      }

      /* TODO: Replace with actual SDK call:
      const order = await this.client.onRamp.getStatus({
        orderId,
        rampableAccessToken: this.rampableAccessToken,
      })

      return {
        orderId: order.id,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        token: order.token,
        tokenAmount: order.cryptoAmount,
        transactionHash: order.txHash,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
        paymentMethod: order.paymentMethod,
      }
      */
    } catch (error: any) {
      console.error("[Xellar] Get onramp status error:", error)
      throw new Error(
        error?.message || "Failed to get payment status."
      )
    }
  }

  // List available payment methods for onramp
  async getAvailablePaymentMethods(currency: string = "IDR"): Promise<{
    methods: Array<{
      type: "virtual_account" | "bank_transfer" | "ewallet" | "qris"
      name: string
      description: string
      banks?: string[]
      minAmount: number
      maxAmount: number
      processingTime: string
      fee: string
      supportedTokens: Array<"USDC" | "USDT" | "IDRX">
    }>
  }> {
    try {
      // Return Indonesian payment methods
      return {
        methods: [
          {
            type: "virtual_account",
            name: "Virtual Account",
            description: "Instant bank transfer via virtual account number",
            banks: ["BCA", "BNI", "BRI", "Mandiri", "Permata", "CIMB"],
            minAmount: 50000, // 50k IDR
            maxAmount: 10000000, // 10M IDR
            processingTime: "Instant - 5 minutes",
            fee: "1.5%",
            supportedTokens: ["USDC", "USDT", "IDRX"],
          },
          {
            type: "ewallet",
            name: "E-Wallet",
            description: "Pay with popular Indonesian e-wallets",
            banks: ["DANA", "OVO", "GoPay", "ShopeePay", "LinkAja"],
            minAmount: 10000, // 10k IDR
            maxAmount: 5000000, // 5M IDR
            processingTime: "Instant",
            fee: "1.8%",
            supportedTokens: ["USDC", "USDT", "IDRX"],
          },
          {
            type: "qris",
            name: "QRIS",
            description: "Scan QR code with any banking app",
            minAmount: 10000, // 10k IDR
            maxAmount: 2000000, // 2M IDR
            processingTime: "Instant - 1 minute",
            fee: "1.2%",
            supportedTokens: ["USDC", "USDT", "IDRX"],
          },
          {
            type: "bank_transfer",
            name: "Bank Transfer",
            description: "Manual bank transfer (any Indonesian bank)",
            banks: ["All Indonesian Banks"],
            minAmount: 100000, // 100k IDR
            maxAmount: 50000000, // 50M IDR
            processingTime: "1-2 hours",
            fee: "1.0%",
            supportedTokens: ["USDC", "USDT", "IDRX"],
          },
        ],
      }
    } catch (error: any) {
      console.error("[Xellar] Get payment methods error:", error)
      throw new Error(
        error?.message || "Failed to get payment methods."
      )
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
  setAuthToken(token: string, refreshToken?: string, rampableAccessToken?: string, walletAddress?: string) {
    this.sessionToken = token
    this.refreshToken = refreshToken || null
    if (rampableAccessToken) {
      this.rampableAccessToken = rampableAccessToken
    }
    if (walletAddress) {
      this.walletAddress = walletAddress
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
    this.walletAddress = null
  }

  // Get current network info
  getNetworkInfo() {
    return getCurrentNetwork()
  }
}

export const xellarService = new XellarService()
