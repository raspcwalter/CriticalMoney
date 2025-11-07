"use client"

import { useState, useEffect } from "react"
import LendingDashboard from "@/components/lending-dashboard"
import WalletConnect from "@/components/wallet-connect"
import { Button } from "@/components/ui/button"
import ChainlinkFooter from "@/components/chainlink-footer"

export default function Home() {
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
        setChainId(parsedChainId)
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum?.removeListener("chainChanged", handleChainChanged)
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
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <img src="/critical-money-logo.png" alt="Critical Money Logo" className="w-16 h-16" />
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Critical Money</h1>
              {account && (
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Account:</span>
                    <code className="bg-secondary/30 px-2 py-1 rounded text-xs font-mono">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Chain:</span>
                    <code className="bg-secondary/30 px-2 py-1 rounded text-xs font-mono">
                      {chainId === 421614 ? "Arbitrum Sepolia" : `Chain ID: ${chainId}`}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/" className="text-sm text-primary hover:underline">
              Lending Pool
            </a>
            <span className="text-muted-foreground">|</span>
            <a href="/pledgee" className="text-sm text-primary hover:underline">
              Pledge Platform
            </a>
            {account && (
              <>
                <span className="text-muted-foreground">|</span>
                <Button onClick={handleDisconnect} variant="outline" size="sm">
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </div>
        {!account ? (
          <WalletConnect onConnect={setAccount} />
        ) : (
          <LendingDashboard account={account} chainId={chainId} onChainIdChange={setChainId} />
        )}
      </div>
      <ChainlinkFooter />
    </main>
  )
}
