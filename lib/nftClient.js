import { createPublicClient, http, parseAbiItem, keccak256, toHex } from 'viem';
import { sepolia } from 'viem/chains';
import { NOVATOK_NFT_ABI, NFT_CONTRACT_ADDRESS, SEPOLIA_RPC_URL } from './contractConfig';

// Environment check
const IS_DEV = process.env.NODE_ENV !== 'production';

// Create public client for read operations
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});

// ERC721 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = keccak256(toHex('Transfer(address,address,uint256)'));

// Default block range for scanning (50,000 blocks ~ 1 week on Sepolia)
const DEFAULT_BLOCK_RANGE = 50000n;

/**
 * Get token URI for a specific token
 */
export async function getTokenURI(tokenId) {
  if (!NFT_CONTRACT_ADDRESS) throw new Error('Contract address not configured');
  
  const uri = await publicClient.readContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NOVATOK_NFT_ABI,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
  });
  return uri;
}

/**
 * Get owner of a specific token
 */
export async function getOwnerOf(tokenId) {
  if (!NFT_CONTRACT_ADDRESS) throw new Error('Contract address not configured');
  
  const owner = await publicClient.readContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NOVATOK_NFT_ABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
  });
  return owner;
}

/**
 * Get balance (number of tokens) for an address
 */
export async function getBalanceOf(address) {
  if (!NFT_CONTRACT_ADDRESS) throw new Error('Contract address not configured');
  
  const balance = await publicClient.readContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NOVATOK_NFT_ABI,
    functionName: 'balanceOf',
    args: [address],
  });
  return Number(balance);
}

/**
 * Get total minted tokens
 */
export async function getTotalMinted() {
  if (!NFT_CONTRACT_ADDRESS) throw new Error('Contract address not configured');
  
  const total = await publicClient.readContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NOVATOK_NFT_ABI,
    functionName: 'totalMinted',
  });
  return Number(total);
}

/**
 * Get next token ID
 */
export async function getNextTokenId() {
  if (!NFT_CONTRACT_ADDRESS) throw new Error('Contract address not configured');
  
  const nextId = await publicClient.readContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NOVATOK_NFT_ABI,
    functionName: 'nextTokenId',
  });
  return Number(nextId);
}

/**
 * Get current block number
 */
export async function getCurrentBlockNumber() {
  const blockNumber = await publicClient.getBlockNumber();
  return blockNumber;
}

/**
 * Scan Transfer events in a block range for a specific wallet
 * @param {string} walletAddress - Address to scan for
 * @param {bigint} fromBlock - Start block
 * @param {bigint} toBlock - End block
 * @returns {Promise<{received: Array, sent: Array}>} Logs split by direction
 */
export async function scanTransferEvents(walletAddress, fromBlock, toBlock) {
  if (!NFT_CONTRACT_ADDRESS) throw new Error('Contract address not configured');
  
  const normalizedAddress = walletAddress.toLowerCase();
  
  try {
    // Get Transfer events TO this address (received)
    const receivedLogs = await publicClient.getLogs({
      address: NFT_CONTRACT_ADDRESS,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
      args: {
        to: walletAddress,
      },
      fromBlock,
      toBlock,
    });

    // Get Transfer events FROM this address (sent)
    const sentLogs = await publicClient.getLogs({
      address: NFT_CONTRACT_ADDRESS,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
      args: {
        from: walletAddress,
      },
      fromBlock,
      toBlock,
    });

    return {
      received: receivedLogs.map(log => ({
        tokenId: Number(log.args.tokenId),
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      })),
      sent: sentLogs.map(log => ({
        tokenId: Number(log.args.tokenId),
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      })),
    };
  } catch (error) {
    if (IS_DEV) console.error('Error scanning transfer events:', error);
    throw error;
  }
}

/**
 * Build ownership set from transfer logs
 * @param {Array} allReceived - All received token logs
 * @param {Array} allSent - All sent token logs
 * @returns {Set<number>} Set of owned token IDs
 */
