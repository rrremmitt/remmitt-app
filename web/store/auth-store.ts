import { create } from "zustand"
import { persist } from "zustand/middleware"
import { xellarService } from "@/services/xellar-service"

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  walletAddress?: string
  walletStatus?: "pending" | "created" | "failed"
  kycStatus: "none" | "pending" | "verified" | "rejected"
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  tokenExpiresAt: number | null
  isAuthenticated: boolean
  isLoading: boolean
  otpSent: boolean
  otpEmail: string | null
  verificationToken: string | null

  // Actions
  setUser: (user: User | null) => void
  setToken: (token: string | null, refreshToken?: string | null, expiresIn?: number) => void
  setLoading: (loading: boolean) => void
  setOtpSent: (sent: boolean, email?: string, verificationToken?: string) => void
  login: (user: User, token: string, refreshToken?: string, expiresIn?: number) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  refreshSession: () => Promise<boolean>
  checkTokenExpiry: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
      isLoading: false,
      otpSent: false,
      otpEmail: null,
      verificationToken: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token, refreshToken, expiresIn) => {
        const tokenExpiresAt = expiresIn 
          ? Date.now() + (expiresIn * 1000) 
          : null
        
        set({ token, refreshToken, tokenExpiresAt })
        
        // Update Xellar service with new token
        if (token) {
          xellarService.setAuthToken(token, refreshToken || undefined)
        }
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setOtpSent: (otpSent, email, verificationToken) => set({ 
        otpSent, 
        otpEmail: email || null,
        verificationToken: verificationToken || null
      }),

      login: (user, token, refreshToken, expiresIn) => {
        const tokenExpiresAt = expiresIn 
          ? Date.now() + (expiresIn * 1000) 
          : null

        set({
          user,
          token,
          refreshToken,
          tokenExpiresAt,
          isAuthenticated: true,
          isLoading: false,
          otpSent: false,
          otpEmail: null,
        })

        // Set token in Xellar service with wallet address
        xellarService.setAuthToken(token, refreshToken, undefined, user.walletAddress)
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          tokenExpiresAt: null,
          isAuthenticated: false,
          otpSent: false,
          otpEmail: null,
        })

        // Clear Xellar session
        xellarService.clearSession()
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      // Refresh access token using refresh token
      refreshSession: async () => {
        const { refreshToken } = get()
        
        if (!refreshToken) {
          return false
        }

        try {
          const response = await xellarService.refreshAccessToken(refreshToken)
          
          set({
            token: response.token,
            tokenExpiresAt: Date.now() + (response.expiresIn * 1000),
          })

          return true
        } catch (error) {
          console.error("Failed to refresh session:", error)
          // Logout on refresh failure
          get().logout()
          return false
        }
      },

      // Check if token is expired or about to expire (within 5 minutes)
      checkTokenExpiry: () => {
        const { tokenExpiresAt } = get()
        
        if (!tokenExpiresAt) {
          return false
        }

        const fiveMinutes = 5 * 60 * 1000
        return Date.now() + fiveMinutes >= tokenExpiresAt
      },
    }),
    {
      name: "remitt-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
      // Restore auth token in Xellar service on load
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          xellarService.setAuthToken(state.token, state.refreshToken || undefined)
        }
      },
    },
  ),
)
