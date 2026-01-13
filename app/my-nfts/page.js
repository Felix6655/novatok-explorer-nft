'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Header } from '@/components/Header'
import { NetworkBanner } from '@/components/NetworkBanner'
import { NftCard } from '@/components/NftCard'
import { LoadingState } from '@/components/LoadingState'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Button } from '@/components/ui/button'
import { NFT_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from '@/lib/contractConfig'
import { getOwnedTokens, getNFTData } from '@/lib/nftClient'
import { RefreshCw, Plus } from 'lucide-react'
import Link from 'next/link'

export default function MyNFTsPage() {
  const { isConnected, address, chain } = useAccount()
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isWrongNetwork = chain?.id !== SEPOLIA_CHAIN_ID

  const fetchNFTs = async () => {
    if (!address || !NFT_CONTRACT_ADDRESS || isWrongNetwork) return

    setLoading(true)
    setError('')

    try {
      // Get owned token IDs via event indexing
      const tokenIds = await getOwnedTokens(address)
      
      // Fetch metadata for each token
      const nftDataPromises = tokenIds.map(async (tokenId) => {
        try {
          return await getNFTData(tokenId)
        } catch (err) {
          console.error(`Failed to fetch NFT #${tokenId}:`, err)
          return {
            tokenId,
            name: `NFT #${tokenId}`,
            description: 'Failed to load metadata',
            image: '',
            owner: address,
          }
        }
      })

      const nftData = await Promise.all(nftDataPromises)
      setNfts(nftData)
    } catch (err) {
      console.error('Error fetching NFTs:', err)
      setError(err.message || 'Failed to fetch your NFTs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && address && !isWrongNetwork) {
      fetchNFTs()
    } else {
      setNfts([])
    }
  }, [isConnected, address, isWrongNetwork])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">My NFTs</h1>
            <p className="text-white/60 mt-1">
              {isConnected ? `NFTs owned by your wallet` : 'Connect wallet to view your NFTs'}
            </p>
          </div>
          {isConnected && !isWrongNetwork && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={fetchNFTs}
                disabled={loading}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/mint">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Mint New
                </Button>
              </Link>
            </div>
          )}
        </div>

        {!NFT_CONTRACT_ADDRESS && (
          <ErrorBanner
            title="Contract Not Configured"
            message="NFT contract address is not set. Please deploy the contract first."
          />
        )}

        {!isConnected ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👛</div>
            <p className="text-white/70 text-lg">Connect your wallet to view your NFTs</p>
          </div>
        ) : isWrongNetwork ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-white/70 text-lg">Please switch to Sepolia network</p>
          </div>
        ) : loading ? (
          <LoadingState message="Fetching your NFTs..." />
        ) : error ? (
          <ErrorBanner
            title="Error Loading NFTs"
            message={error}
            onRetry={fetchNFTs}
          />
        ) : nfts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-white/70 text-lg mb-4">You don't own any NFTs yet</p>
            <Link href="/mint">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                <Plus className="h-4 w-4 mr-2" />
                Mint Your First NFT
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {nfts.map((nft) => (
              <NftCard
                key={nft.tokenId}
                tokenId={nft.tokenId}
                name={nft.name}
                description={nft.description}
                image={nft.image}
                owner={nft.owner}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
