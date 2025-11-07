"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { ethers } from "ethers"

interface AccountInfoProps {
  account: string
}

export default function AccountInfo({ account }: AccountInfoProps) {
  const [usdcBalance, setUsdcBalance] = useState<string>("0")
  const [principalDeposited, setPrincipalDeposited] = useState<string>("0")
  const [pendingRewards, setPendingRewards] = useState<string>("0")

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)

        // USDC token address on Arbitrum Sepolia
        const usdcAddress = "0x906e8e6FB02DC4F507227Fb8c75cA1B0e9D10e23"
        const usdcABI = ["function balanceOf(address account) view returns (uint256)"]

        const usdcContract = new ethers.Contract(usdcAddress, usdcABI, provider)
        const balance = await usdcContract.balanceOf(account)
        setUsdcBalance(ethers.formatUnits(balance, 6))

        // Lending pool contract address
        const poolAddress = "0xFF0E997dA92B179349dA072f5b122977B848D44E"
        const poolABI = [
          "function userBalances(address) view returns (address user, uint256 principal)",
          "function rewards(address) view returns (uint256)",
        ]

        const poolContract = new ethers.Contract(poolAddress, poolABI, provider)

        const userBalance = await poolContract.userBalances(account)
        setPrincipalDeposited(ethers.formatUnits(userBalance.principal, 6))

        const reward = await poolContract.rewards(account)
        setPendingRewards(ethers.formatUnits(reward, 6))
      } catch (error) {
        console.error("Error fetching account data:", error)
      }
    }

    fetchAccountData()
    const interval = setInterval(fetchAccountData, 5000)

    return () => clearInterval(interval)
  }, [account])

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">USDC Balance</p>
          <p className="text-3xl font-bold text-foreground">
            {Number.parseFloat(usdcBalance).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground">Available to lend</p>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 p-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Deposited</p>
          <p className="text-3xl font-bold text-foreground">
            {Number.parseFloat(principalDeposited).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground">USDC in pool</p>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 p-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Pending Rewards</p>
          <p className="text-3xl font-bold text-foreground">
            {Number.parseFloat(pendingRewards).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground">Ready to claim</p>
        </div>
      </Card>
    </>
  )
}
