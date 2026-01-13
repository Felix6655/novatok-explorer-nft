'use client'

import { AlertCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ErrorBanner({ title = 'Error', message, onRetry, onDismiss }) {
  return (
    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-red-300">{title}</h4>
          <p className="text-sm text-red-200/80 mt-1">{message}</p>
          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry}
                  className="border-red-500/50 text-red-300 hover:bg-red-500/20">
                  Try Again
                </Button>
              )}
              {onDismiss && (
                <Button size="sm" variant="ghost" onClick={onDismiss}
                  className="text-red-300 hover:bg-red-500/20">
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
