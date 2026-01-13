'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectWalletButton } from '@/components/ConnectWalletButton'
import { cn } from '@/lib/utils'

export function Header() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/mint', label: 'Mint' },
    { href: '/my-nfts', label: 'My NFTs' },
  ]

  return (
    <header className="border-b border-white/10 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-white font-semibold text-lg">NovaTok</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <ConnectWalletButton />
      </div>
    </header>
  )
}
