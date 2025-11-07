"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"

const PLEDGE_PLATFORM_ADDRESS = "0x6BF6CfB0779cEf6b40ff88bB19060Ee8c84c8ADD"
const USDC_ADDRESS = "0x906e8e6FB02DC4F507227Fb8c75cA1B0e9D10e23"

const PLEDGE_PLATFORM_ABI = [
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "pledgeId", type: "uint256" },
    ],
    name: "amortizePledge",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "pledgeId", type: "uint256" }],
    name: "getPledgeById",
    outputs: [
      {
        components: [
          { name: "pledgor", type: "address" },
          { name: "quantityInOunces", type: "uint256" },
          { name: "pledgeDate", type: "uint256" },
          { name: "redemptionDate", type: "uint256" },
          { name: "agreementId", type: "uint256" },
          { name: "redemptionApproved", type: "bool" },
          { name: "ouncePrice", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]

const USDC_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
]

interface AmortizePledgeFormProps {
  account: string
}

export default function AmortizePledgeForm({ account }: AmortizePledgeFormProps) {
  const [pledgeId, setPledgeId] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleAmortizePledge = async () => {
    setError(null)
    setSuccess(null)

    if (!pledgeId || !amount) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found")
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // First approve USDC
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer)
      const amountBN = ethers.parseUnits(amount, 6) // USDC has 6 decimals

      const approveTx = await usdcContract.approve(PLEDGE_PLATFORM_ADDRESS, amountBN)
      setSuccess("Approving USDC...")
      await approveTx.wait()

      // Then call amortizePledge
      const pledgeContract = new ethers.Contract(PLEDGE_PLATFORM_ADDRESS, PLEDGE_PLATFORM_ABI, signer)

      const tx = await pledgeContract.amortizePledge(amountBN, ethers.parseUnits(pledgeId, 0))

      setSuccess("Transaction submitted. Waiting for confirmation...")
      await tx.wait()

      setSuccess(`Payment processed successfully! TX: ${tx.hash}`)
      setPledgeId("")
      setAmount("")
    } catch (err: any) {
      console.error("[v0] Amortize pledge error:", err)

      if (err.reason === "Address without registry") {
        setError("No pledge found for your address")
      } else if (err.reason === "Amount overflow") {
        setError("Payment amount exceeds remaining balance")
      } else if (err.message.includes("Extension context invalidated")) {
        setError("Wallet connection lost. Please reconnect and try again.")
      } else {
        setError(err.reason || err.message || "Transaction failed")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="pledgeId">Pledge ID</Label>
        <Input
          id="pledgeId"
          type="number"
          placeholder="e.g., 0"
          value={pledgeId}
          onChange={(e) => setPledgeId(e.target.value)}
          disabled={isLoading}
          min="0"
          step="1"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Payment Amount (USDC)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="e.g., 1000.50"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isLoading}
          min="0"
          step="0.01"
        />
        <p className="text-xs text-muted-foreground">Amount in USDC (6 decimals)</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Button onClick={handleAmortizePledge} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Processing...
          </>
        ) : (
          "Pay Pledge"
        )}
      </Button>
    </div>
  )
}
