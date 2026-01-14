'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'
import { useState } from 'react'

// WalletConnect Project ID (optional)
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

// Build connectors array
const connectors = [
  // Injected connector (MetaMask, etc) - always available
  injected({
    shimDisconnect: true,
  }),
]

// Add WalletConnect and Coinbase only if project ID exists
if (walletConnectProjectId) {
  connectors.push(
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: 'NovaTok NFT Marketplace',
        description: 'NFT Marketplace on Sepolia',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://novatok.app',
        icons: [],
      },
      showQrModal: true,
    }),
    coinbaseWallet({
      appName: 'NovaTok NFT Marketplace',
    })
  )
}

// Create wagmi config - Sepolia only
const config = createConfig({
  chains: [sepolia],
  connectors,
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org'),
  },
  ssr: true,
})

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }))

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
