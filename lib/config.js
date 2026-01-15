// Feature flags and configuration

export const config = {
  // FORCE on-chain enabled
  ONCHAIN_ENABLED: true,

  // App metadata
  APP_NAME: 'NovaTok',
  APP_DESCRIPTION: 'NFT Marketplace & Explorer',

  // Network
  CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111'),
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org',

  // Contract (MATCHES VERCEL ENV VAR)
  NFT_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
}

export const isOnchainEnabled = () =>
  config.ONCHAIN_ENABLED && config.NFT_CONTRACT_ADDRESS
