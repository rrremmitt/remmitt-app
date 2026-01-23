import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Recipient {
  id: string
  name: string
  nickname?: string
  phone?: string
  email?: string
  bankName: string
  bankCode: string
  accountNumber: string
  accountType: "bank" | "ewallet"
  country: string
  currency: string
  walletAddress?: `0x${string}` // Wallet address for blockchain transfers
  isFavorite: boolean
  lastUsed?: string
  createdAt: string
}

interface RecipientState {
  recipients: Recipient[]
  selectedRecipient: Recipient | null
  selectedRecipients: Recipient[] // For batch transfers
  isBatchMode: boolean
  isLoading: boolean

  // Actions
  setRecipients: (recipients: Recipient[]) => void
  addRecipient: (recipient: Recipient) => void
  updateRecipient: (id: string, updates: Partial<Recipient>) => void
  deleteRecipient: (id: string) => void
  selectRecipient: (recipient: Recipient | null) => void
  selectRecipients: (recipients: Recipient[]) => void
  toggleRecipientSelection: (recipient: Recipient) => void
  setBatchMode: (enabled: boolean) => void
  clearBatchSelection: () => void
  toggleFavorite: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const useRecipientStore = create<RecipientState>()(
  persist(
    (set) => ({
      recipients: [],
      selectedRecipient: null,
      selectedRecipients: [],
      isBatchMode: false,
      isLoading: false,

      setRecipients: (recipients) => set({ recipients }),

      addRecipient: (recipient) =>
        set((state) => ({
          recipients: [...state.recipients, recipient],
        })),

      updateRecipient: (id, updates) =>
        set((state) => ({
          recipients: state.recipients.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      deleteRecipient: (id) =>
        set((state) => ({
          recipients: state.recipients.filter((r) => r.id !== id),
          selectedRecipient: state.selectedRecipient?.id === id ? null : state.selectedRecipient,
          selectedRecipients: state.selectedRecipients.filter((r) => r.id !== id),
        })),

      selectRecipient: (recipient) => set({ selectedRecipient: recipient }),

      selectRecipients: (recipients) => set({ selectedRecipients: recipients }),

      toggleRecipientSelection: (recipient) =>
        set((state) => {
          const isSelected = state.selectedRecipients.some((r) => r.id === recipient.id)
          return {
            selectedRecipients: isSelected
              ? state.selectedRecipients.filter((r) => r.id !== recipient.id)
              : [...state.selectedRecipients, recipient],
          }
        }),

      setBatchMode: (enabled) =>
        set((state) => ({
          isBatchMode: enabled,
          // Clear single selection when entering batch mode
          selectedRecipient: enabled ? null : state.selectedRecipient,
          // Clear batch selection when exiting batch mode
          selectedRecipients: enabled ? state.selectedRecipients : [],
        })),

      clearBatchSelection: () =>
        set({
          selectedRecipients: [],
          isBatchMode: false,
        }),

      toggleFavorite: (id) =>
        set((state) => ({
          recipients: state.recipients.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r)),
        })),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "remitt-recipients",
    },
  ),
)
