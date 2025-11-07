"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ethers } from "ethers"

interface RewardsSectionProps {
  account: string
}

export default function RewardsSection({ account }: RewardsSectionProps) {
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

  const handleClaimRewards = async () => {
    setLoading(true)
    setMessage("")

    try {
      const provider = await getProvider()
      const signer = await provider.getSigner()

      const poolAddress = "0xFF0E997dA92B179349dA072f5b122977B848D44E"
      const poolABI = ["function claimRewards() external"]

      const poolContract = new ethers.Contract(poolAddress, poolABI, signer)

      setMessage("Processing rewards claim...")

      const tx = await executeTransaction(async () => {
        return await poolContract.claimRewards()
      })
      await tx.wait()

      setMessage("✓ Successfully claimed rewards!")
      setIsError(false)
    } catch (error: any) {
      let errorMsg = error.message || "Error: Transaction failed"
      if (error.message?.includes("Extension context invalidated")) {
        errorMsg = "Extension context lost. Please try again."
      }
      setMessage(errorMsg)
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Claim Rewards</h3>
        <p className="text-sm text-muted-foreground">Claim your accumulated rewards from lending to the pool</p>
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
        onClick={handleClaimRewards}
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        size="lg"
      >
        {loading ? "Processing..." : "Claim Rewards"}
      </Button>
    </div>
  )
}
