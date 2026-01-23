import { supabase, type DbUser, type DbRecipient, type DbTransaction, type DbNotification } from '@/lib/supabase'

class DatabaseService {
  private isEnabled(): boolean {
    return supabase !== null
  }

  // ==================== USER OPERATIONS ====================
  
  /**
   * Get or create user from Xellar auth response
   */
  async syncUser(params: {
    xellarUserId: string
    email: string
    name?: string
    walletAddress?: string
    walletStatus?: 'pending' | 'created' | 'failed'
  }): Promise<DbUser | null> {
    if (!this.isEnabled()) {
      console.warn('[Database] Supabase not configured, skipping user sync')
      return null
    }

    try {
      // Try to find existing user
      const { data: existingUser } = await supabase!
        .from('users')
        .select('*')
        .eq('xellar_user_id', params.xellarUserId)
        .single()

      if (existingUser) {
        // Update existing user
        const { data: updatedUser, error } = await supabase!
          .from('users')
          .update({
            wallet_address: params.walletAddress || existingUser.wallet_address,
            wallet_status: params.walletStatus || existingUser.wallet_status,
            name: params.name || existingUser.name,
            last_login_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id)
          .select()
          .single()

        if (error) throw error
        return updatedUser
      }

      // Create new user
      const { data: newUser, error } = await supabase!
        .from('users')
        .insert({
          xellar_user_id: params.xellarUserId,
          email: params.email,
          name: params.name || params.email.split('@')[0],
          wallet_address: params.walletAddress,
          wallet_status: params.walletStatus || 'pending',
          kyc_status: 'none',
          last_login_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      
      // Create welcome notification
      await this.createNotification({
        user_id: newUser.id,
        type: 'success',
        title: 'Account Created Successfully',
        message: 'Welcome to Remitt! Your account and wallet have been created.',
      })

      return newUser
    } catch (error) {
      console.error('[Database] Error syncing user:', error)
      return null
    }
  }

  async getUserByXellarId(xellarUserId: string): Promise<DbUser | null> {
    if (!this.isEnabled()) return null

    try {
      const { data, error } = await supabase!
        .from('users')
        .select('*')
        .eq('xellar_user_id', xellarUserId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('[Database] Error getting user:', error)
      return null
    }
  }

  async updateUser(userId: string, updates: Partial<DbUser>): Promise<DbUser | null> {
    if (!this.isEnabled()) return null

    try {
      const { data, error } = await supabase!
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[Database] Error updating user:', error)
      return null
    }
  }

  async updateKYCStatus(
    userId: string,
    status: 'none' | 'pending' | 'verified' | 'rejected',
    rejectionReason?: string
  ): Promise<void> {
    if (!this.isEnabled()) return

    try {
      const updates: any = {
        kyc_status: status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'pending') {
        updates.kyc_submitted_at = new Date().toISOString()
      } else if (status === 'verified') {
        updates.kyc_verified_at = new Date().toISOString()
      } else if (status === 'rejected') {
        updates.kyc_rejection_reason = rejectionReason
      }

      const { error } = await supabase!
        .from('users')
        .update(updates)
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      console.error('[Database] Error updating KYC status:', error)
    }
  }

  // ==================== RECIPIENT OPERATIONS ====================

  async getRecipients(userId: string): Promise<DbRecipient[]> {
    if (!this.isEnabled()) return []

    try {
      const { data, error } = await supabase!
        .from('recipients')
        .select('*')
        .eq('user_id', userId)
        .order('is_favorite', { ascending: false })
        .order('last_sent_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[Database] Error getting recipients:', error)
      return []
    }
  }

  async createRecipient(recipient: Omit<DbRecipient, 'id' | 'created_at' | 'updated_at'>): Promise<DbRecipient | null> {
    if (!this.isEnabled()) return null

    try {
      const { data, error } = await supabase!
        .from('recipients')
        .insert(recipient)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[Database] Error creating recipient:', error)
      return null
    }
  }

  async updateRecipient(recipientId: string, updates: Partial<DbRecipient>): Promise<DbRecipient | null> {
    if (!this.isEnabled()) return null

    try {
      const { data, error } = await supabase!
        .from('recipients')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', recipientId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[Database] Error updating recipient:', error)
      return null
    }
  }

  async deleteRecipient(recipientId: string): Promise<void> {
    if (!this.isEnabled()) return

    try {
      const { error } = await supabase!
        .from('recipients')
        .delete()
        .eq('id', recipientId)

      if (error) throw error
    } catch (error) {
      console.error('[Database] Error deleting recipient:', error)
    }
  }

  // ==================== TRANSACTION OPERATIONS ====================

  async createTransaction(transaction: {
    user_id: string
    recipient_id?: string
    amount: number
    currency: string
    recipient_name: string
    recipient_bank: string
    recipient_account: string
    from_wallet_address: string
    to_wallet_address?: string
    tx_hash?: string
    xellar_transaction_id?: string
    notes?: string
    category?: string
    purpose?: string
    exchange_rate?: number
    local_amount?: number
    fee_amount?: number
  }): Promise<DbTransaction | null> {
    if (!this.isEnabled()) return null

    try {
      const { data, error } = await supabase!
        .from('transactions')
        .insert({
          ...transaction,
          status: 'pending',
          currency: transaction.currency || 'USDC',
          local_currency: 'IDR',
          fee_amount: transaction.fee_amount || 0,
        })
        .select()
        .single()

      if (error) throw error

      // Create notification
      await this.createNotification({
        user_id: transaction.user_id,
        type: 'info',
        title: 'Transaction Initiated',
        message: `Transfer of $${transaction.amount} to ${transaction.recipient_name} is being processed.`,
        transaction_id: data.id,
      })

      return data
    } catch (error) {
      console.error('[Database] Error creating transaction:', error)
      return null
    }
  }

  async getTransactions(userId: string, limit = 50): Promise<DbTransaction[]> {
    if (!this.isEnabled()) return []

    try {
      const { data, error } = await supabase!
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[Database] Error getting transactions:', error)
      return []
    }
  }

  async getTransaction(transactionId: string): Promise<DbTransaction | null> {
    if (!this.isEnabled()) return null

    try {
      const { data, error } = await supabase!
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('[Database] Error getting transaction:', error)
      return null
    }
  }

  async updateTransactionStatus(
    transactionId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
    txHash?: string
  ): Promise<DbTransaction | null> {
    if (!this.isEnabled()) return null

    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (txHash) {
        updates.tx_hash = txHash
      }

      if (status === 'completed') {
        updates.completed_at = new Date().toISOString()
      }

      const { data, error } = await supabase!
        .from('transactions')
        .update(updates)
        .eq('id', transactionId)
        .select()
        .single()

      if (error) throw error

      // Create notification
      const { data: transaction } = await supabase!
        .from('transactions')
        .select('user_id, amount, recipient_name')
        .eq('id', transactionId)
        .single()

      if (transaction) {
        let notificationType: 'success' | 'error' | 'info' = 'info'
        let title = 'Transaction Update'
        let message = ''

        if (status === 'completed') {
          notificationType = 'success'
          title = 'Transaction Completed'
          message = `Your transfer of $${transaction.amount} to ${transaction.recipient_name} was successful!`
        } else if (status === 'failed') {
          notificationType = 'error'
          title = 'Transaction Failed'
          message = `Transfer of $${transaction.amount} to ${transaction.recipient_name} failed. Please try again.`
        }

        if (message) {
          await this.createNotification({
            user_id: transaction.user_id,
            type: notificationType,
            title,
            message,
            transaction_id: transactionId,
          })
        }
      }

      return data
    } catch (error) {
      console.error('[Database] Error updating transaction status:', error)
      return null
    }
  }

  // ==================== NOTIFICATION OPERATIONS ====================

  async getNotifications(userId: string, limit = 50): Promise<DbNotification[]> {
    if (!this.isEnabled()) return []

    try {
      const { data, error } = await supabase!
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[Database] Error getting notifications:', error)
      return []
    }
  }

  async createNotification(notification: {
    user_id: string
    type: 'success' | 'warning' | 'info' | 'error'
    title: string
    message: string
    action_label?: string
    action_href?: string
    transaction_id?: string
  }): Promise<DbNotification | null> {
    if (!this.isEnabled()) return null

    try {
      const { data, error } = await supabase!
        .from('notifications')
        .insert({
          ...notification,
          read: false,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[Database] Error creating notification:', error)
      return null
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    if (!this.isEnabled()) return

    try {
      const { error } = await supabase!
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('[Database] Error marking notification as read:', error)
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    if (!this.isEnabled()) return

    try {
      const { error } = await supabase!
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
    } catch (error) {
      console.error('[Database] Error marking all notifications as read:', error)
    }
  }
}

export const databaseService = new DatabaseService()
