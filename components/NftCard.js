'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function NftCard({ tokenId, name, description, image, owner }) {
  const shortenAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <Link href={`/nft/${tokenId}`}>
      <Card className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden group">
        <div className="aspect-square relative bg-gradient-to-br from-purple-900/50 to-slate-900/50">
          {image ? (
            <img
              src={image}
              alt={name || `NFT #${tokenId}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div 
            className={`absolute inset-0 flex items-center justify-center text-6xl ${image ? 'hidden' : 'flex'}`}
          >
            🖼️
          </div>
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white/80">
            #{tokenId}
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-white truncate">
            {name || `NFT #${tokenId}`}
          </h3>
          <p className="text-sm text-white/60 mt-1 line-clamp-2">
            {description || 'No description'}
          </p>
          {owner && (
            <div className="mt-3 flex items-center justify-between text-xs text-white/40">
              <span>Owner</span>
              <span className="font-mono">{shortenAddress(owner)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