export function buildOwnershipSet(allReceived, allSent) {
  const ownership = new Map();
  
  // Sort all events by block number to process in order
  const allEvents = [
    ...allReceived.map(e => ({ ...e, type: 'received' })),
    ...allSent.map(e => ({ ...e, type: 'sent' })),
  ].sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));
  
  for (const event of allEvents) {
    if (event.type === 'received') {
      ownership.set(event.tokenId, true);
    } else {
      ownership.delete(event.tokenId);
    }
  }
  
  return new Set(ownership.keys());
}

/**
 * Paginated scanner for Transfer events
 * Scans backwards from latest block in chunks
 */
export class TransferEventScanner {
  constructor(walletAddress, blockRange = DEFAULT_BLOCK_RANGE) {
    this.walletAddress = walletAddress;
    this.blockRange = blockRange;
    this.currentToBlock = null;
    this.allReceived = [];
    this.allSent = [];
    this.hasMore = true;
    this.isInitialized = false;
    this.latestBlock = null;
    this.contractDeployBlock = 0n; // Could be configured if known
  }

  /**
   * Initialize scanner with current block
   */
  async initialize() {
    this.latestBlock = await getCurrentBlockNumber();
    this.currentToBlock = this.latestBlock;
    this.isInitialized = true;
  }

  /**
   * Get progress info
   */
  getProgress() {
    if (!this.isInitialized) return { scanned: 0, total: 0, percent: 0 };
    
    const total = Number(this.latestBlock - this.contractDeployBlock);
    const scanned = Number(this.latestBlock - this.currentToBlock) + Number(this.blockRange);
    const percent = total > 0 ? Math.min(100, Math.round((scanned / total) * 100)) : 0;
    
    return { scanned, total, percent };
  }

  /**
   * Scan next chunk of blocks
   * @returns {Promise<{ownedTokenIds: number[], hasMore: boolean, progress: object}>}
   */
  async scanNextChunk() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.hasMore) {
      return {
        ownedTokenIds: Array.from(buildOwnershipSet(this.allReceived, this.allSent)).sort((a, b) => b - a),
        hasMore: false,
        progress: this.getProgress(),
      };
    }

    const toBlock = this.currentToBlock;
    const fromBlock = toBlock > this.blockRange ? toBlock - this.blockRange : 0n;

    if (IS_DEV) {
      console.log(`[Scanner] Scanning blocks ${fromBlock} to ${toBlock}`);
    }

    try {
      const { received, sent } = await scanTransferEvents(this.walletAddress, fromBlock, toBlock);
      
      this.allReceived.push(...received);
      this.allSent.push(...sent);
      
      // Update position for next scan
      this.currentToBlock = fromBlock > 0n ? fromBlock - 1n : 0n;
      
      // Check if we've reached the beginning
      if (fromBlock <= this.contractDeployBlock) {
        this.hasMore = false;
      }

      const ownedTokenIds = Array.from(buildOwnershipSet(this.allReceived, this.allSent)).sort((a, b) => b - a);

      return {
        ownedTokenIds,
        hasMore: this.hasMore,
        progress: this.getProgress(),
        newReceived: received.length,
        newSent: sent.length,
      };
    } catch (error) {
      if (IS_DEV) console.error('[Scanner] Error:', error);
      throw error;
    }
  }

  /**
   * Reset scanner to start fresh
   */
  reset() {
    this.currentToBlock = null;
    this.allReceived = [];
    this.allSent = [];
    this.hasMore = true;
    this.isInitialized = false;
  }
}

/**
 * Get all tokens owned by an address by scanning Transfer events
 * This is the alternative to ERC721Enumerable - uses event indexing
 * @deprecated Use TransferEventScanner for paginated scanning
 */
