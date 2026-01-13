'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'
import { useState } from 'react'

// Get WalletConnect Project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  console.warn(
    'WalletConnect Project ID not found. Please add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to your .env file.'
  )
}

// Create wagmi config - Sepolia only
const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    ...(projectId
      ? [
          walletConnect({
            projectId,
            metadata: {
              name: 'NovaTok NFT Marketplace',
              description: 'NFT Marketplace powered by NovaTok on Sepolia',
              url: typeof window !== 'undefined' ? window.location.origin : '',
              icons: [],
            },
          }),
          coinbaseWallet({
            appName: 'NovaTok NFT Marketplace',
          }),
        ]
      : []),
  ],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org'),
  },
  ssr: true,
})

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
