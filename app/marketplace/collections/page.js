'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { NetworkBanner } from '@/components/NetworkBanner'
import { CollectionCard, CollectionCardSkeleton } from '@/components/marketplace/CollectionCard'
import { EmptyState } from '@/components/marketplace/EmptyState'
import { getAllCollections } from '@/lib/marketplace/mock'
import { Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CollectionsPage() {
  const [loading, setLoading] = useState(true)
  const [collections, setCollections] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setCollections(getAllCollections())
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Collections</h1>
            <p className="text-white/60 mt-1">Browse all NFT collections</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors w-64"
              />
            </div>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <CollectionCardSkeleton key={i} />)}
          </div>
        ) : filteredCollections.length === 0 ? (
          <EmptyState
            icon="📁"
            title={searchQuery ? 'No Results Found' : 'No Collections Yet'}
            description={searchQuery ? `No collections match "${searchQuery}"` : 'Collections will appear here once created'}
            actionLabel={searchQuery ? 'Clear Search' : undefined}
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
