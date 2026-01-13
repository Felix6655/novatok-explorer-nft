'use client'

import { useAccount } from 'wagmi'
import { Header } from '@/components/Header'
import { NetworkBanner } from '@/components/NetworkBanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { NFT_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from '@/lib/contractConfig'
import { Sparkles, Image, Wallet, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { isConnected, chain } = useAccount()
  const isWrongNetwork = chain?.id !== SEPOLIA_CHAIN_ID

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      <main className="container mx-auto px-4 py-20">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">
            NovaTok NFT Marketplace
          </h1>
          <p className="text-xl text-purple-200 mb-8">
            Mint and collect unique NFTs on Ethereum Sepolia testnet
          </p>
          
          {!isConnected ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-300">
              <Wallet className="h-4 w-4" />
              Connect your wallet to get started
            </div>
          ) : isWrongNetwork ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-300">
              Switch to Sepolia network
            </div>
          ) : !NFT_CONTRACT_ADDRESS ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-300">
              Contract not deployed yet
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <Link href="/mint">
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Mint NFT
                </Button>
              </Link>
              <Link href="/my-nfts">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Image className="h-5 w-5 mr-2" />
                  My NFTs
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Mint NFTs</h3>
              <p className="text-white/60 text-sm">
                Create unique NFTs with custom images and metadata stored on-chain
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4">
                <Image className="h-6 w-6 text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">View Collection</h3>
              <p className="text-white/60 text-sm">
                Browse and manage your NFT collection with detailed metadata
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Sepolia Testnet</h3>
              <p className="text-white/60 text-sm">
                Test safely on Sepolia with free testnet ETH from faucets
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        {!NFT_CONTRACT_ADDRESS && (
          <div className="mt-16 max-w-2xl mx-auto">
            <Card className="bg-orange-500/10 border-orange-500/30">
              <CardContent className="py-6">
                <h3 className="text-lg font-semibold text-orange-300 mb-3">Setup Required</h3>
                <ol className="text-orange-200/80 text-sm space-y-2 list-decimal list-inside">
                  <li>Deploy the NovaTokNFT contract to Sepolia</li>
                  <li>Set NEXT_PUBLIC_NFT_CONTRACT_ADDRESS in your .env</li>
                  <li>Restart the app to enable minting</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="mt-20 text-center text-white/40 text-sm">
          NovaTok NFT Marketplace • Built on Ethereum Sepolia
        </div>
      </main>
    </div>
  )
}
