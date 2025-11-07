"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import RegisterPledgeForm from "./register-pledge-form"
import AmortizePledgeForm from "./amortize-pledge-form"

const PLEDGE_PLATFORM_ADDRESS = "0x6BF6CfB0779cEf6b40ff88bB19060Ee8c84c8ADD"
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614

interface PledgeePlatformProps {
  account: string
  chainId: number | null
  onChainIdChange: (chainId: number) => void
}

export default function PledgeePlatform({ account, chainId, onChainIdChange }: PledgeePlatformProps) {
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAndUpdateNetwork = async () => {
      if (chainId === ARBITRUM_SEPOLIA_CHAIN_ID) {
        setIsCorrectNetwork(true)
      } else if (chainId !== null && chainId !== ARBITRUM_SEPOLIA_CHAIN_ID) {
        setIsCorrectNetwork(false)
        setError(`Wrong Network - Please switch to Arbitrum Sepolia (Chain ID: ${ARBITRUM_SEPOLIA_CHAIN_ID})`)
      }
    }

    checkAndUpdateNetwork()
  }, [chainId])

  const handleSwitchNetwork = async () => {
    if (!window.ethereum) {
      setError("MetaMask not found")
      return
    }

    setIsSwitching(true)
    setError(null)

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x66eee" }], // 421614 in hex
      })

      // Wait for network to actually switch
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const networkId = await window.ethereum.request({
        method: "eth_chainId",
      })
      const parsedChainId = Number.parseInt(networkId, 16)
      onChainIdChange(parsedChainId)
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x66eee",
                chainName: "Arbitrum Sepolia",
                rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
                nativeCurrency: {
                  name: "Ethereum",
                  symbol: "ETH",
                  decimals: 18,
                },
                blockExplorerUrls: ["https://sepolia.arbiscan.io"],
              },
            ],
          })

          await new Promise((resolve) => setTimeout(resolve, 1500))

          const networkId = await window.ethereum.request({
            method: "eth_chainId",
          })
          const parsedChainId = Number.parseInt(networkId, 16)
          onChainIdChange(parsedChainId)
        } catch (addError) {
          setError("Failed to add Arbitrum Sepolia network")
        }
      } else {
        setError("Failed to switch network")
      }
    } finally {
      setIsSwitching(false)
    }
  }

  if (chainId === null) {
    return (
      <div className="space-y-4">
        <Alert variant="default">
          <AlertDescription>Detecting network...</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <img
            src="https://arbitrum.foundation/logo.svg"
            alt="Arbitrum Logo"
            className="h-10 w-auto flex-shrink-0"
            onError={(e) => {
              e.currentTarget.src =
                "https://raw.githubusercontent.com/arbitrum-foundation/brand-assets/main/png/ARB_Logo_Horizontal_White.png"
            }}
          />
          <Alert variant="destructive" className="flex-1">
            <AlertDescription>
              Wrong Network - Please switch to Arbitrum Sepolia (Chain ID: {ARBITRUM_SEPOLIA_CHAIN_ID})
            </AlertDescription>
          </Alert>
        </div>
        <button
          onClick={handleSwitchNetwork}
          disabled={isSwitching}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isSwitching ? "Switching..." : "Switch Network"}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pledge Platform</h1>
          <p className="text-muted-foreground">Tokenize metal collateral and manage pledges</p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>
            Account: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
          <p>Chain: Arbitrum Sepolia</p>
        </div>
      </div>

      <Tabs defaultValue="register" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="register">Register Pledge</TabsTrigger>
          <TabsTrigger value="amortize">Pay Pledge</TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Register New Pledge</CardTitle>
              <CardDescription>Register a new pledge to tokenize metal collateral for a pledgor</CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterPledgeForm account={account} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amortize">
          <Card>
            <CardHeader>
              <CardTitle>Pay Pledge</CardTitle>
              <CardDescription>Make a payment towards your pledged collateral</CardDescription>
            </CardHeader>
            <CardContent>
              <AmortizePledgeForm account={account} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
