'use client'

import { Loader2 } from 'lucide-react'

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      <p className="mt-4 text-white/70">{message}</p>
    </div>
  )
}
