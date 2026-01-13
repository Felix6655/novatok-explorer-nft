import { createPublicClient, http, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';
import { NOVATOK_NFT_ABI, NFT_CONTRACT_ADDRESS, SEPOLIA_RPC_URL } from './contractConfig';

// Create public client for read operations
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});

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
 * Get all tokens owned by an address by scanning Transfer events
 * This is the alternative to ERC721Enumerable - uses event indexing
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
    console.error('Error fetching owned tokens:', error);
    throw error;
  }
}

/**
 * Parse metadata from tokenURI (handles data: URIs and http URIs)
 */
export async function parseTokenMetadata(tokenURI) {
  try {
    if (tokenURI.startsWith('data:application/json;base64,')) {
      // Base64 encoded JSON
      const base64Data = tokenURI.replace('data:application/json;base64,', '');
      const jsonString = atob(base64Data);
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
    console.error('Error parsing token metadata:', error);
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
  const base64 = btoa(jsonString);
  return `data:application/json;base64,${base64}`;
}
