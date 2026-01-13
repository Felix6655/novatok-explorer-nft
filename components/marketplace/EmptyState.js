'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon && (
        <div className="text-6xl mb-4">{icon}</div>
      )}
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/60 text-center max-w-md mb-6">{description}</p>
      {(actionLabel && actionHref) && (
        <Link href={actionHref}>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
            {actionLabel}
          </Button>
        </Link>
      )}
      {(actionLabel && onAction && !actionHref) && (
        <Button onClick={onAction} className="bg-gradient-to-r from-purple-500 to-pink-500">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
