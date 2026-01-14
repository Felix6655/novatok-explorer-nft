'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAccount, useSwitchChain } from 'wagmi'
import { Header } from '@/components/Header'
import { NetworkBanner } from '@/components/NetworkBanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { NFT_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID, isContractConfigured } from '@/lib/contractConfig'
import { getTokenURI, getOwnerOf } from '@/lib/nftClient'
import { 
  truncateAddress, 
  toEtherscanTokenUrl, 
  toEtherscanAddressUrl,
  isImageUri,
  getNftErrorMessage,
  formatTokenUri
} from '@/lib/nftUtils'
import { 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  Wallet,
  Image as ImageIcon,
  Link as LinkIcon,
  FileJson
} from 'lucide-react'
import Link from 'next/link'
import { isAddress } from 'viem'

// Environment check
const IS_DEV = process.env.NODE_ENV !== 'production'

// Loading skeleton for NFT details
function NFTDetailSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Skeleton className="aspect-square rounded-xl" />
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-3/4" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

/**
 * Decode and parse tokenURI to extract metadata
 * Supports:
 * - data:application/json;base64,... (base64 encoded JSON)
 * - data:application/json,... (URL-encoded JSON)
 * - data:image/... (direct image data URI)
 * - http(s):// URLs pointing to JSON or images
 */
async function parseTokenURI(uri) {
  if (!uri || typeof uri !== 'string') {
    return { metadata: null, imageUrl: '', uriType: 'unknown' }
  }

  try {
    // Case 1: Base64 encoded JSON data URI
    if (uri.startsWith('data:application/json;base64,')) {
      const base64Data = uri.replace('data:application/json;base64,', '')
      // Decode base64 and handle Unicode
      const jsonString = decodeURIComponent(escape(atob(base64Data)))
      const metadata = JSON.parse(jsonString)
      return {
        metadata,
        imageUrl: metadata.image || '',
        uriType: 'json-base64'
      }
    }

    // Case 2: URL-encoded JSON data URI
    if (uri.startsWith('data:application/json,')) {
      const encodedJson = uri.replace('data:application/json,', '')
      const jsonString = decodeURIComponent(encodedJson)
      const metadata = JSON.parse(jsonString)
      return {
        metadata,
        imageUrl: metadata.image || '',
        uriType: 'json-urlencoded'
      }
    }

    // Case 3: Direct image data URI
    if (uri.startsWith('data:image/')) {
      return {
        metadata: null,
        imageUrl: uri,
        uriType: 'image-data'
      }
    }

    // Case 4: HTTP(S) URL
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      // Check if it's a direct image URL
      if (isImageUri(uri)) {
        return {
          metadata: null,
          imageUrl: uri,
          uriType: 'image-url'
        }
      }

      // Try to fetch as JSON
      try {
        const response = await fetch(uri)
        const contentType = response.headers.get('content-type') || ''
        
        if (contentType.includes('application/json') || uri.endsWith('.json')) {
          const metadata = await response.json()
          return {
            metadata,
            imageUrl: metadata.image || '',
            uriType: 'json-url'
          }
        } else if (contentType.includes('image/')) {
          return {
            metadata: null,
            imageUrl: uri,
            uriType: 'image-url'
          }
        } else {
          // Try parsing as JSON anyway
          const text = await response.text()
          try {
            const metadata = JSON.parse(text)
            return {
              metadata,
              imageUrl: metadata.image || '',
              uriType: 'json-url'
            }
          } catch {
            // Not JSON, treat as image
            return {
              metadata: null,
              imageUrl: uri,
              uriType: 'unknown-url'
            }
          }
        }
      } catch (fetchErr) {
        if (IS_DEV) console.error('[parseTokenURI] Fetch error:', fetchErr)
        // Fetch failed, maybe it's an image URL that doesn't allow CORS
        return {
          metadata: null,
          imageUrl: uri,
          uriType: 'image-url'
        }
      }
    }

    // Case 5: IPFS URI (ipfs://...)
    if (uri.startsWith('ipfs://')) {
      const httpUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
      return parseTokenURI(httpUrl)
    }

    // Fallback: treat as image URL
    return {
      metadata: null,
      imageUrl: uri,
      uriType: 'unknown'
    }
  } catch (err) {
    if (IS_DEV) console.error('[parseTokenURI] Error:', err)
    return {
      metadata: null,
      imageUrl: uri,
      uriType: 'error'
    }
  }
}

