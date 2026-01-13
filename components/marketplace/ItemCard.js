'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ItemCard({ item }) {
  const {
    id,
    name,
    image,
    collectionName,
    price,
    currency,
    listed,
  } = item

  return (
    <Link href={`/marketplace/items/${id}`}>
      <Card className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden group">
        {/* Image */}
        <div className="aspect-square relative bg-gradient-to-br from-purple-900/30 to-slate-900/30">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          {listed && (
            <Badge className="absolute top-2 right-2 bg-green-500/80 text-white">
              Listed
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <p className="text-xs text-purple-400 mb-1 truncate">{collectionName}</p>
          <h3 className="font-semibold text-white truncate mb-2">{name}</h3>
          
          {listed && price ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Price</span>
              <span className="text-white font-medium">{price} {currency}</span>
            </div>
          ) : (
            <div className="text-xs text-white/40">Not listed</div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export function ItemCardSkeleton() {
  return (
    <Card className="bg-white/5 border-white/10 overflow-hidden">
      <div className="aspect-square bg-white/10 animate-pulse" />
      <CardContent className="p-4">
        <div className="h-3 w-20 bg-white/10 rounded animate-pulse mb-2" />
        <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse mb-3" />
        <div className="flex justify-between">
          <div className="h-3 w-10 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}
