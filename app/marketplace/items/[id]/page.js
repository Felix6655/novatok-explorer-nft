'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Header } from '@/components/Header'
import { NetworkBanner } from '@/components/NetworkBanner'
import { EmptyState } from '@/components/marketplace/EmptyState'
import { ComingSoonBanner, OnchainDisabledNotice } from '@/components/marketplace/ComingSoonBanner'
import { getItemById, getItemsByCollection } from '@/lib/marketplace/mock'
import { isOnchainEnabled } from '@/lib/config'
import { ItemCard, ItemCardSkeleton } from '@/components/marketplace/ItemCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, ExternalLink, Share2, Heart, ShoppingCart, Tag, Clock, Copy, Check } from 'lucide-react'
import Link from 'next/link'

export default function ItemDetailPage() {
  const params = useParams()
  const itemId = params.id
  const { address } = useAccount()
  
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState(null)
  const [relatedItems, setRelatedItems] = useState([])
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      const foundItem = getItemById(itemId)
      if (foundItem) {
        setItem(foundItem)
        // Get related items from same collection
        const related = getItemsByCollection(foundItem.collectionId)
          .filter(i => i.id !== itemId)
          .slice(0, 4)
        setRelatedItems(related)
      } else {
        setError('Item not found')
      }
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [itemId])

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isOwner = address && item?.owner?.toLowerCase() === address.toLowerCase()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <NetworkBanner />
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Link href="/marketplace" className="inline-flex items-center text-white/60 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Link>

          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <NetworkBanner />
        <Header />
        <main className="container mx-auto px-4 py-8">
          <EmptyState
            icon="😕"
            title="Item Not Found"
            description="The NFT you are looking for does not exist or has been removed."
            actionLabel="Browse Items"
            actionHref="/marketplace/items"
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link href="/marketplace" className="inline-flex items-center text-white/60 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Link>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Image */}
          <div className="space-y-4">
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <div className="aspect-square relative bg-gradient-to-br from-purple-900/30 to-slate-900/30">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
                {item.listed && (
                  <Badge className="absolute top-4 right-4 bg-green-500/80 text-white">
                    Listed
                  </Badge>
                )}
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
                <Heart className="h-4 w-4 mr-2" />
                Favorite
              </Button>
              <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Collection & Title */}
            <div>
              <Link href={`/marketplace/collections/${item.collectionId}`} className="text-purple-400 hover:text-purple-300 text-sm">
                {item.collectionName}
              </Link>
              <h1 className="text-3xl font-bold text-white mt-1">{item.name}</h1>
              {isOwner && (
                <Badge className="mt-2 bg-green-500/20 text-green-300">You own this</Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-white/70">{item.description}</p>

            {!isOnchainEnabled() && (
              <OnchainDisabledNotice />
            )}

            {/* Price Card */}
            {item.listed && item.price ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-4">
                  <p className="text-white/60 text-sm mb-1">Current Price</p>
                  <p className="text-3xl font-bold text-white">
                    {item.price} <span className="text-lg text-white/60">{item.currency}</span>
                  </p>
                  <div className="mt-4 space-y-2">
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      disabled={!isOnchainEnabled()}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {isOnchainEnabled() ? 'Buy Now' : 'Buy Now (Coming Soon)'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-4">
                  <p className="text-white/60">This item is not currently listed for sale</p>
                  {isOwner && (
                    <Button 
                      className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500"
                      disabled={!isOnchainEnabled()}
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      {isOnchainEnabled() ? 'List for Sale' : 'List for Sale (Coming Soon)'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Details Card */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Token ID</span>
                  <span className="text-white font-mono">#{item.tokenId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Owner</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm">{item.owner}</span>
                    <button onClick={() => copyAddress(item.owner)} className="text-white/40 hover:text-white">
                      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Creator</span>
                  <span className="text-white font-mono text-sm">{item.creator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Created</span>
                  <span className="text-white">{item.createdAt}</span>
                </div>
              </CardContent>
            </Card>

            {/* Attributes */}
            {item.attributes && item.attributes.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">Attributes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {item.attributes.map((attr, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-3">
                        <p className="text-purple-400 text-xs uppercase">{attr.trait_type}</p>
                        <p className="text-white font-medium">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">More from this Collection</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedItems.map((relatedItem) => (
                <ItemCard key={relatedItem.id} item={relatedItem} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
