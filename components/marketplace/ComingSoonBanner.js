'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Clock, Sparkles } from 'lucide-react'

export function ComingSoonBanner({ feature = 'This feature' }) {
  return (
    <Card className="bg-purple-500/10 border-purple-500/30">
      <CardContent className="py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Clock className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <p className="text-purple-300 font-medium">{feature} - Coming Soon</p>
          <p className="text-purple-200/60 text-sm">On-chain features will be available once the contract is deployed</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function OnchainDisabledNotice() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-sm">
      <Sparkles className="h-4 w-4" />
      <span>Preview Mode - On-chain actions disabled</span>
    </div>
  )
}
