"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"

const PLEDGE_PLATFORM_ADDRESS = "0x6BF6CfB0779cEf6b40ff88bB19060Ee8c84c8ADD"

const PLEDGE_PLATFORM_ABI = [
  {
    inputs: [
      { name: "_pledgor", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "spread", type: "uint256" },
    ],
    name: "pledgeRegistry",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]

interface RegisterPledgeFormProps {
  account: string
}

export default function RegisterPledgeForm({ account }: RegisterPledgeFormProps) {
  const [pledgor, setPledgor] = useState("")
  const [ounces, setOunces] = useState("")
  const [spread, setSpread] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const validateInputs = (): boolean => {
    if (!ethers.isAddress(pledgor)) {
      setError("Invalid pledgor address")
      return false
    }

    const ouncesNum = Number(ounces)
    if (!Number.isInteger(ouncesNum) || ouncesNum <= 0) {
      setError("Ounces must be a positive integer")
      return false
    }

    const spreadNum = Number(spread)
    if (!Number.isInteger(spreadNum) || spreadNum < 0 || spreadNum > 12) {
      setError("Spread must be an integer between 0 and 12 (max 12%)")
      return false
    }

    return true
  }

  const handleRegisterPledge = async () => {
    setError(null)
    setSuccess(null)

    if (!validateInputs()) return

    setIsLoading(true)

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found")
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(PLEDGE_PLATFORM_ADDRESS, PLEDGE_PLATFORM_ABI, signer)

      const tx = await contract.pledgeRegistry(
        pledgor,
        ethers.parseUnits(ounces, 18), // Convert ounces to 18 decimals (ERC20 standard)
        ethers.parseUnits(spread, 0), // spread as plain number
      )

      setSuccess("Transaction submitted. Waiting for confirmation...")
      await tx.wait()

      setSuccess(`Pledge registered successfully! TX: ${tx.hash}`)
      setPledgor("")
      setOunces("")
      setSpread("")
    } catch (err: any) {
      console.error("[v0] Register pledge error:", err)

      // Handle specific contract errors
      if (err.reason === "Invalid spread") {
        setError("Invalid spread: must be between 0-12")
      } else if (err.reason === "No reward to distribute") {
        setError("Lending pool has no rewards to distribute. Try again later.")
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
        <Label htmlFor="pledgor">Pledgor Address</Label>
        <Input
          id="pledgor"
          placeholder="0x..."
          value={pledgor}
          onChange={(e) => setPledgor(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ounces">Quantity (Troy Ounces)</Label>
        <Input
          id="ounces"
          type="number"
          placeholder="e.g., 1000"
          value={ounces}
          onChange={(e) => setOunces(e.target.value)}
          disabled={isLoading}
          min="1"
          step="1"
        />
        <p className="text-xs text-muted-foreground">Must be a whole number</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="spread">Interest Rate / Spread (%)</Label>
        <Input
          id="spread"
          type="number"
          placeholder="e.g., 10"
          value={spread}
          onChange={(e) => setSpread(e.target.value)}
          disabled={isLoading}
          min="0"
          max="12"
          step="1"
        />
        <p className="text-xs text-muted-foreground">Must be an integer between 0-12%</p>
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

      <Button onClick={handleRegisterPledge} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Processing...
          </>
        ) : (
          "Register Pledge"
        )}
      </Button>
    </div>
  )
}
