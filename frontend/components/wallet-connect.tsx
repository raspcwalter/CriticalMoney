"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useState } from "react"

interface WalletConnectProps {
  onConnect: (account: string) => void
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

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const switchToArbitrumSepolia = async () => {
    if (!window.ethereum) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARBITRUM_SEPOLIA_PARAMS.chainId }],
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [ARBITRUM_SEPOLIA_PARAMS],
          })
        } catch (addError) {
          console.error("Error adding Arbitrum Sepolia:", addError)
          throw addError
        }
      } else {
        throw switchError
      }
    }
  }

  const handleConnect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("Please install MetaMask or a compatible wallet")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await switchToArbitrumSepolia()

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length > 0) {
        onConnect(accounts[0])
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      setError(error.message || "Failed to connect wallet. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <Card className="w-full max-w-md p-8 bg-card border-border">
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-4">
            <img
              src="https://arbitrum.foundation/logo.svg"
              alt="Arbitrum Logo"
              className="h-12 w-auto"
              onError={(e) => {
                console.log("[v0] Logo failed to load, using fallback")
                // Fallback to PNG version if SVG fails
                e.currentTarget.src = "https://www.arbitrum.foundation/images/logo.png"
              }}
            />
          </div>

          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Critical Money</h1>
            <p className="text-muted-foreground">Unlock Mineral Liquidity</p>
          </div>

          <div className="py-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 9a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <Button
            onClick={handleConnect}
            disabled={isLoading}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? "Connecting..." : "Connect Wallet"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <p className="text-xs text-muted-foreground">
            You will be prompted to switch to <strong>Arbitrum Sepolia</strong>
          </p>
        </div>
      </Card>
    </div>
  )
}
