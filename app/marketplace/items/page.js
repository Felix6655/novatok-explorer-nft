'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { NetworkBanner } from '@/components/NetworkBanner'
import { ItemCard, ItemCardSkeleton } from '@/components/marketplace/ItemCard'
import { EmptyState } from '@/components/marketplace/EmptyState'
import { getAllItems } from '@/lib/marketplace/mock'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ItemsPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [filterListed, setFilterListed] = useState('all')

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(getAllItems())
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Filter and sort items
  let filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.collectionName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (filterListed === 'listed') {
    filteredItems = filteredItems.filter(item => item.listed)
  } else if (filterListed === 'unlisted') {
    filteredItems = filteredItems.filter(item => !item.listed)
  }

  // Sort
  if (sortBy === 'price-low') {
    filteredItems = [...filteredItems].sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0))
  } else if (sortBy === 'price-high') {
    filteredItems = [...filteredItems].sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">All Items</h1>
            <p className="text-white/60 mt-1">Browse all NFTs in the marketplace</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
          
          <Select value={filterListed} onValueChange={setFilterListed}>
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="listed">Listed</SelectItem>
              <SelectItem value="unlisted">Not Listed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-white/40 text-sm mb-4">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <ItemCardSkeleton key={i} />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon="🖼️"
            title={searchQuery ? 'No Results Found' : 'No Items Yet'}
            description={searchQuery ? `No items match "${searchQuery}"` : 'Be the first to mint an NFT'}
            actionLabel={searchQuery ? 'Clear Search' : 'Mint NFT'}
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
            actionHref={searchQuery ? undefined : '/mint'}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
