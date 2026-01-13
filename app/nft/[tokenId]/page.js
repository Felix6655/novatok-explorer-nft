'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Header } from '@/components/Header'
import { NetworkBanner } from '@/components/NetworkBanner'
import { LoadingState } from '@/components/LoadingState'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { NFT_CONTRACT_ADDRESS } from '@/lib/contractConfig'
import { getNFTData } from '@/lib/nftClient'
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react'
import Link from 'next/link'

export default function NFTDetailPage() {
  const params = useParams()
  const tokenId = params.tokenId
  const { address } = useAccount()
  
  const [nft, setNft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchNFT = async () => {
      if (!tokenId || !NFT_CONTRACT_ADDRESS) {
        setLoading(false)
        return
      }

      try {
        const data = await getNFTData(parseInt(tokenId))
        setNft(data)
      } catch (err) {
        console.error('Error fetching NFT:', err)
        setError(err.message || 'Failed to load NFT')
      } finally {
        setLoading(false)
      }
    }

    fetchNFT()
  }, [tokenId])

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shortenAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const isOwner = address && nft?.owner?.toLowerCase() === address.toLowerCase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      <main className="container mx-auto px-4 py-12">
        <Link href="/my-nfts" className="inline-flex items-center text-white/60 hover:text-white mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My NFTs
        </Link>

        {!NFT_CONTRACT_ADDRESS ? (
          <ErrorBanner
            title="Contract Not Configured"
            message="NFT contract address is not set."
          />
        ) : loading ? (
          <LoadingState message="Loading NFT details..." />
        ) : error ? (
          <ErrorBanner
            title="Error Loading NFT"
            message={error}
          />
        ) : nft ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Image */}
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <div className="aspect-square relative bg-gradient-to-br from-purple-900/50 to-slate-900/50">
                {nft.image ? (
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center text-9xl ${nft.image ? 'hidden' : ''}`}>
                  🖼️
                </div>
              </div>
            </Card>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                    #{tokenId}
                  </span>
                  {isOwner && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                      You own this
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-bold text-white">
                  {nft.name || `NFT #${tokenId}`}
                </h1>
              </div>

              {nft.description && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-2">Description</h3>
                  <p className="text-white/80">{nft.description}</p>
                </div>
              )}

              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Owner</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">{shortenAddress(nft.owner)}</span>
                      <button
                        onClick={() => copyAddress(nft.owner)}
                        className="text-white/40 hover:text-white"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Token ID</span>
                    <span className="text-white">{tokenId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Contract</span>
                    <a
                      href={`https://sepolia.etherscan.io/address/${NFT_CONTRACT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      {shortenAddress(NFT_CONTRACT_ADDRESS)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Attributes */}
              {nft.attributes && nft.attributes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-3">Attributes</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {nft.attributes.map((attr, i) => (
                      <Card key={i} className="bg-white/5 border-white/10">
                        <CardContent className="p-3">
                          <div className="text-xs text-purple-400 uppercase">{attr.trait_type}</div>
                          <div className="text-white font-medium">{attr.value}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <a
                href={`https://sepolia.etherscan.io/token/${NFT_CONTRACT_ADDRESS}?a=${tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Etherscan
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">❓</div>
            <p className="text-white/70 text-lg">NFT not found</p>
          </div>
        )}
      </main>
    </div>
  )
}