export default function NFTDetailPage() {
  const params = useParams()
  const tokenId = params.tokenId
  const { isConnected, address, chain } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  
  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tokenURI, setTokenURI] = useState('')
  const [owner, setOwner] = useState('')
  const [metadata, setMetadata] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [uriType, setUriType] = useState('')
  const [copiedField, setCopiedField] = useState('')

  // Derived state
  const isWrongNetwork = isConnected && chain?.id !== SEPOLIA_CHAIN_ID
  const hasValidContract = isContractConfigured() && isAddress(NFT_CONTRACT_ADDRESS)
  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase()

  // Copy to clipboard helper
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  // Fetch NFT data from chain
  const fetchNFTData = useCallback(async () => {
    if (!tokenId || !hasValidContract) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      // Fetch tokenURI and owner in parallel
      const [uri, ownerAddr] = await Promise.all([
        getTokenURI(parseInt(tokenId)),
        getOwnerOf(parseInt(tokenId))
      ])

      setTokenURI(uri)
      setOwner(ownerAddr)

      // Parse the tokenURI to extract metadata and image
      const parsed = await parseTokenURI(uri)
      setMetadata(parsed.metadata)
      setImageUrl(parsed.imageUrl)
      setUriType(parsed.uriType)

      if (IS_DEV) {
        console.log('[NFTDetail] URI type:', parsed.uriType)
        console.log('[NFTDetail] Metadata:', parsed.metadata)
      }

    } catch (err) {
      if (IS_DEV) console.error('Error fetching NFT:', err)
      setError(getNftErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [tokenId, hasValidContract])

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchNFTData()
  }, [fetchNFTData])

  // Handle network switch
  const handleSwitchNetwork = () => {
    switchChain?.({ chainId: SEPOLIA_CHAIN_ID })
  }

  // Get display name
  const displayName = metadata?.name || `NFT #${tokenId}`
  const description = metadata?.description || ''
  const attributes = metadata?.attributes || []
  const externalUrl = metadata?.external_url || ''

  // Get URI type label for display
  const getUriTypeLabel = () => {
    switch (uriType) {
      case 'json-base64': return 'On-chain JSON (base64)'
      case 'json-urlencoded': return 'On-chain JSON'
      case 'json-url': return 'External JSON'
      case 'image-data': return 'On-chain Image'
      case 'image-url': return 'External Image'
      default: return 'Unknown'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/my-nfts" className="inline-flex items-center text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My NFTs
          </Link>
          
          {!loading && !error && (
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchNFTData}
              className="text-white/60 hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>

        {/* Contract Not Configured */}
        {!hasValidContract && (
          <Card className="bg-orange-500/10 border-orange-500/30 mb-6">
            <CardContent className="py-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-orange-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-orange-300">Contract Not Configured</h3>
                  <p className="text-sm text-orange-200/80 mt-1">
                    NFT contract address is not set. Unable to load NFT details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wrong Network Warning */}
        {isWrongNetwork && hasValidContract && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-300">Wrong Network</h4>
                    <p className="text-sm text-yellow-200/80">
                      Switch to Sepolia to view ownership status
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleSwitchNetwork}
                  disabled={isSwitching}
                  variant="outline" 
                  className="border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/20 whitespace-nowrap"
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && hasValidContract && <NFTDetailSkeleton />}

        {/* Error State */}
        {error && !loading && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-300 mb-2">Unable to Load NFT</h3>
              <p className="text-red-200/80 mb-4">{error}</p>
              <Button
                variant="outline"
                onClick={fetchNFTData}
                className="border-red-500/50 text-red-300 hover:bg-red-500/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* NFT Details */}
        {!loading && !error && hasValidContract && tokenURI && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Image Section */}
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <div className="aspect-square relative bg-gradient-to-br from-purple-900/30 to-slate-900/30">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={displayName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      const fallback = e.target.nextSibling
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div 
                  className={`absolute inset-0 flex flex-col items-center justify-center text-white/40 ${imageUrl ? 'hidden' : ''}`}
                >
                  <ImageIcon className="h-16 w-16 mb-3" />
                  <span>No Image Available</span>
                </div>
              </div>
            </Card>

            {/* Details Section */}
            <div className="space-y-6">
              {/* Title & Badges */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium">
                    #{tokenId}
                  </span>
                  {isOwner && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">
                      You own this
                    </span>
                  )}
                  {uriType && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium flex items-center gap-1">
                      <FileJson className="h-3 w-3" />
                      {getUriTypeLabel()}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {displayName}
                </h1>
              </div>

              {/* Description */}
              {description && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-2">Description</h3>
                  <p className="text-white/80 leading-relaxed">{description}</p>
                </div>
              )}

              {/* Details Card */}
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 space-y-4">
                  {/* Owner */}
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Owner</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={toEtherscanAddressUrl(owner, SEPOLIA_CHAIN_ID)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-white hover:text-purple-300 transition-colors"
                      >
                        {truncateAddress(owner)}
                      </a>
                      <button
                        onClick={() => copyToClipboard(owner, 'owner')}
                        className="text-white/40 hover:text-white transition-colors"
                        title="Copy address"
                      >
                        {copiedField === 'owner' ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Token ID */}
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Token ID</span>
                    <span className="text-white font-mono">{tokenId}</span>
                  </div>

                  {/* Contract */}
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Contract</span>
                    <a
                      href={toEtherscanAddressUrl(NFT_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                    >
                      {truncateAddress(NFT_CONTRACT_ADDRESS)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* External URL (if present in metadata) */}
                  {externalUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">External URL</span>
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors truncate max-w-[200px]"
                      >
                        {externalUrl.replace(/^https?:\/\//, '').slice(0, 30)}...
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>
                  )}

                  {/* Token URI */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60">Token URI</span>
                      <div className="flex items-center gap-2">
                        {tokenURI.startsWith('http') && (
                          <a
                            href={tokenURI}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                            title="Open URI"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => copyToClipboard(tokenURI, 'uri')}
                          className="text-white/40 hover:text-white transition-colors"
                          title="Copy URI"
                        >
                          {copiedField === 'uri' ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <code className="text-xs text-white/60 bg-black/20 px-2 py-1 rounded block break-all">
                      {formatTokenUri(tokenURI, 80)}
                    </code>
                  </div>
                </CardContent>
              </Card>

              {/* Attributes */}
              {attributes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-3">Attributes</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {attributes.map((attr, i) => (
                      <Card key={i} className="bg-white/5 border-white/10">
                        <CardContent className="p-3">
                          <div className="text-xs text-purple-400 uppercase tracking-wide">
                            {attr.trait_type}
                          </div>
                          <div className="text-white font-medium mt-1">{attr.value}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Etherscan Link */}
              <a
                href={toEtherscanTokenUrl(NFT_CONTRACT_ADDRESS, tokenId, SEPOLIA_CHAIN_ID)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Etherscan
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Not Connected Message */}
        {!isConnected && !loading && !error && hasValidContract && tokenURI && (
          <Card className="bg-slate-500/10 border-slate-500/30 mt-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-slate-400" />
                <p className="text-slate-300 text-sm">
                  Connect your wallet to see if you own this NFT
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
