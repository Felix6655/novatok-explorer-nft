/**
 * NFT utility functions for NovaTok marketplace
 */

import { decodeEventLog } from 'viem'

// ERC721 Transfer event signature
const TRANSFER_EVENT_ABI = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: true, name: 'tokenId', type: 'uint256' },
  ],
}

// NFTMinted event signature (custom event in our contract)
const NFT_MINTED_EVENT_ABI = {
  type: 'event',
  name: 'NFTMinted',
  inputs: [
    { indexed: true, name: 'to', type: 'address' },
    { indexed: true, name: 'tokenId', type: 'uint256' },
    { indexed: false, name: 'tokenURI', type: 'string' },
  ],
}

/**
 * Truncate an Ethereum address for display
 * @param {string} address - Full Ethereum address
 * @param {number} startChars - Characters to show at start (default 6)
 * @param {number} endChars - Characters to show at end (default 4)
 * @returns {string} Truncated address like "0x1234...5678"
 */
export function truncateAddress(address, startChars = 6, endChars = 4) {
  if (!address || typeof address !== 'string') return ''
  if (address.length <= startChars + endChars) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Generate Etherscan transaction URL
 * @param {string} txHash - Transaction hash
 * @param {number} chainId - Chain ID (default Sepolia 11155111)
 * @returns {string} Etherscan URL
 */
export function toEtherscanTxUrl(txHash, chainId = 11155111) {
  const baseUrl = getEtherscanBaseUrl(chainId)
  return `${baseUrl}/tx/${txHash}`
}

/**
 * Generate Etherscan token URL
 * @param {string} contractAddress - NFT contract address
 * @param {number|string} tokenId - Token ID
 * @param {number} chainId - Chain ID (default Sepolia 11155111)
 * @returns {string} Etherscan URL
 */
export function toEtherscanTokenUrl(contractAddress, tokenId, chainId = 11155111) {
  const baseUrl = getEtherscanBaseUrl(chainId)
  return `${baseUrl}/token/${contractAddress}?a=${tokenId}`
}

/**
 * Generate Etherscan address URL
 * @param {string} address - Ethereum address
 * @param {number} chainId - Chain ID (default Sepolia 11155111)
 * @returns {string} Etherscan URL
 */
export function toEtherscanAddressUrl(address, chainId = 11155111) {
  const baseUrl = getEtherscanBaseUrl(chainId)
  return `${baseUrl}/address/${address}`
}

/**
 * Get Etherscan base URL for chain
 * @param {number} chainId - Chain ID
 * @returns {string} Base URL
 */
function getEtherscanBaseUrl(chainId) {
  switch (chainId) {
    case 1:
      return 'https://etherscan.io'
    case 11155111:
      return 'https://sepolia.etherscan.io'
    case 5:
      return 'https://goerli.etherscan.io'
    case 137:
      return 'https://polygonscan.com'
    case 80001:
      return 'https://mumbai.polygonscan.com'
    default:
      return 'https://sepolia.etherscan.io'
  }
}

/**
 * Extract tokenId from a transaction receipt
 * Looks for Transfer event or NFTMinted event from the contract
 * 
 * @param {object} receipt - Transaction receipt from viem/wagmi
 * @param {string} contractAddress - Expected contract address (optional, for filtering)
 * @returns {number|null} Token ID or null if not found
 */
export function extractTokenIdFromReceipt(receipt, contractAddress = null) {
  if (!receipt || !receipt.logs || receipt.logs.length === 0) {
    return null
  }

  // Normalize contract address for comparison
  const normalizedContract = contractAddress?.toLowerCase()

  for (const log of receipt.logs) {
    // If contract address specified, filter by it
    if (normalizedContract && log.address?.toLowerCase() !== normalizedContract) {
      continue
    }

    try {
      // Try to decode as Transfer event (ERC721 standard)
      // Transfer event has 4 topics: event signature, from, to, tokenId
      if (log.topics && log.topics.length === 4) {
        const decoded = decodeEventLog({
          abi: [TRANSFER_EVENT_ABI],
          data: log.data,
          topics: log.topics,
        })
        
        if (decoded.eventName === 'Transfer' && decoded.args.tokenId !== undefined) {
          return Number(decoded.args.tokenId)
        }
      }
    } catch {
      // Not a Transfer event, try next
    }

    try {
      // Try to decode as NFTMinted event (our custom event)
      if (log.topics && log.topics.length === 3) {
        const decoded = decodeEventLog({
          abi: [NFT_MINTED_EVENT_ABI],
          data: log.data,
          topics: log.topics,
        })
        
        if (decoded.eventName === 'NFTMinted' && decoded.args.tokenId !== undefined) {
          return Number(decoded.args.tokenId)
        }
      }
    } catch {
      // Not an NFTMinted event, try next
    }

    // Fallback: Try to parse tokenId from raw topics
    // For ERC721 Transfer: topics[3] is the indexed tokenId
    if (log.topics && log.topics.length >= 4) {
      try {
        const tokenIdHex = log.topics[3]
        if (tokenIdHex) {
          const tokenId = parseInt(tokenIdHex, 16)
          if (!isNaN(tokenId) && tokenId >= 0) {
            return tokenId
          }
        }
      } catch {
        // Continue to next log
      }
    }
  }

  return null
}

/**
 * Check if a string is a valid image URL or data URI
 * @param {string} uri - URI to check
 * @returns {boolean}
 */
export function isImageUri(uri) {
  if (!uri || typeof uri !== 'string') return false
  
  // Check for common image extensions
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico']
  const lowerUri = uri.toLowerCase()
  
  // Check for data URI images
  if (uri.startsWith('data:image/')) return true
  
  // Check for HTTP(S) URLs with image extensions
  if (lowerUri.startsWith('http://') || lowerUri.startsWith('https://')) {
    // Remove query string for extension check
    const pathOnly = lowerUri.split('?')[0]
    return imageExtensions.some(ext => pathOnly.endsWith(ext))
  }
  
  return false
}

/**
 * Check if a string is likely a JSON metadata URI
 * @param {string} uri - URI to check
 * @returns {boolean}
 */
export function isJsonUri(uri) {
  if (!uri || typeof uri !== 'string') return false
  
  // Data URI JSON
  if (uri.startsWith('data:application/json')) return true
  
  // IPFS or HTTP JSON
  const lowerUri = uri.toLowerCase()
  if (lowerUri.endsWith('.json')) return true
  
  // IPFS links often contain metadata
  if (lowerUri.includes('ipfs')) return true
  
  return false
}

/**
 * Format a token URI for display (truncate if too long)
 * @param {string} uri - Token URI
 * @param {number} maxLength - Maximum display length
 * @returns {string}
 */
export function formatTokenUri(uri, maxLength = 50) {
  if (!uri || typeof uri !== 'string') return ''
  if (uri.length <= maxLength) return uri
  
  // For data URIs, show type and truncate
  if (uri.startsWith('data:')) {
    const typeEnd = uri.indexOf(',')
    if (typeEnd > 0 && typeEnd < 30) {
      return `${uri.slice(0, typeEnd + 10)}...`
    }
  }
  
  return `${uri.slice(0, maxLength - 3)}...`
}

/**
 * Get user-friendly error message for NFT operations
 * @param {Error} error - Error object
 * @returns {string} User-friendly message
 */
export function getNftErrorMessage(error) {
  if (!error) return 'An unknown error occurred'
  
  const message = error.message || error.toString()
  const lowerMessage = message.toLowerCase()
  
  // Token doesn't exist
  if (lowerMessage.includes('erc721nonexistenttoken') || 
      lowerMessage.includes('token does not exist') ||
      lowerMessage.includes('invalid token id')) {
    return 'This token does not exist'
  }
  
  // Not owner
  if (lowerMessage.includes('not owner') || lowerMessage.includes('not the owner')) {
    return 'You are not the owner of this token'
  }
  
  // Contract call failed
  if (lowerMessage.includes('call revert') || lowerMessage.includes('execution reverted')) {
    return 'Unable to read from contract. The token may not exist.'
  }
  
  // Network error
  if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return 'Network error. Please check your connection and try again.'
  }
  
  // Contract not configured
  if (lowerMessage.includes('contract address not configured')) {
    return 'NFT contract is not configured'
  }
  
  return 'Failed to load NFT data. Please try again.'
}
