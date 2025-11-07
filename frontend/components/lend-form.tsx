"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ethers } from "ethers"

interface LendFormProps {
  account: string
}

export default function LendForm({ account }: LendFormProps) {
  const [amount, setAmount] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>("")
  const [isError, setIsError] = useState(false)

  const getProvider = async () => {
    if (!window.ethereum) throw new Error("MetaMask not installed")
    return new ethers.BrowserProvider(window.ethereum)
  }

  const executeTransaction = async (
    fn: (signer: ethers.Signer) => Promise<ethers.ContractTransactionResponse>,
    retries = 3,
  ): Promise<ethers.ContractTransactionResponse> => {
    let lastError: any
    for (let i = 0; i < retries; i++) {
      try {
        return await fn(await getProvider().then((p) => p.getSigner()))
      } catch (error: any) {
        lastError = error
        if (error.message?.includes("Extension context invalidated")) {
          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
            continue
          }
        }
        throw error
      }
    }
    throw lastError
  }

  const handleLend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number.parseFloat(amount) <= 0) {
      setMessage("Please enter a valid amount")
      setIsError(true)
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const provider = await getProvider()
      const signer = await provider.getSigner()

      const usdcAddress = "0x906e8e6FB02DC4F507227Fb8c75cA1B0e9D10e23"
      const poolAddress = "0xFF0E997dA92B179349dA072f5b122977B848D44E"

      const usdcABI = [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
      ]

      const usdcContract = new ethers.Contract(usdcAddress, usdcABI, signer)

      const amountWei = ethers.parseUnits(amount, 6)

      // Check allowance
      const allowance = await usdcContract.allowance(account, poolAddress)

      if (allowance < amountWei) {
        setMessage("Approving USDC...")
        const approveTx = await executeTransaction(async () => {
          return await usdcContract.approve(poolAddress, ethers.MaxUint256)
        })
        if (approveTx) {
          await approveTx.wait()
          console.log("[v0] USDC approval successful")
        }
      }

      setMessage("Sending transaction...")

      // Lend USDC with retry logic
      const poolABI = ["function lendUSDC(uint256 amount) external"]
      const poolContract = new ethers.Contract(poolAddress, poolABI, signer)

      const tx = await executeTransaction(async () => {
        return await poolContract.lendUSDC(amountWei)
      })
      await tx.wait()

      setMessage("✓ Successfully lent USDC!")
      setIsError(false)
      setAmount("")
    } catch (error: any) {
      let errorMsg = error.message || "Error: Transaction failed"
      if (error.message?.includes("Extension context invalidated")) {
        errorMsg = "Extension context lost. Please try again."
      } else if (error.message?.includes("Failed to fetch")) {
        errorMsg = "Network request failed. Please check your connection and try again."
      }
      console.log("[v0] Error:", errorMsg)
      setMessage(errorMsg)
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLend} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Amount (USDC)</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        />
      </div>

      {message && (
        <Card
          className={`p-4 ${
            isError
              ? "bg-destructive/10 border-destructive/20 text-destructive"
              : "bg-green-500/10 border-green-500/20 text-green-700"
          }`}
        >
          <p className="text-sm">{message}</p>
        </Card>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        size="lg"
      >
        {loading ? "Processing..." : "Lend USDC"}
      </Button>
    </form>
  )
}
