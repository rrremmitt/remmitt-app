/**
 * Batch Transfer Contract Test
 * Tests for the batch contract integration
 */

import { describe, it, expect } from "@jest/globals"
import {
  getBatchContractAddress,
  isBatchContractDeployed,
  getBatchTransferCalldata,
  calculateTotalAmount,
  validateBatchTransfer,
  estimateBatchGas,
} from "../batch-contract"

describe("Batch Contract", () => {
  describe("Contract Address", () => {
    it("should return Base Sepolia address", () => {
      const address = getBatchContractAddress()
      expect(address).toBe("0xca60bFd1D0eAfDf051885221ec4DF0510ceee944")
    })

    it("should detect contract is deployed", () => {
      const isDeployed = isBatchContractDeployed()
      expect(isDeployed).toBe(true)
    })
  })

  describe("Gas Estimation", () => {
    it("should estimate gas correctly", () => {
      const gas2 = estimateBatchGas(2)
      const gas10 = estimateBatchGas(10)

      expect(gas2).toBe(50000 + 2 * 35000) // 120,000
      expect(gas10).toBe(50000 + 10 * 35000) // 400,000
    })
  })

  describe("Total Calculation", () => {
    it("should sum amounts correctly", () => {
      const amounts = [1000000n, 2000000n, 3000000n] // 1, 2, 3 USDC (6 decimals)
      const total = calculateTotalAmount(amounts)

      expect(total).toBe(6000000n) // 6 USDC
    })
  })

  describe("Validation", () => {
    it("should validate correct batch transfer", () => {
      const result = validateBatchTransfer(
        ["0x" + "a".repeat(40), "0x" + "b".repeat(40)],
        [1000000n, 2000000n]
      )

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("should reject mismatched arrays", () => {
      const result = validateBatchTransfer(
        ["0x" + "a".repeat(40)],
        [1000000n, 2000000n]
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain("same length")
    })

    it("should reject empty recipients", () => {
      const result = validateBatchTransfer([], [])

      expect(result.valid).toBe(false)
      expect(result.error).toContain("At least one")
    })

    it("should reject too many recipients", () => {
      const recipients = Array(201).fill("0x" + "a".repeat(40))
      const amounts = Array(201).fill(1000000n)

      const result = validateBatchTransfer(recipients, amounts)

      expect(result.valid).toBe(false)
      expect(result.error).toContain("Maximum 200")
    })

    it("should reject zero address", () => {
      const result = validateBatchTransfer(
        ["0x0000000000000000000000000000000000000000"],
        [1000000n]
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain("Invalid recipient")
    })

    it("should reject zero amount", () => {
      const result = validateBatchTransfer(
        ["0x" + "a".repeat(40)],
        [0n]
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain("Invalid amount")
    })
  })

  describe("Calldata Encoding", () => {
    it("should encode batch transfer calldata", () => {
      const token = "0x" + "a".repeat(40) as const
      const recipients = ["0x" + "b".repeat(40), "0x" + "c".repeat(40)] as const
      const amounts = [1000000n, 2000000n]

      const calldata = getBatchTransferCalldata(token, recipients, amounts)

      expect(calldata).toMatch(/^0x[0-9a-f]+$/)
      expect(calldata.slice(0, 10)).toBe("0x3a7fec06") // batchSend selector
    })
  })
})

// Example usage for manual testing
export async function manualTestBatchTransfer() {
  console.log("=== Batch Transfer Manual Test ===\n")

  // 1. Check contract deployment
  console.log("1. Contract Address:", getBatchContractAddress())
  console.log("   Is Deployed:", isBatchContractDeployed())

  // 2. Test gas estimation
  console.log("\n2. Gas Estimation:")
  console.log("   2 recipients:", estimateBatchGas(2), "gas")
  console.log("   10 recipients:", estimateBatchGas(10), "gas")
  console.log("   Savings for 10 vs individual:", 10 * 80000 - estimateBatchGas(10), "gas")

  // 3. Test validation
  console.log("\n3. Validation Test:")
  const validResult = validateBatchTransfer(
    ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "0x8ba1f109551bD432803012645Ac136ddd64DBA72"],
    [1000000n, 2000000n]
  )
  console.log("   Valid batch:", validResult)

  // 4. Test calldata encoding
  console.log("\n4. Calldata Encoding:")
  const calldata = getBatchTransferCalldata(
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" as const,
    ["0x8ba1f109551bD432803012645Ac136ddd64DBA72"] as const,
    [1000000n]
  )
  console.log("   Encoded data:", calldata.slice(0, 66) + "...")

  console.log("\n=== Test Complete ===")
}

// Run manual test if executed directly
if (typeof window === "undefined") {
  manualTestBatchTransfer()
}
