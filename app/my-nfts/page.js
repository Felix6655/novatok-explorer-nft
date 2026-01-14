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
  RefreshCw, 
  Plus, 
  Wallet, 
  AlertTriangle, 
  Loader2,
  ChevronDown,
  Search,
  Image as ImageIcon,
  Sparkles,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { isAddress } from 'viem'

// Environment check
const IS_DEV = process.env.NODE_ENV !== 'production'

// NFT Card with loading state
function NFTPreviewCard({ tokenId, nftData, isLoading }) {
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
function ScanStatus({ isScanning, progress, blocksScanned, nftsFound, hasMore, onLoadMore }) {
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
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-green-400" />
                <span className="text-white">Found {nftsFound} NFT{nftsFound !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>
          {!isScanning && hasMore && (
            <Button
              onClick={onLoadMore}
              variant="outline"
              size="sm"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
            >
              <ChevronDown className="h-4 w-4 mr-1" />
              Load More
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
        
        {!isScanning && hasMore && (
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
  const [nftDataMap, setNftDataMap] = useState({})
  const [loadingTokenIds, setLoadingTokenIds] = useState(new Set())
  
  // UI state
  const [error, setError] = useState('')
  const [initialScanDone, setInitialScanDone] = useState(false)

  // Derived state
  const isWrongNetwork = isConnected && chain?.id !== SEPOLIA_CHAIN_ID
  const hasValidContract = isContractConfigured() && isAddress(NFT_CONTRACT_ADDRESS)
  const canScan = isConnected && !isWrongNetwork && hasValidContract

  // Initialize scanner when wallet connects
  useEffect(() => {
    if (canScan && address) {
      scannerRef.current = new TransferEventScanner(address)
    } else {
      scannerRef.current = null;
      setOwnedTokenIds([])
      setNftDataMap({})
      setInitialScanDone(false)
      setHasMoreBlocks(true)
    }
  }, [canScan, address])

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

  // Fetch metadata for new token IDs
  useEffect(() => {
    for (const tokenId of ownedTokenIds) {
      if (!nftDataMap[tokenId] && !loadingTokenIds.has(tokenId)) {
        fetchNFTMetadata(tokenId)
      }
    }
  }, [ownedTokenIds, nftDataMap, loadingTokenIds, fetchNFTMetadata])

  // Scan for NFTs
  const scanForNFTs = useCallback(async () => {
    if (!scannerRef.current || isScanning) return
    
    setIsScanning(true)
    setError('')
    
    try {
      const result = await scannerRef.current.scanNextChunk()
      
      setOwnedTokenIds(result.ownedTokenIds)
      setScanProgress(result.progress)
      setHasMoreBlocks(result.hasMore)
      setInitialScanDone(true)
      
      if (IS_DEV) {
        console.log('[MyNFTs] Scan result:', result)
      }
    } catch (err) {
      if (IS_DEV) console.error('[MyNFTs] Scan error:', err)
      
      // Provide user-friendly error message
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
  }, [isScanning])

  // Initial scan on mount
  useEffect(() => {
    if (canScan && !initialScanDone && !isScanning) {
      scanForNFTs()
    }
  }, [canScan, initialScanDone, isScanning, scanForNFTs])

  // Reset and rescan
  const handleRefresh = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.reset()
    }
    setOwnedTokenIds([])
    setNftDataMap({})
    setInitialScanDone(false)
    setHasMoreBlocks(true)
    setError('')
    
    // Trigger new scan
    setTimeout(() => scanForNFTs(), 100)
  }, [scanForNFTs])

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
                Connect your wallet to view your NFTs. We'll scan the blockchain for any NovaTok NFTs in your wallet.
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
        {canScan && initialScanDone && (
          <>
            {/* Scan Status */}
            <ScanStatus
              isScanning={isScanning}
              progress={scanProgress}
              nftsFound={ownedTokenIds.length}
              hasMore={hasMoreBlocks}
              onLoadMore={scanForNFTs}
            />

            {/* NFT Grid */}
            {ownedTokenIds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {ownedTokenIds.map((tokenId) => (
                  <NFTPreviewCard
                    key={tokenId}
                    tokenId={tokenId}
                    nftData={nftDataMap[tokenId]}
                    isLoading={loadingTokenIds.has(tokenId) || !nftDataMap[tokenId]}
                  />
                ))}
              </div>
            ) : !isScanning ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-16 text-center">
                  <ImageIcon className="h-16 w-16 text-white/40 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">No NFTs Found</h2>
                  <p className="text-white/60 max-w-md mx-auto mb-6">
                    You don't own any NovaTok NFTs yet. Create your first one!
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

            {/* Performance Note */}
            {hasMoreBlocks && !isScanning && ownedTokenIds.length === 0 && (
              <Card className="bg-blue-500/10 border-blue-500/30 mt-6">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-300">Tip: Event Scanning</h4>
                      <p className="text-sm text-blue-200/80 mt-1">
                        We scan the blockchain in chunks to find your NFTs. If you recently minted an NFT but don't see it, 
                        click "Load More" to scan additional blocks, or wait a moment for the transaction to be indexed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Initial Scanning State */}
        {canScan && !initialScanDone && isScanning && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-16 text-center">
              <Loader2 className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-white mb-2">Scanning Blockchain</h2>
              <p className="text-white/60 max-w-md mx-auto mb-4">
                Looking for your NovaTok NFTs on Sepolia...
              </p>
              <Progress value={scanProgress.percent} className="max-w-xs mx-auto h-2" />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
