/**
 * Chain and contract configuration
 * All values are driven by environment variables for mainnet switch safety
 */

// Expected chain ID from environment
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1', 10);

// RPC URL for the expected chain
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || '';

// NFT Contract address
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

// Chain names mapping
export const CHAIN_NAMES = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon Mainnet',
  80001: 'Polygon Mumbai',
  42161: 'Arbitrum One',
  421614: 'Arbitrum Sepolia',
  10: 'Optimism',
  8453: 'Base',
  84532: 'Base Sepolia',
};

/**
 * Check if the provided chainId matches the expected chain
 * @param {number|string} chainId - The chain ID to check
 * @returns {boolean} - True if chain matches expected
 */
export function isExpectedChain(chainId) {
  const numericChainId = typeof chainId === 'string' 
    ? parseInt(chainId, chainId.startsWith('0x') ? 16 : 10) 
    : chainId;
  return numericChainId === CHAIN_ID;
}

/**
 * Get the name of a chain by ID
 * @param {number} chainId - The chain ID
 * @returns {string} - The chain name or 'Unknown Network'
 */
export function getChainName(chainId) {
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
}

/**
 * Get the expected chain name
 * @returns {string} - The expected chain name
 */
export function getExpectedChainName() {
  return getChainName(CHAIN_ID);
}

/**
 * Generate a unique cache key for NFT data
 * Includes chainId, contract address, and wallet for proper isolation
 * @param {string} wallet - The wallet address
 * @returns {string} - Unique cache key
 */
export function getNFTCacheKey(wallet) {
  return `nft_cache_${CHAIN_ID}_${CONTRACT_ADDRESS}_${wallet?.toLowerCase() || 'anon'}`;
}

export default {
  CHAIN_ID,
  RPC_URL,
  CONTRACT_ADDRESS,
  CHAIN_NAMES,
  isExpectedChain,
  getChainName,
  getExpectedChainName,
  getNFTCacheKey,
};
