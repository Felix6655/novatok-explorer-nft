'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { NetworkBanner } from '@/components/NetworkBanner'
import { ItemCard, ItemCardSkeleton } from '@/components/marketplace/ItemCard'
import { EmptyState } from '@/components/marketplace/EmptyState'
import { OnchainDisabledNotice } from '@/components/marketplace/ComingSoonBanner'
import { getCollectionBySlug, getItemsByCollection } from '@/lib/marketplace/mock'
import { isOnchainEnabled } from '@/lib/config'
import { CheckCircle, ExternalLink, Grid, List, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export default function CollectionDetailPage() {
  const params = useParams()
  const slug = params.slug
  
  const [loading, setLoading] = useState(true)
  const [collection, setCollection] = useState(null)
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      const col = getCollectionBySlug(slug)
      if (col) {
        setCollection(col)
        setItems(getItemsByCollection(col.id))
      } else {
        setError('Collection not found')
      }
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <NetworkBanner />
        <Header />
        <main className="container mx-auto px-4 py-8">
          {/* Banner Skeleton */}
          <Skeleton className="h-48 md:h-64 rounded-2xl mb-8" />
          
          {/* Info Skeleton */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <Skeleton className="w-24 h-24 rounded-xl -mt-16 ml-4" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          {/* Items Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <ItemCardSkeleton key={i} />)}
          </div>
        </main>
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <NetworkBanner />
        <Header />
        <main className="container mx-auto px-4 py-8">
          <EmptyState
            icon="😕"
            title="Collection Not Found"
            description="The collection you are looking for does not exist or has been removed."
            actionLabel="Browse Collections"
            actionHref="/marketplace/collections"
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      <main>
        {/* Banner */}
        <div className="h-48 md:h-64 relative">
          <img
            src={collection.bannerImage}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        </div>

        <div className="container mx-auto px-4">
          {/* Collection Info */}
          <div className="flex flex-col md:flex-row gap-6 mb-8 -mt-12 relative">
            {/* Logo */}
            <div className="w-24 h-24 rounded-xl border-4 border-slate-900 overflow-hidden bg-slate-800 flex-shrink-0">
              <img
                src={collection.logoImage}
                alt={collection.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Details */}
            <div className="flex-1 pt-4 md:pt-8">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
                {collection.verified && (
                  <CheckCircle className="h-6 w-6 text-blue-400" />
                )}
              </div>
              <p className="text-white/70 mb-4 max-w-2xl">{collection.description}</p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-white/40">Items</span>
                  <p className="text-white font-semibold">{collection.itemCount}</p>
                </div>
                <div>
                  <span className="text-white/40">Floor Price</span>
                  <p className="text-white font-semibold">{collection.floorPrice} ETH</p>
                </div>
                <div>
                  <span className="text-white/40">Total Volume</span>
                  <p className="text-white font-semibold">{collection.totalVolume} ETH</p>
                </div>
                <div>
                  <span className="text-white/40">Category</span>
                  <p className="text-white font-semibold">{collection.category}</p>
                </div>
              </div>
            </div>
          </div>

          {!isOnchainEnabled() && (
            <div className="mb-6">
              <OnchainDisabledNotice />
            </div>
          )}

          {/* Items Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Items ({items.length})
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                <Grid className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Items Grid */}
          {items.length === 0 ? (
            <EmptyState
              icon="🖼️"
              title="No Items in Collection"
              description="This collection does not have any items yet."
              actionLabel="Mint NFT"
              actionHref="/mint"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