export async function getOwnedTokens(ownerAddress) {
  if (!NFT_CONTRACT_ADDRESS) throw new Error('Contract address not configured');
  
  try {
    // Get Transfer events TO this address (received)
    const receivedLogs = await publicClient.getLogs({
      address: NFT_CONTRACT_ADDRESS,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
      args: {
        to: ownerAddress,
      },
      fromBlock: 'earliest',
      toBlock: 'latest',
    });

    // Get Transfer events FROM this address (sent)
    const sentLogs = await publicClient.getLogs({
      address: NFT_CONTRACT_ADDRESS,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
      args: {
        from: ownerAddress,
      },
      fromBlock: 'earliest',
      toBlock: 'latest',
    });

    // Build a map of tokenId -> current ownership
    const tokenOwnership = new Map();

    // Process received tokens
    for (const log of receivedLogs) {
      const tokenId = Number(log.args.tokenId);
      tokenOwnership.set(tokenId, true);
    }

    // Remove sent tokens
    for (const log of sentLogs) {
      const tokenId = Number(log.args.tokenId);
      tokenOwnership.delete(tokenId);
    }

    // Return array of owned token IDs
    return Array.from(tokenOwnership.keys()).sort((a, b) => a - b);
  } catch (error) {
    if (IS_DEV) console.error('Error fetching owned tokens:', error);
    throw error;
  }
}

/**
 * Parse metadata from tokenURI (handles data: URIs and http URIs)
 */
export async function parseTokenMetadata(tokenURI) {
  try {
    if (tokenURI.startsWith('data:application/json;base64,')) {
      // Base64 encoded JSON - handle Unicode properly
      const base64Data = tokenURI.replace('data:application/json;base64,', '');
      const jsonString = decodeURIComponent(escape(atob(base64Data)));
      return JSON.parse(jsonString);
    } else if (tokenURI.startsWith('data:application/json,')) {
      // URL encoded JSON
      const jsonString = decodeURIComponent(tokenURI.replace('data:application/json,', ''));
      return JSON.parse(jsonString);
    } else if (tokenURI.startsWith('http')) {
      // External URL
      const response = await fetch(tokenURI);
      return await response.json();
    } else {
      // Try parsing as raw JSON
      return JSON.parse(tokenURI);
    }
  } catch (error) {
    if (IS_DEV) console.error('Error parsing token metadata:', error);
    return {
      name: 'Unknown',
      description: 'Failed to load metadata',
      image: '',
    };
  }
}

/**
 * Get full NFT data (tokenId + parsed metadata)
 */
export async function getNFTData(tokenId) {
  const tokenURI = await getTokenURI(tokenId);
  const metadata = await parseTokenMetadata(tokenURI);
  const owner = await getOwnerOf(tokenId);
  
  return {
    tokenId,
    tokenURI,
    owner,
    ...metadata,
  };
}

/**
 * Batch fetch NFT data for multiple tokenIds
 * @param {number[]} tokenIds - Array of token IDs
 * @param {function} onProgress - Optional callback for progress updates
 * @returns {Promise<Array>} Array of NFT data objects
 */
export async function batchGetNFTData(tokenIds, onProgress = null) {
  const results = [];
  const total = tokenIds.length;
  
  for (let i = 0; i < tokenIds.length; i++) {
    const tokenId = tokenIds[i];
    try {
      const data = await getNFTData(tokenId);
      results.push(data);
    } catch (err) {
      if (IS_DEV) console.error(`Failed to fetch NFT #${tokenId}:`, err);
      results.push({
        tokenId,
        name: `NFT #${tokenId}`,
        description: 'Failed to load metadata',
        image: '',
        error: true,
      });
    }
    
    if (onProgress) {
      onProgress({ loaded: i + 1, total });
    }
  }
  
  return results;
}

/**
 * Create a data: URI from metadata object
 */
export function createTokenURI(name, description, imageUrl, attributes = []) {
  const metadata = {
    name,
    description,
    image: imageUrl,
    attributes,
  };
  
  // Use base64 encoding to avoid URL encoding issues
  const jsonString = JSON.stringify(metadata);
  const base64 = btoa(unescape(encodeURIComponent(jsonString)));
  return `data:application/json;base64,${base64}`;
}
