/**
 * Local NFT Cache Utility
 * Stores minted NFT token IDs locally per wallet/chain/contract
 * for instant loading on the My NFTs page
 */

// Environment check
const IS_DEV = process.env.NODE_ENV !== 'production'

// Storage key prefix
const STORAGE_PREFIX = 'novatok_nft_cache_'

/**
 * Generate a unique cache key for wallet/chain/contract combination
 * @param {object} params - { chainId, contract, wallet }
 * @returns {string} Cache key
 */
export function getCacheKey({ chainId, contract, wallet }) {
  if (!chainId || !contract || !wallet) {
    return null
  }
  
  const normalizedContract = contract.toLowerCase()
  const normalizedWallet = wallet.toLowerCase()
  
  return `${STORAGE_PREFIX}${chainId}_${normalizedContract}_${normalizedWallet}`
}

/**
 * Check if localStorage is available
 */
function isStorageAvailable() {
  if (typeof window === 'undefined') return false
  
  try {
    const testKey = '__storage_test__'
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Load cached token IDs for a given cache key
 * @param {string} key - Cache key from getCacheKey
 * @returns {number[]} Array of token IDs (sorted newest first)
 */
export function loadCachedTokenIds(key) {
  if (!key || !isStorageAvailable()) {
    return []
  }
  
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return []
    
    const data = JSON.parse(stored)
    
    // Validate data structure
    if (!data || !Array.isArray(data.tokenIds)) {
      return []
    }
    
    // Return sorted (newest/highest first)
    return [...data.tokenIds].sort((a, b) => b - a)
  } catch (err) {
    if (IS_DEV) console.error('[LocalNftCache] Load error:', err)
    return []
  }
}

/**
 * Save token IDs to cache
 * @param {string} key - Cache key
 * @param {number[]} tokenIds - Array of token IDs
 */
function saveCachedTokenIds(key, tokenIds) {
  if (!key || !isStorageAvailable()) return
  
  try {
    const data = {
      tokenIds,
      updatedAt: Date.now(),
    }
    window.localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    if (IS_DEV) console.error('[LocalNftCache] Save error:', err)
  }
}

/**
 * Add a token ID to the cache (deduplicates)
 * @param {string} key - Cache key
 * @param {number} tokenId - Token ID to add
 */
export function addTokenIdToCache(key, tokenId) {
  if (!key || tokenId === null || tokenId === undefined) return
  
  const numericId = Number(tokenId)
  if (isNaN(numericId)) return
  
  const existing = loadCachedTokenIds(key)
  
  // Check if already exists
  if (existing.includes(numericId)) {
    if (IS_DEV) console.log('[LocalNftCache] Token already in cache:', numericId)
    return
  }
  
  // Add and save
  const updated = [numericId, ...existing]
  saveCachedTokenIds(key, updated)
  
  if (IS_DEV) console.log('[LocalNftCache] Added token to cache:', numericId)
}

/**
 * Remove a token ID from the cache
 * @param {string} key - Cache key
 * @param {number} tokenId - Token ID to remove
 */
export function removeTokenIdFromCache(key, tokenId) {
  if (!key || tokenId === null || tokenId === undefined) return
  
  const numericId = Number(tokenId)
  if (isNaN(numericId)) return
  
  const existing = loadCachedTokenIds(key)
  const updated = existing.filter(id => id !== numericId)
  
  if (updated.length !== existing.length) {
    saveCachedTokenIds(key, updated)
    if (IS_DEV) console.log('[LocalNftCache] Removed token from cache:', numericId)
  }
}

/**
 * Merge scanned token IDs with cached ones
 * Updates cache with verified ownership
 * @param {string} key - Cache key
 * @param {number[]} scannedIds - Token IDs from blockchain scan
 * @returns {number[]} Merged and deduplicated token IDs
 */
export function mergeCacheWithScanned(key, scannedIds) {
  if (!key) return scannedIds || []
  
  // Get cached IDs
  const cachedIds = loadCachedTokenIds(key)
  
  // Merge and deduplicate
  const mergedSet = new Set([...scannedIds, ...cachedIds])
  const merged = Array.from(mergedSet).sort((a, b) => b - a)
  
  // Update cache with merged result
  saveCachedTokenIds(key, merged)
  
  return merged
}

/**
 * Sync cache with blockchain scan results
 * Removes tokens that were transferred out
 * @param {string} key - Cache key  
 * @param {number[]} verifiedOwnedIds - Token IDs verified as owned from scan
 */
export function syncCacheWithVerified(key, verifiedOwnedIds) {
  if (!key) return
  
  const verifiedSet = new Set(verifiedOwnedIds)
  const cached = loadCachedTokenIds(key)
  
  // Filter out any cached IDs that aren't in verified list
  // But only if we have verified data (non-empty scan result)
  if (verifiedOwnedIds.length > 0) {
    const synced = cached.filter(id => verifiedSet.has(id))
    
    // Also add any verified IDs not in cache
    for (const id of verifiedOwnedIds) {
      if (!synced.includes(id)) {
        synced.push(id)
      }
    }
    
    synced.sort((a, b) => b - a)
    saveCachedTokenIds(key, synced)
  }
}

/**
 * Clear cache for a specific key
 * @param {string} key - Cache key
 */
export function clearCache(key) {
  if (!key || !isStorageAvailable()) return
  
  try {
    window.localStorage.removeItem(key)
    if (IS_DEV) console.log('[LocalNftCache] Cache cleared')
  } catch (err) {
    if (IS_DEV) console.error('[LocalNftCache] Clear error:', err)
  }
}

/**
 * Get cache metadata (for debugging)
 * @param {string} key - Cache key
 * @returns {object|null} Cache metadata
 */
export function getCacheInfo(key) {
  if (!key || !isStorageAvailable()) return null
  
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return null
    
    const data = JSON.parse(stored)
    return {
      count: data.tokenIds?.length || 0,
      updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : null,
    }
  } catch {
    return null
  }
}
