/**
 * IPFS utility functions
 */

// IPFS gateways in order of preference
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
];

// Default gateway
const DEFAULT_GATEWAY = IPFS_GATEWAYS[0];

/**
 * Convert IPFS URI to HTTP gateway URL
 * @param {string} ipfsUri - IPFS URI (ipfs://CID or ipfs://CID/path)
 * @param {string} gateway - Gateway URL to use (optional)
 * @returns {string} HTTP URL
 */
export function ipfsToHttp(ipfsUri, gateway = DEFAULT_GATEWAY) {
  if (!ipfsUri || typeof ipfsUri !== 'string') {
    return ipfsUri;
  }
  
  // Already an HTTP URL
  if (ipfsUri.startsWith('http://') || ipfsUri.startsWith('https://')) {
    return ipfsUri;
  }
  
  // Handle ipfs:// protocol
  if (ipfsUri.startsWith('ipfs://')) {
    const path = ipfsUri.replace('ipfs://', '');
    return `${gateway}${path}`;
  }
  
  // Handle raw CID
  if (ipfsUri.match(/^Qm[a-zA-Z0-9]{44}/) || ipfsUri.match(/^bafy[a-zA-Z0-9]+/)) {
    return `${gateway}${ipfsUri}`;
  }
  
  return ipfsUri;
}

/**
 * Convert HTTP IPFS gateway URL back to ipfs:// URI
 * @param {string} httpUrl - HTTP gateway URL
 * @returns {string} IPFS URI or original URL if not IPFS
 */
export function httpToIpfs(httpUrl) {
  if (!httpUrl || typeof httpUrl !== 'string') {
    return httpUrl;
  }
  
  // Check each gateway pattern
  for (const gateway of IPFS_GATEWAYS) {
    if (httpUrl.startsWith(gateway)) {
      const cid = httpUrl.replace(gateway, '');
      return `ipfs://${cid}`;
    }
  }
  
  // Check for /ipfs/ path pattern
  const ipfsMatch = httpUrl.match(/\/ipfs\/([^/]+)(.*)$/);
  if (ipfsMatch) {
    return `ipfs://${ipfsMatch[1]}${ipfsMatch[2] || ''}`;
  }
  
  return httpUrl;
}

/**
 * Check if a URI is an IPFS URI
 * @param {string} uri - URI to check
 * @returns {boolean}
 */
export function isIpfsUri(uri) {
  if (!uri || typeof uri !== 'string') {
    return false;
  }
  
  return uri.startsWith('ipfs://') || 
    uri.match(/^Qm[a-zA-Z0-9]{44}/) !== null ||
    uri.match(/^bafy[a-zA-Z0-9]+/) !== null;
}

/**
 * Check if IPFS upload is available (client-side check)
 * @returns {Promise<boolean>}
 */
export async function isIpfsAvailable() {
  try {
    const response = await fetch('/api/ipfs/upload', { method: 'GET' });
    const data = await response.json();
    return data.configured === true;
  } catch {
    return false;
  }
}

/**
 * Upload to IPFS via API
 * @param {string} imageBase64 - Base64 encoded image data URL
 * @param {object} metadata - NFT metadata object
 * @returns {Promise<{metadataUri: string, imageUri: string}>}
 */
export async function uploadToIpfs(imageBase64, metadata) {
  const response = await fetch('/api/ipfs/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64, metadata }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    const error = new Error(data.message || 'IPFS upload failed');
    error.fallback = data.fallback;
    throw error;
  }
  
  return data;
}

/**
 * Get all available gateways
 * @returns {string[]}
 */
export function getIpfsGateways() {
  return [...IPFS_GATEWAYS];
}
