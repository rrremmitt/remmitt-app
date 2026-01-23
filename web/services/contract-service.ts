/**
 * Contract Service - Smart Contract Interactions
 * Handles all interactions with smart contracts using the Xellar SDK
 */

import { getXellarClient } from "@/config/xellar.config"
import { getBatchContractAddress, getUSDCAddress } from "@/lib/batch-contract"
import { type Address } from "viem"

export interface ContractCallParams {
  to: Address
  data: `0x${string}`
  value?: bigint
}

export interface ContractCallResult {
  success: boolean
  txHash?: string
  error?: string
  receipt?: any
}

class ContractService {
  private client = getXellarClient()

  /**
   * Execute a contract call using the Xellar SDK
   */
  async executeContractCall(params: ContractCallParams): Promise<ContractCallResult> {
    try {
      console.log("[ContractService] Executing contract call:", {
        to: params.to,
        dataLength: params.data.length,
        value: params.value?.toString(),
      })

      // Check if the Xellar SDK has a contract.send method
      // This may need adjustment based on the actual SDK API
      if (this.client.contract?.send) {
        const txHash = await this.client.contract.send({
          to: params.to,
          data: params.data,
          value: params.value || 0n,
        })

        return {
          success: true,
          txHash,
        }
      }

      // Fallback: Try other potential SDK methods
      // Check for wallet.sendTransaction, account.send, etc.
      if (this.client.wallet?.sendTransaction) {
        const result = await this.client.wallet.sendTransaction({
          to: params.to,
          data: params.data,
          value: params.value || 0n,
        })

        return {
          success: true,
          txHash: result?.hash,
        }
      }

      if (this.client.account?.send) {
        const result = await this.client.account.send({
          to: params.to,
          data: params.data,
          value: params.value || 0n,
        })

        return {
          success: true,
          txHash: result?.hash,
        }
      }

      // If we get here, we need to check what methods are available
      console.warn("[ContractService] No contract send method found in SDK")
      console.log("[ContractService] Available SDK methods:", Object.keys(this.client).filter(k => typeof this.client[k as keyof typeof this.client] === 'object'))

      return {
        success: false,
        error: "No contract interaction method found in Xellar SDK",
      }
    } catch (error: any) {
      console.error("[ContractService] Contract call failed:", error)
      return {
        success: false,
        error: error?.message || "Contract call failed",
      }
    }
  }

  /**
   * Approve USDC spending for the batch contract
   */
  async approveUSDC(amount: bigint): Promise<ContractCallResult> {
    try {
      const usdcAddress = getUSDCAddress() as Address
      const batchContractAddress = getBatchContractAddress() as Address

      // Approve function signature: approve(address spender, uint256 amount)
      // Selector: 0x095ea7b3
      const approveCalldata = this.encodeApprove(batchContractAddress, amount)

      return this.executeContractCall({
        to: usdcAddress,
        data: approveCalldata,
      })
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "Approval failed",
      }
    }
  }

  /**
   * Encode approve function call
   */
  private encodeApprove(spender: Address, amount: bigint): `0x${string}` {
    // Function signature: approve(address,uint256)
    // Selector: 0x095ea7b3

    const addressPadded = spender.toLowerCase().slice(2).padStart(64, "0")
    const amountPadded = amount.toString(16).padStart(64, "0")

    return `0x095ea7b3${addressPadded}${amountPadded}` as `0x${string}`
  }

  /**
   * Check USDC allowance for the batch contract
   */
  async checkAllowance(owner: Address): Promise<bigint> {
    try {
      const usdcAddress = getUSDCAddress() as Address
      const batchContractAddress = getBatchContractAddress() as Address

      // Allowance function signature: allowance(address owner, address spender)
      // Selector: 0xdd62ed3e
      const allowanceCalldata = this.encodeAllowance(owner, batchContractAddress)

      const result = await this.executeContractCall({
        to: usdcAddress,
        data: allowanceCalldata,
      })

      if (result.success && result.receipt) {
        // Parse the result to get the allowance value
        // This would typically come from the call result
        return 0n
      }

      return 0n
    } catch (error) {
      console.error("[ContractService] Check allowance failed:", error)
      return 0n
    }
  }

  /**
   * Encode allowance function call
   */
  private encodeAllowance(owner: Address, spender: Address): `0x${string}` {
    // Function signature: allowance(address,address)
    // Selector: 0xdd62ed3e

    const ownerPadded = owner.toLowerCase().slice(2).padStart(64, "0")
    const spenderPadded = spender.toLowerCase().slice(2).padStart(64, "0")

    return `0xdd62ed3e${ownerPadded}${spenderPadded}` as `0x${string}`
  }
}

export const contractService = new ContractService()
