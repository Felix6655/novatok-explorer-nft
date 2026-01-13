'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, sepolia, polygon } from 'wagmi/chains'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'
import { useState } from 'react'

// Get WalletConnect Project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  console.warn(
    'WalletConnect Project ID not found. Please add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to your .env file.'
  )
}

// Create wagmi config
const config = createConfig({
  chains: [mainnet, sepolia, polygon],
  connectors: [
    injected(),
    ...(projectId
      ? [
          walletConnect({
            projectId,
            metadata: {
              name: 'NovaTok NFT Marketplace',
              description: 'NFT Marketplace powered by NovaTok',
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
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
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
