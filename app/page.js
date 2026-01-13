'use client'

import { ConnectWalletButton } from '@/components/ConnectWalletButton'
import { useAccount } from 'wagmi'

export default function Home() {
  const { isConnected, address } = useAccount()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-white font-semibold text-lg">NovaTok</span>
          </div>
          <ConnectWalletButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center space-y-8">
          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
            NovaTok NFT Marketplace
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl text-purple-200 max-w-2xl">
            Wallet connection is live.
          </p>

          {/* Status Card */}
          <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            {isConnected ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-400 font-medium">Connected</span>
                </div>
                <p className="text-white/70 text-sm font-mono">
                  {address}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-yellow-400 font-medium">Not Connected</span>
                </div>
                <p className="text-white/70 text-sm">
                  Connect your wallet to get started
                </p>
                <div className="pt-2">
                  <ConnectWalletButton />
                </div>
              </div>
            )}
          </div>

          {/* Phase indicator */}
          <div className="mt-12 text-white/40 text-sm">
            Phase 1 Complete — Wallet Connection
          </div>
        </div>
      </main>
    </div>
  )
}
