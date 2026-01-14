'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { Header } from '@/components/Header'
import { NetworkBanner } from '@/components/NetworkBanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { NFT_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID, isContractConfigured } from '@/lib/contractConfig'
import { TransferEventScanner, getNFTData } from '@/lib/nftClient'
import { truncateAddress } from '@/lib/nftUtils'
import { 
  getCacheKey, 
  loadCachedTokenIds, 
  mergeCacheWithScanned,
  removeTokenIdFromCache 
} from '@/lib/localNftCache'
import { 
  RefreshCw, 
  Plus, 
  Wallet, 
  AlertTriangle, 
  Loader2,
  ChevronDown,
  Search,
  Image as ImageIcon,
  Sparkles,
  Info,
  Database,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { isAddress } from 'viem'

// Environment check
const IS_DEV = process.env.NODE_ENV !== 'production'

// NFT Card with loading state
function NFTPreviewCard({ tokenId, nftData, isLoading, isCached }) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <div className="aspect-square relative">
          <Skeleton className="w-full h-full" />
        </div>
        <CardContent className="p-4">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  const name = nftData?.name || `NFT #${tokenId}`
  const image = nftData?.image || ''
  const attributes = nftData?.attributes || []
  
  // Extract key traits
  const coreType = attributes.find(a => a.trait_type === 'Core Type')?.value
  const rarityTier = attributes.find(a => a.trait_type === 'Rarity Tier')?.value

  return (
    <Link href={`/nft/${tokenId}`}>
      <Card className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden group">
        <div className="aspect-square relative bg-gradient-to-br from-purple-900/30 to-slate-900/30">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none'
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div 
            className={`absolute inset-0 flex flex-col items-center justify-center text-white/40 ${image ? 'hidden' : 'flex'}`}
          >
            <ImageIcon className="h-12 w-12" />
          </div>
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white/80">
            #{tokenId}
          </div>
          {rarityTier && (
            <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
              rarityTier === 'legendary' ? 'bg-yellow-500/80 text-yellow-900' :
              rarityTier === 'epic' ? 'bg-purple-500/80 text-white' :
              rarityTier === 'rare' ? 'bg-blue-500/80 text-white' :
              rarityTier === 'uncommon' ? 'bg-green-500/80 text-white' :
              'bg-gray-500/80 text-white'
            }`}>
              {rarityTier}
            </div>
          )}
          {/* Cached indicator */}
          {isCached && (
            <div className="absolute bottom-2 right-2 bg-blue-500/80 backdrop-blur-sm p-1 rounded" title="From local cache">
              <Database className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-white truncate">{name}</h3>
          {coreType && (
            <p className="text-sm text-purple-300 mt-1">{coreType}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

// Scan status component
function ScanStatus({ isScanning, progress, nftsFound, hasMore, onLoadMore, isVerified, cachedCount }) {
  return (
    <Card className="bg-white/5 border-white/10 mb-6">
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {isScanning ? (
              <>
                <Search className="h-5 w-5 text-purple-400 animate-pulse" />
                <span className="text-white">Scanning blockchain...</span>
              </>
            ) : isVerified ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="text-white">Found {nftsFound} NFT{nftsFound !== 1 ? 's' : ''} (verified)</span>
              </>
            ) : cachedCount > 0 ? (
              <>
                <Database className="h-5 w-5 text-blue-400" />
                <span className="text-white">Showing {cachedCount} cached NFT{cachedCount !== 1 ? 's' : ''}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-purple-400" />
                <span className="text-white">Ready to scan</span>
              </>
            )}
          </div>
          {!isScanning && (
            <Button
              onClick={onLoadMore}
              variant="outline"
              size="sm"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
            >
              {hasMore ? (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  {isVerified ? 'Load More' : 'Scan Blockchain'}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Rescan
                </>
              )}
            </Button>
          )}
        </div>
        
        {isScanning && (
          <div className="space-y-2">
            <Progress value={progress.percent} className="h-2" />
            <p className="text-xs text-white/40 text-center">
              Scanned ~{Math.round(progress.scanned / 1000)}k blocks
            </p>
          </div>
        )}
        
        {!isScanning && !isVerified && cachedCount > 0 && (
          <p className="text-xs text-blue-300/70 text-center">
            Showing cached NFTs. Click &quot;Scan Blockchain&quot; to verify ownership.
          </p>
        )}
        
        {!isScanning && hasMore && isVerified && (
          <p className="text-xs text-white/40 text-center">
            Click &quot;Load More&quot; to scan older blocks for additional NFTs
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function MyNFTsPage() {
  const { isConnected, address, chain } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  
  // Scanner state
  const scannerRef = useRef(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState({ scanned: 0, total: 0, percent: 0 })
  const [hasMoreBlocks, setHasMoreBlocks] = useState(true)
  
  // NFT state
  const [ownedTokenIds, setOwnedTokenIds] = useState([])
  const [cachedTokenIds, setCachedTokenIds] = useState([])
  const [nftDataMap, setNftDataMap] = useState({})
  const [loadingTokenIds, setLoadingTokenIds] = useState(new Set())
  
  // UI state
  const [error, setError] = useState('')
  const [hasScanned, setHasScanned] = useState(false)
  const [cacheKey, setCacheKey] = useState(null)

  // Derived state
  const isWrongNetwork = isConnected && chain?.id !== SEPOLIA_CHAIN_ID
  const hasValidContract = isContractConfigured() && isAddress(NFT_CONTRACT_ADDRESS)
  const canScan = isConnected && !isWrongNetwork && hasValidContract
  
  // Display token IDs (cached first, then merged with scanned)
  const displayTokenIds = hasScanned 
    ? ownedTokenIds 
    : cachedTokenIds.length > 0 
      ? cachedTokenIds 
      : ownedTokenIds

  // Initialize cache key and load cached data
  useEffect(() => {
    if (canScan && address && chain?.id) {
      const key = getCacheKey({
        chainId: chain.id,
        contract: NFT_CONTRACT_ADDRESS,
        wallet: address,
      })
      setCacheKey(key)
      
      // Load cached tokens immediately
      if (key) {
        const cached = loadCachedTokenIds(key)
        setCachedTokenIds(cached)
        if (IS_DEV && cached.length > 0) {
          console.log('[MyNFTs] Loaded cached tokens:', cached)
        }
      }
      
      // Initialize scanner
      scannerRef.current = new TransferEventScanner(address)
    } else {
      scannerRef.current = null
      setCacheKey(null)
      setCachedTokenIds([])
      setOwnedTokenIds([])
      setNftDataMap({})
      setHasScanned(false)
      setHasMoreBlocks(true)
    }
  }, [canScan, address, chain?.id])

  // Fetch NFT metadata for a token
  const fetchNFTMetadata = useCallback(async (tokenId) => {
    if (nftDataMap[tokenId] || loadingTokenIds.has(tokenId)) return
    
    setLoadingTokenIds(prev => new Set([...prev, tokenId]))
    
    try {
      const data = await getNFTData(tokenId)
      setNftDataMap(prev => ({ ...prev, [tokenId]: data }))
    } catch (err) {
      if (IS_DEV) console.error(`Failed to fetch NFT #${tokenId}:`, err)
      setNftDataMap(prev => ({
        ...prev,
        [tokenId]: {
          tokenId,
          name: `NFT #${tokenId}`,
          description: 'Failed to load metadata',
          image: '',
          error: true,
        }
      }))
    } finally {
      setLoadingTokenIds(prev => {
        const next = new Set(prev)
        next.delete(tokenId)
        return next
      })
    }
  }, [nftDataMap, loadingTokenIds])

  // Fetch metadata for displayed token IDs
  useEffect(() => {
    for (const tokenId of displayTokenIds) {
      if (!nftDataMap[tokenId] && !loadingTokenIds.has(tokenId)) {
        fetchNFTMetadata(tokenId)
      }
    }
  }, [displayTokenIds, nftDataMap, loadingTokenIds, fetchNFTMetadata])

  // Scan for NFTs
  const scanForNFTs = useCallback(async () => {
    if (!scannerRef.current || isScanning) return
    
    setIsScanning(true)
    setError('')
    
    try {
      const result = await scannerRef.current.scanNextChunk()
      
      // Merge scanned results with cache
      const mergedIds = cacheKey 
        ? mergeCacheWithScanned(cacheKey, result.ownedTokenIds)
        : result.ownedTokenIds
      
      setOwnedTokenIds(mergedIds)
      setScanProgress(result.progress)
      setHasMoreBlocks(result.hasMore)
      setHasScanned(true)
      
      // Remove any tokens that were transferred out
      if (cacheKey && cachedTokenIds.length > 0) {
        const ownedSet = new Set(result.ownedTokenIds)
        for (const cachedId of cachedTokenIds) {
          if (!ownedSet.has(cachedId)) {
            // Token was transferred out - remove from cache
            removeTokenIdFromCache(cacheKey, cachedId)
            if (IS_DEV) {
              console.log('[MyNFTs] Token transferred out, removed from cache:', cachedId)
            }
          }
        }
      }
      
      if (IS_DEV) {
        console.log('[MyNFTs] Scan result:', result)
        console.log('[MyNFTs] Merged token IDs:', mergedIds)
      }
    } catch (err) {
      if (IS_DEV) console.error('[MyNFTs] Scan error:', err)
      
      let errorMsg = 'Failed to scan blockchain for your NFTs'
      if (err.message?.includes('rate limit')) {
        errorMsg = 'Rate limited by RPC. Please wait a moment and try again.'
      } else if (err.message?.includes('network')) {
        errorMsg = 'Network error. Please check your connection.'
      }
      setError(errorMsg)
    } finally {
      setIsScanning(false)
    }
  }, [isScanning, cacheKey, cachedTokenIds])

  // Reset and rescan
  const handleRefresh = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.reset()
    }
    setOwnedTokenIds([])
    setNftDataMap({})
    setHasScanned(false)
    setHasMoreBlocks(true)
    setError('')
    
    // Reload cache
    if (cacheKey) {
      const cached = loadCachedTokenIds(cacheKey)
      setCachedTokenIds(cached)
    }
    
    // Trigger new scan
    setTimeout(() => scanForNFTs(), 100)
  }, [scanForNFTs, cacheKey])

  // Handle network switch
  const handleSwitchNetwork = () => {
    switchChain?.({ chainId: SEPOLIA_CHAIN_ID })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">My NFTs</h1>
            <p className="text-white/60 mt-1">
              {isConnected 
                ? `NFTs owned by ${truncateAddress(address)}` 
                : 'Connect your wallet to view your NFTs'}
            </p>
          </div>
          {canScan && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isScanning}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/generate">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create NFT
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Contract Not Configured Warning */}
        {!hasValidContract && (
          <Card className="bg-orange-500/10 border-orange-500/30 mb-6">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-orange-300">Contract Not Configured</h3>
                  <p className="text-sm text-orange-200/80 mt-1">
                    NFT contract address is not set. Please deploy the contract and configure NEXT_PUBLIC_NFT_CONTRACT_ADDRESS.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Not Connected */}
        {!isConnected && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-16 text-center">
              <Wallet className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
              <p className="text-white/60 max-w-md mx-auto">
                Connect your wallet to view your NFTs. We&apos;ll scan the blockchain for any NovaTok NFTs in your wallet.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Wrong Network */}
        {isConnected && isWrongNetwork && (
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-yellow-300 mb-2">Wrong Network</h2>
              <p className="text-yellow-200/80 mb-4">
                Please switch to Sepolia network to view your NFTs.
              </p>
              <Button
                onClick={handleSwitchNetwork}
                disabled={isSwitching}
                className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900"
              >
                {isSwitching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Switching...
                  </>
                ) : (
                  'Switch to Sepolia'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && canScan && (
          <Card className="bg-red-500/10 border-red-500/30 mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <p className="text-red-300">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="border-red-500/50 text-red-300 hover:bg-red-500/20"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scan Status & NFT Grid */}
        {canScan && (
          <>
            {/* Scan Status */}
            <ScanStatus
              isScanning={isScanning}
              progress={scanProgress}
              nftsFound={ownedTokenIds.length}
              hasMore={hasMoreBlocks}
              onLoadMore={hasMoreBlocks ? scanForNFTs : handleRefresh}
              isVerified={hasScanned}
              cachedCount={cachedTokenIds.length}
            />

            {/* NFT Grid */}
            {displayTokenIds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayTokenIds.map((tokenId) => (
                  <NFTPreviewCard
                    key={tokenId}
                    tokenId={tokenId}
                    nftData={nftDataMap[tokenId]}
                    isLoading={loadingTokenIds.has(tokenId) || !nftDataMap[tokenId]}
                    isCached={!hasScanned && cachedTokenIds.includes(tokenId)}
                  />
                ))}
              </div>
            ) : !isScanning && !cachedTokenIds.length ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-16 text-center">
                  <ImageIcon className="h-16 w-16 text-white/40 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">No NFTs Found</h2>
                  <p className="text-white/60 max-w-md mx-auto mb-6">
                    You don&apos;t own any NovaTok NFTs yet. Create your first one!
                  </p>
                  <Link href="/generate">
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Your First NFT
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : null}

            {/* Cache Info Note */}
            {cachedTokenIds.length > 0 && !hasScanned && !isScanning && (
              <Card className="bg-blue-500/10 border-blue-500/30 mt-6">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-300">Instant Loading Enabled</h4>
                      <p className="text-sm text-blue-200/80 mt-1">
                        Showing cached NFTs for instant access. Click &quot;Scan Blockchain&quot; to verify ownership and discover older NFTs.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Initial Loading State for Cached */}
        {canScan && cachedTokenIds.length > 0 && isScanning && !hasScanned && (
          <div className="text-center mt-4">
            <p className="text-white/40 text-sm">Verifying ownership on blockchain...</p>
          </div>
        )}
      </main>
    </div>
  )
}
