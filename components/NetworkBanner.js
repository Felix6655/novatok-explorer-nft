'use client'

import { useAccount, useSwitchChain } from 'wagmi'
import { AlertTriangle, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SEPOLIA_CHAIN_ID } from '@/lib/contractConfig'

export function NetworkBanner() {
  const { isConnected, chain } = useAccount()
  const { switchChain, isPending } = useSwitchChain()

  // Don't show if not connected or already on Sepolia
  if (!isConnected || chain?.id === SEPOLIA_CHAIN_ID) {
    return null
  }

  return (
    <div className="bg-yellow-500/90 text-yellow-950 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">
            Wrong Network: Please switch to Sepolia Testnet
          </span>
          <span className="text-yellow-800 text-sm">
            (Currently on {chain?.name || 'Unknown Network'})
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}
          disabled={isPending}
          className="bg-yellow-950 text-yellow-100 hover:bg-yellow-900"
        >
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          {isPending ? 'Switching...' : 'Switch to Sepolia'}
        </Button>
      </div>
    </div>
  )
}
