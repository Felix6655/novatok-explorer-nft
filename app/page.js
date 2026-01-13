'use client'

import { useAccount } from 'wagmi'
import { Header } from '@/components/Header'
import { NetworkBanner } from '@/components/NetworkBanner'
import { OnchainDisabledNotice } from '@/components/marketplace/ComingSoonBanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { isOnchainEnabled } from '@/lib/config'
import { SEPOLIA_CHAIN_ID } from '@/lib/contractConfig'
import { Sparkles, Image, Wallet, Store, ArrowRight, Layers, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { isConnected, chain } = useAccount()
  const isWrongNetwork = chain?.id !== SEPOLIA_CHAIN_ID
  const onchainEnabled = isOnchainEnabled()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      <main className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 text-sm mb-6">
            <Sparkles className="h-4 w-4" />
            NFT Marketplace on Sepolia Testnet
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6">
            Discover, Collect & 
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Trade NFTs</span>
          </h1>
          
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            NovaTok is your gateway to the world of digital collectibles. 
            Mint unique NFTs, explore curated collections, and build your portfolio.
          </p>
          
          {!onchainEnabled && (
            <div className="flex justify-center mb-6">
              <OnchainDisabledNotice />
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/marketplace">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8">
                <Store className="h-5 w-5 mr-2" />
                Explore Marketplace
              </Button>
            </Link>
            <Link href="/mint">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8">
                <Sparkles className="h-5 w-5 mr-2" />
                Mint NFT
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
            <CardContent className="py-6 text-center">
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">4</p>
              <p className="text-white/60">Collections</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
            <CardContent className="py-6 text-center">
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">486</p>
              <p className="text-white/60">NFTs</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
            <CardContent className="py-6 text-center">
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">282 ETH</p>
              <p className="text-white/60">Volume</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
            <CardContent className="py-6 text-center">
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">1.2K</p>
              <p className="text-white/60">Users</p>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Everything you need
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all group">
              <CardContent className="pt-8 pb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-7 w-7 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Mint NFTs</h3>
                <p className="text-white/60 mb-4">
                  Create unique NFTs with custom images and metadata stored permanently on-chain.
                </p>
                <Link href="/mint" className="text-purple-400 hover:text-purple-300 inline-flex items-center text-sm font-medium">
                  Start minting <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-pink-500/50 transition-all group">
              <CardContent className="pt-8 pb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Layers className="h-7 w-7 text-pink-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Browse Collections</h3>
                <p className="text-white/60 mb-4">
                  Explore curated collections from talented creators around the world.
                </p>
                <Link href="/marketplace/collections" className="text-pink-400 hover:text-pink-300 inline-flex items-center text-sm font-medium">
                  View collections <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-blue-500/50 transition-all group">
              <CardContent className="pt-8 pb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Track Portfolio</h3>
                <p className="text-white/60 mb-4">
                  Manage your NFT collection and track your digital assets in one place.
                </p>
                <Link href="/my-nfts" className="text-blue-400 hover:text-blue-300 inline-flex items-center text-sm font-medium">
                  View portfolio <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center max-w-2xl mx-auto">
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="py-10">
              <h3 className="text-2xl font-bold text-white mb-3">Ready to get started?</h3>
              <p className="text-white/60 mb-6">
                Connect your wallet and start exploring the NovaTok marketplace today.
              </p>
              {!isConnected ? (
                <p className="text-purple-300 text-sm">
                  <Wallet className="inline h-4 w-4 mr-1" />
                  Connect your wallet using the button above
                </p>
              ) : (
                <Link href="/marketplace">
                  <Button className="bg-white text-purple-900 hover:bg-white/90">
                    <Store className="h-4 w-4 mr-2" />
                    Enter Marketplace
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">N</span>
              </div>
              <span className="text-white/60 text-sm">NovaTok NFT Marketplace</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <span>Built on Ethereum Sepolia</span>
              <span>•</span>
              <span>Preview Mode</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
