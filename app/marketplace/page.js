'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { NetworkBanner } from '@/components/NetworkBanner'
import { CollectionCard, CollectionCardSkeleton } from '@/components/marketplace/CollectionCard'
import { ItemCard, ItemCardSkeleton } from '@/components/marketplace/ItemCard'
import { EmptyState } from '@/components/marketplace/EmptyState'
import { OnchainDisabledNotice } from '@/components/marketplace/ComingSoonBanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { isOnchainEnabled } from '@/lib/config'
import { getAllCollections, getFeaturedItems, mockStats } from '@/lib/marketplace/mock'
import { TrendingUp, Layers, Users, Zap, ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'

export default function MarketplacePage() {
  const [loading, setLoading] = useState(true)
  const [collections, setCollections] = useState([])
  const [featuredItems, setFeaturedItems] = useState([])

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setCollections(getAllCollections())
      setFeaturedItems(getFeaturedItems())
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Explore the NFT Marketplace
          </h1>
          <p className="text-lg text-purple-200 mb-6">
            Discover, collect, and trade unique digital assets
          </p>
          
          {!isOnchainEnabled() && (
            <div className="flex justify-center mb-6">
              <OnchainDisabledNotice />
            </div>
          )}

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              placeholder="Search collections, items, or creators..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-4 text-center">
              <Layers className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{mockStats.totalCollections}</p>
              <p className="text-sm text-white/60">Collections</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-4 text-center">
              <Zap className="h-6 w-6 text-pink-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{mockStats.totalItems}</p>
              <p className="text-sm text-white/60">Items</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-4 text-center">
              <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{mockStats.totalVolume} ETH</p>
              <p className="text-sm text-white/60">Total Volume</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-4 text-center">
              <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{mockStats.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-white/60">Users</p>
            </CardContent>
          </Card>
        </section>

        {/* Featured Items */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Featured Items</h2>
            <Link href="/marketplace/items">
              <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <ItemCardSkeleton key={i} />)}
            </div>
          ) : featuredItems.length === 0 ? (
            <EmptyState
              icon="🖼️"
              title="No Items Yet"
              description="Be the first to mint an NFT on NovaTok"
              actionLabel="Mint NFT"
              actionHref="/mint"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {featuredItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* Collections */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Top Collections</h2>
            <Link href="/marketplace/collections">
              <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <CollectionCardSkeleton key={i} />)}
            </div>
          ) : collections.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No Collections Yet"
              description="Collections will appear here once created"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
