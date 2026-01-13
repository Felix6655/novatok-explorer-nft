'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle } from 'lucide-react'

export function CollectionCard({ collection }) {
  const {
    slug,
    name,
    logoImage,
    bannerImage,
    itemCount,
    floorPrice,
    verified,
  } = collection

  return (
    <Link href={`/marketplace/collections/${slug}`}>
      <Card className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden group">
        {/* Banner */}
        <div className="h-24 relative overflow-hidden">
          <img
            src={bannerImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        
        {/* Logo */}
        <div className="relative px-4 -mt-8">
          <div className="w-16 h-16 rounded-xl border-4 border-slate-900 overflow-hidden bg-slate-800">
            <img
              src={logoImage}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <CardContent className="pt-3 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-white truncate">{name}</h3>
            {verified && (
              <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-white/40 text-xs">Floor</p>
              <p className="text-white font-medium">{floorPrice} ETH</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs">Items</p>
              <p className="text-white font-medium">{itemCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function CollectionCardSkeleton() {
  return (
    <Card className="bg-white/5 border-white/10 overflow-hidden">
      <div className="h-24 bg-white/10 animate-pulse" />
      <div className="relative px-4 -mt-8">
        <div className="w-16 h-16 rounded-xl bg-white/10 animate-pulse" />
      </div>
      <CardContent className="pt-3 pb-4">
        <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse mb-3" />
        <div className="flex justify-between">
          <div className="space-y-1">
            <div className="h-3 w-8 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-3 w-8 bg-white/10 rounded animate-pulse ml-auto" />
            <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
