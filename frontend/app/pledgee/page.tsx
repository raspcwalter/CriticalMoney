"use client"

import { useState, useEffect } from "react"
import WalletConnect from "@/components/wallet-connect"
import PledgeePlatform from "@/components/pledgee-platform"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ChainlinkFooter from "@/components/chainlink-footer"

export default function PledgeePage() {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          })
          if (accounts.length > 0) {
            setAccount(accounts[0])
          }

          const networkId = await window.ethereum.request({
            method: "eth_chainId",
          })
          const parsedChainId = Number.parseInt(networkId, 16)
          console.log("[v0] PledgeePage - Initial ChainId:", parsedChainId)
          setChainId(parsedChainId)
        } catch (error) {
          console.error("[v0] Error checking wallet:", error)
        }
      }
      setIsReady(true)
    }

    checkWallet()

    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        setAccount(accounts[0] || null)
      }

      const handleChainChanged = (chainIdHex: string) => {
        const parsedChainId = Number.parseInt(chainIdHex, 16)
        console.log("[v0] ChainChanged event - New ChainId:", parsedChainId)
        setChainId(parsedChainId)
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
          window.ethereum.removeListener("chainChanged", handleChainChanged)
        }
      }
    }
  }, [])

  const handleDisconnect = () => {
    setAccount(null)
  }

  if (!isReady) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <img
              src="/critical-money-logo.png"
              alt="Critical Money"
              width={48}
              height={48}
              className="object-contain"
            />
            <Link href="/" className="text-sm text-primary hover:underline">
              Lending Pool
            </Link>
          </div>
          {account && (
            <Button onClick={handleDisconnect} variant="outline" size="sm">
              Disconnect
            </Button>
          )}
        </div>
        {!account ? (
          <WalletConnect onConnect={setAccount} />
        ) : (
          <PledgeePlatform account={account} chainId={chainId} onChainIdChange={setChainId} />
        )}
      </div>
      <ChainlinkFooter />
    </main>
  )
}
