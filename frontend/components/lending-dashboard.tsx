"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import LendForm from "./lend-form"
import WithdrawForm from "./withdraw-form"
import RewardsSection from "./rewards-section"
import AccountInfo from "./account-info"

interface LendingDashboardProps {
  account: string
  chainId: number | null
  onChainIdChange: (chainId: number) => void
}

const ARBITRUM_SEPOLIA_CHAIN_ID = 421614
const ARBITRUM_SEPOLIA_PARAMS = {
  chainId: "0x66eee",
  chainName: "Arbitrum Sepolia",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
  blockExplorerUrls: ["https://sepolia.arbiscan.io"],
}

export default function LendingDashboard({ account, chainId, onChainIdChange }: LendingDashboardProps) {
  const [activeTab, setActiveTab] = useState<"lend" | "withdraw" | "rewards">("lend")
  const [isLoading, setIsLoading] = useState(false)

  const isCorrectNetwork = chainId === ARBITRUM_SEPOLIA_CHAIN_ID

  const handleSwitchNetwork = async () => {
    if (!window.ethereum) {
      console.error("[v0] window.ethereum not available")
      return
    }

    setIsLoading(true)
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARBITRUM_SEPOLIA_PARAMS.chainId }],
      })

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const updatedChainIdHex = await window.ethereum.request({
        method: "eth_chainId",
      })
      const updatedChainId = Number.parseInt(updatedChainIdHex, 16)
      onChainIdChange(updatedChainId)
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [ARBITRUM_SEPOLIA_PARAMS],
          })

          await new Promise((resolve) => setTimeout(resolve, 1000))
          const updatedChainIdHex = await window.ethereum.request({
            method: "eth_chainId",
          })
          const updatedChainId = Number.parseInt(updatedChainIdHex, 16)
          onChainIdChange(updatedChainId)
        } catch (addError) {
          console.error("[v0] Error adding chain:", addError)
        }
      } else {
        console.error("[v0] Error switching chain:", error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (chainId === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md p-8 bg-card border-border">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Detecting network...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md p-8 bg-destructive/10 border-destructive">
          <div className="text-center space-y-4">
            <img
              src="https://arbitrum.foundation/logo.svg"
              alt="Arbitrum Logo"
              className="h-12 w-auto mx-auto"
              onError={(e) => {
                e.currentTarget.src =
                  "https://raw.githubusercontent.com/arbitrum-foundation/brand-assets/main/png/ARB_Logo_Horizontal_White.png"
              }}
            />
            <h2 className="text-xl font-bold text-foreground">Wrong Network</h2>
            <p className="text-muted-foreground mb-2">
              You are currently on <strong>Chain ID {chainId}</strong>
            </p>
            <p className="text-muted-foreground mb-4">
              Please switch to <strong>Arbitrum Sepolia</strong> (Chain ID: 421614)
            </p>
            <Button onClick={handleSwitchNetwork} disabled={isLoading} size="lg" className="w-full">
              {isLoading ? "Switching..." : "Switch Network"}
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Click the button above and approve the network switch in your wallet.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AccountInfo account={account} />
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <div className="grid grid-cols-3 gap-1 p-1 bg-secondary/20">
          <button
            onClick={() => setActiveTab("lend")}
            className={`py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === "lend"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Lend USDC
          </button>
          <button
            onClick={() => setActiveTab("withdraw")}
            className={`py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === "withdraw"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Withdraw
          </button>
          <button
            onClick={() => setActiveTab("rewards")}
            className={`py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === "rewards"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Rewards
          </button>
        </div>

        <div className="p-8">
          {activeTab === "lend" && <LendForm account={account} />}
          {activeTab === "withdraw" && <WithdrawForm account={account} />}
          {activeTab === "rewards" && <RewardsSection account={account} />}
        </div>
      </Card>
    </div>
  )
}
