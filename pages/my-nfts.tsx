import { useState, useEffect, useCallback, useRef } from 'react'
import type { NextPage } from 'next'
import { Flex, Text, Box, Button } from 'components/primitives'
import Layout from 'components/Layout'
import { Head } from 'components/Head'
import { useAccount } from 'wagmi'
import { CHAIN_ID, CONTRACT_ADDRESS, RPC_URL, isExpectedChain, getExpectedChainName } from 'lib/config'
import WrongNetworkBanner from 'components/common/WrongNetworkBanner'
import NetworkBadge from 'components/common/NetworkBadge'
import { ConnectWalletButton } from 'components/ConnectWalletButton'
import Link from 'next/link'
import { useRouter } from 'next/router'

// ============================================
// TYPES
// ============================================

interface NFTMetadata {
  name?: string
  description?: string
  image?: string
  attributes?: Array<{ trait_type: string; value: string }>
}

interface NFTItem {
  tokenId: string
  tokenURI: string
  metadata: NFTMetadata | null
  error?: string
  isFeatured?: boolean
  featuredUntil?: string
}

type ScanMode = 'auto' | 'manual'

// ============================================
// HELPERS
// ============================================

const fetchMetadata = async (tokenURI: string): Promise<NFTMetadata | null> => {
  try {
    let url = tokenURI
    if (tokenURI.startsWith('ipfs://')) {
      url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }
    if (tokenURI.startsWith('data:application/json')) {
      const base64Match = tokenURI.match(/data:application\/json;base64,(.+)/)
      if (base64Match) {
        return JSON.parse(atob(base64Match[1]))
      }
      const jsonMatch = tokenURI.match(/data:application\/json,(.+)/)
      if (jsonMatch) {
        return JSON.parse(decodeURIComponent(jsonMatch[1]))
      }
    }
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch metadata')
    return await response.json()
  } catch {
    return null
  }
}

const getImageUrl = (metadata: NFTMetadata | null): string => {
  if (!metadata?.image) return ''
  if (metadata.image.startsWith('ipfs://')) {
    return metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
  }
  return metadata.image
}

const ethCall = async (to: string, data: string, rpcUrl: string): Promise<string> => {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to, data }, 'latest'],
    }),
  })
  const result = await response.json()
  if (result.error) throw new Error(result.error.message || 'RPC call failed')
  return result.result
}

const encodeFunctionCall = (name: string, args: (string | bigint)[]): string => {
  if (name === 'balanceOf') {
    return '0x70a08231' + (args[0] as string).slice(2).toLowerCase().padStart(64, '0')
  }
  if (name === 'tokenOfOwnerByIndex') {
    return '0x2f745c59' + (args[0] as string).slice(2).toLowerCase().padStart(64, '0') + BigInt(args[1]).toString(16).padStart(64, '0')
  }
  if (name === 'tokenURI') {
    return '0xc87b56dd' + BigInt(args[0]).toString(16).padStart(64, '0')
  }
  throw new Error(`Unknown function: ${name}`)
}

const decodeUint256 = (hex: string): bigint => (!hex || hex === '0x') ? 0n : BigInt(hex)

const decodeString = (hex: string): string => {
  if (!hex || hex === '0x' || hex.length < 130) return ''
  const cleanHex = hex.slice(2)
  const length = parseInt(cleanHex.slice(64, 128), 16)
  const dataHex = cleanHex.slice(128, 128 + length * 2)
  let result = ''
  for (let i = 0; i < dataHex.length; i += 2) {
    result += String.fromCharCode(parseInt(dataHex.slice(i, i + 2), 16))
  }
  return result
}

// ============================================
// COMPONENTS
// ============================================

const Dropdown = ({ 
  trigger, 
  children, 
  isOpen, 
  onClose 
}: { 
  trigger: React.ReactNode; 
  children: React.ReactNode; 
  isOpen: boolean;
  onClose: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  return (
    <Box ref={ref} css={{ position: 'relative' }}>
      {trigger}
      {isOpen && (
        <Box
          css={{
            position: 'absolute',
            top: '100%',
            right: 0,
            mt: '$2',
            p: '$2',
            minWidth: 220,
            background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(20, 20, 40, 0.98) 100%)',
            borderRadius: 12,
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            zIndex: 100,
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  )
}

const DropdownItem = ({ 
  children, 
  onClick, 
  icon,
  checked,
  price,
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  icon?: string;
  checked?: boolean;
  price?: string;
}) => (
  <Flex
    onClick={onClick}
    align="center"
    css={{
      gap: '$2',
      p: '$2',
      borderRadius: 8,
      cursor: 'pointer',
      '&:hover': { background: 'rgba(139, 92, 246, 0.15)' },
    }}
  >
    {checked !== undefined && (
      <Text css={{ width: 20, color: checked ? '#22c55e' : '$gray8' }}>
        {checked ? '✓' : '○'}
      </Text>
    )}
    {icon && <Text css={{ fontSize: 16 }}>{icon}</Text>}
    <Text style="body3" css={{ color: '$gray12', flex: 1 }}>{children}</Text>
    {price && (
      <Text style="body3" css={{ color: '$primary11', fontWeight: 600 }}>{price}</Text>
    )}
  </Flex>
)

const NFTCard = ({ 
  nft, 
  onBoost 
}: { 
  nft: NFTItem; 
  onBoost: (tokenId: string) => void;
}) => {
  const imageUrl = getImageUrl(nft.metadata)
  const isFeatured = nft.isFeatured && nft.featuredUntil && new Date(nft.featuredUntil) > new Date()

  return (
    <Box
      css={{
        background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 20, 40, 0.9) 100%)',
        borderRadius: 16,
        border: isFeatured ? '2px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: isFeatured ? 'rgba(251, 191, 36, 0.7)' : 'rgba(139, 92, 246, 0.5)',
          boxShadow: isFeatured 
            ? '0 8px 32px rgba(251, 191, 36, 0.2)' 
            : '0 8px 32px rgba(139, 92, 246, 0.2)',
        },
      }}
      data-testid={`nft-card-${nft.tokenId}`}
    >
      {/* Featured Badge */}
      {isFeatured && (
        <Box
          css={{
            position: 'absolute',
            top: '$2',
            left: '$2',
            px: '$2',
            py: '$1',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.9) 0%, rgba(245, 158, 11, 0.9) 100%)',
            borderRadius: 6,
            zIndex: 10,
          }}
        >
          <Text style="body3" css={{ color: '#1a1a1a', fontWeight: 700, fontSize: 10 }}>
            ⭐ FEATURED
          </Text>
        </Box>
      )}

      {/* Image */}
      <Box css={{ aspectRatio: '1', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', position: 'relative' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <Flex align="center" justify="center" css={{ width: '100%', height: '100%' }}>
            <Text css={{ fontSize: 48, opacity: 0.3 }}>🖼️</Text>
          </Flex>
        )}
      </Box>

      {/* Details */}
      <Box css={{ p: '$3' }}>
        <Text style="subtitle1" css={{ color: '$gray12', mb: '$1' }}>
          {nft.metadata?.name || `NFT #${nft.tokenId}`}
        </Text>
        <Text style="body3" css={{ color: '$gray10', mb: '$3' }}>
          Token ID: {nft.tokenId}
        </Text>

        {isFeatured ? (
          <Box
            css={{
              p: '$2',
              background: 'rgba(251, 191, 36, 0.1)',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <Text style="body3" css={{ color: '#fbbf24' }}>
              Featured on marketplace (7 days)
            </Text>
          </Box>
        ) : (
          <Button
            onClick={() => onBoost(nft.tokenId)}
            size="small"
            css={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%)',
              },
            }}
            data-testid={`boost-btn-${nft.tokenId}`}
          >
            Boost visibility
          </Button>
        )}
      </Box>
    </Box>
  )
}

const SuccessBanner = ({ onDismiss }: { onDismiss: () => void }) => (
  <Box
    css={{
      p: '$4',
      mb: '$5',
      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.1) 100%)',
      borderRadius: 16,
      border: '1px solid rgba(34, 197, 94, 0.3)',
    }}
  >
    <Flex justify="between" align="center" css={{ flexWrap: 'wrap', gap: '$3' }}>
      <Box>
        <Text style="h6" css={{ color: '#22c55e', mb: '$1' }}>🎉 Nice work!</Text>
        <Text style="body2" css={{ color: '$gray11' }}>
          Your NFTs are live on Sepolia.
        </Text>
      </Box>
      <Flex css={{ gap: '$2' }}>
        <Link href="/ethereum" passHref legacyBehavior>
          <Button as="a" size="small">View on Marketplace</Button>
        </Link>
        <Link href="/create-hub" passHref legacyBehavior>
          <Button as="a" size="small" color="secondary">Create another NFT</Button>
        </Link>
        <Button size="small" color="gray3" onClick={onDismiss}>×</Button>
      </Flex>
    </Flex>
  </Box>
)

// ============================================
// MAIN PAGE
// ============================================

const MyNFTsPage: NextPage = () => {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [nfts, setNfts] = useState<NFTItem[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [configError, setConfigError] = useState('')
  const [lastScanned, setLastScanned] = useState<Date | null>(null)
  const [scanMode, setScanMode] = useState<ScanMode>('auto')
  const [scanDropdownOpen, setScanDropdownOpen] = useState(false)
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)
  const [featureModalOpen, setFeatureModalOpen] = useState(false)
  const [selectedNftForFeature, setSelectedNftForFeature] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Check for success query param
  useEffect(() => {
    if (router.query.minted === 'true' || router.query.featured === 'success') {
      setShowSuccessBanner(true)
    }
    if (router.query.action === 'feature') {
      setFeatureModalOpen(true)
    }
  }, [router.query])

  // Check for missing configuration
  useEffect(() => {
    const errors: string[] = []
    if (!CONTRACT_ADDRESS) errors.push('NEXT_PUBLIC_CONTRACT_ADDRESS is not set')
    if (!RPC_URL) errors.push('NEXT_PUBLIC_RPC_URL is not set')
    if (!CHAIN_ID) errors.push('NEXT_PUBLIC_CHAIN_ID is not set')
    setConfigError(errors.join('. '))
  }, [])

  // Scan blockchain for NFTs
  const scanBlockchain = useCallback(async () => {
    if (!address || !CONTRACT_ADDRESS || !RPC_URL) {
      setScanError('Missing wallet address or contract configuration')
      return
    }

    setIsScanning(true)
    setScanError('')

    try {
      const balanceData = encodeFunctionCall('balanceOf', [address])
      const balanceResult = await ethCall(CONTRACT_ADDRESS, balanceData, RPC_URL)
      const balance = decodeUint256(balanceResult)

      if (balance === 0n) {
        setNfts([])
        setLastScanned(new Date())
        setIsScanning(false)
        return
      }

      const fetchedNFTs: NFTItem[] = []

      for (let i = 0n; i < balance; i++) {
        try {
          const tokenOfOwnerData = encodeFunctionCall('tokenOfOwnerByIndex', [address, i])
          const tokenIdResult = await ethCall(CONTRACT_ADDRESS, tokenOfOwnerData, RPC_URL)
          const tokenId = decodeUint256(tokenIdResult)

          const tokenURIData = encodeFunctionCall('tokenURI', [tokenId])
          const tokenURIResult = await ethCall(CONTRACT_ADDRESS, tokenURIData, RPC_URL)
          const tokenURI = decodeString(tokenURIResult)

          const metadata = tokenURI ? await fetchMetadata(tokenURI) : null

          // Check featured status
          let isFeatured = false
          let featuredUntil: string | undefined
          try {
            const featuredRes = await fetch(`/api/stripe/featured-status?nftId=${tokenId}`)
            const featuredData = await featuredRes.json()
            if (featuredData.ok && featuredData.is_featured) {
              isFeatured = true
              featuredUntil = featuredData.featured_until
            }
          } catch {
            // Ignore featured status errors
          }

          fetchedNFTs.push({
            tokenId: tokenId.toString(),
            tokenURI,
            metadata,
            isFeatured,
            featuredUntil,
          })
        } catch (err: any) {
          fetchedNFTs.push({
            tokenId: `unknown-${i}`,
            tokenURI: '',
            metadata: null,
            error: err.message || 'Failed to fetch token',
          })
        }
      }

      setNfts(fetchedNFTs)
      setLastScanned(new Date())
    } catch (err: any) {
      setScanError(err.message || 'Failed to scan blockchain')
    } finally {
      setIsScanning(false)
    }
  }, [address])

  // Auto scan on wallet connect if mode is auto
  useEffect(() => {
    if (isConnected && address && scanMode === 'auto' && !lastScanned && !configError) {
      scanBlockchain()
    }
  }, [isConnected, address, scanMode, lastScanned, configError, scanBlockchain])

  // Handle boost/feature NFT
  const handleBoost = async (tokenId: string) => {
    if (!address) return
    
    setIsProcessingPayment(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftId: tokenId,
          walletAddress: address,
          promotionType: 'feature_nft',
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Failed to create checkout session')
      }

      if (result.url) {
        window.location.href = result.url
      }
    } catch (err: any) {
      setScanError(err.message || 'Payment failed')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  return (
    <Layout>
      <Head title="My NFTs" />
      <WrongNetworkBanner />

      {/* Cosmic Background */}
      <Box
        css={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0f0f2a 100%)',
          zIndex: -1,
        }}
      />

      <Box css={{ maxWidth: 1200, mx: 'auto', p: '$4', pt: '$5' }}>
        {/* Success Banner */}
        {showSuccessBanner && <SuccessBanner onDismiss={() => setShowSuccessBanner(false)} />}

        {/* Header */}
        <Flex justify="between" align="center" css={{ mb: '$5', flexWrap: 'wrap', gap: '$3' }}>
          <Box>
            <Text style="h3" css={{ color: '$gray12', mb: '$1' }} data-testid="my-nfts-title">
              My NFTs
            </Text>
            <Text style="body2" css={{ color: '$gray10' }}>
              Manage your NFT collection on {getExpectedChainName()}
            </Text>
          </Box>

          <Flex css={{ gap: '$3' }}>
            {/* Scan Blockchain Dropdown */}
            <Dropdown
              isOpen={scanDropdownOpen}
              onClose={() => setScanDropdownOpen(false)}
              trigger={
                <Button
                  onClick={() => setScanDropdownOpen(!scanDropdownOpen)}
                  disabled={isScanning}
                  data-testid="scan-dropdown-btn"
                  css={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {isScanning ? 'Scanning...' : 'Scan Blockchain'} ▾
                </Button>
              }
            >
              <DropdownItem
                checked={scanMode === 'manual'}
                onClick={() => { setScanMode('manual'); setScanDropdownOpen(false) }}
              >
                Manual Scan
              </DropdownItem>
              <DropdownItem
                checked={scanMode === 'auto'}
                onClick={() => { setScanMode('auto'); setScanDropdownOpen(false) }}
              >
                Auto Scan
              </DropdownItem>
              <Box css={{ height: 1, background: 'rgba(255,255,255,0.1)', my: '$2' }} />
              <DropdownItem
                icon="⟳"
                onClick={() => { scanBlockchain(); setScanDropdownOpen(false) }}
              >
                Rescan Now
              </DropdownItem>
            </Dropdown>

            {/* Create NFT Dropdown */}
            <Dropdown
              isOpen={createDropdownOpen}
              onClose={() => setCreateDropdownOpen(false)}
              trigger={
                <Button
                  onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
                  data-testid="create-dropdown-btn"
                  css={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  }}
                >
                  Create NFT ▾
                </Button>
              }
            >
              <Link href="/create-hub" passHref legacyBehavior>
                <DropdownItem icon="🎨" onClick={() => setCreateDropdownOpen(false)}>
                  Generate NFT
                </DropdownItem>
              </Link>
              <Link href="/mint" passHref legacyBehavior>
                <DropdownItem icon="⛏️" onClick={() => setCreateDropdownOpen(false)}>
                  Mint NFT
                </DropdownItem>
              </Link>
              <Box css={{ height: 1, background: 'rgba(255,255,255,0.1)', my: '$2' }} />
              <DropdownItem
                icon="⭐"
                price="$9"
                onClick={() => {
                  setCreateDropdownOpen(false)
                  if (nfts.length > 0) {
                    handleBoost(nfts[0].tokenId)
                  } else {
                    setScanError('Mint an NFT first to feature it')
                  }
                }}
              >
                Feature NFT
              </DropdownItem>
            </Dropdown>
          </Flex>
        </Flex>

        <Flex align="center" css={{ gap: '$3', mb: '$4' }}>
          <NetworkBadge />
          {lastScanned && (
            <Text style="body3" css={{ color: '$gray10' }}>
              Last scanned: {lastScanned.toLocaleTimeString()}
            </Text>
          )}
        </Flex>

        {/* Config Error */}
        {configError && (
          <Box
            css={{
              p: '$4',
              mb: '$4',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 12,
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
            data-testid="config-error"
          >
            <Text style="subtitle2" css={{ color: '#f87171', mb: '$2' }}>⚠️ Configuration Error</Text>
            <Text style="body3" css={{ color: '#f87171' }}>{configError}</Text>
          </Box>
        )}

        {/* Scan Error */}
        {scanError && (
          <Box
            css={{
              p: '$3',
              mb: '$4',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 12,
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
            data-testid="scan-error"
          >
            <Text style="body2" css={{ color: '#f87171' }}>Error: {scanError}</Text>
          </Box>
        )}

        {/* Not Connected */}
        {!isConnected && (
          <Box
            css={{
              p: '$6',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
              borderRadius: 16,
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
            data-testid="connect-wallet-prompt"
          >
            <Text css={{ fontSize: 48, mb: '$3' }}>🔗</Text>
            <Text style="h5" css={{ color: '$gray12', mb: '$2' }}>Connect Your Wallet</Text>
            <Text style="body2" css={{ color: '$gray10', mb: '$4' }}>
              Connect your wallet to view your NFTs on {getExpectedChainName()}
            </Text>
            <ConnectWalletButton />
          </Box>
        )}

        {/* NFT Grid */}
        {isConnected && nfts.length > 0 && (
          <Box
            css={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '$4',
            }}
            data-testid="nft-grid"
          >
            {nfts.map((nft) => (
              <NFTCard key={nft.tokenId} nft={nft} onBoost={handleBoost} />
            ))}
          </Box>
        )}

        {/* Empty State */}
        {isConnected && !isScanning && lastScanned && nfts.length === 0 && !scanError && (
          <Box
            css={{
              p: '$6',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)',
              borderRadius: 16,
              border: '2px dashed rgba(139, 92, 246, 0.3)',
            }}
            data-testid="empty-state"
          >
            <Text css={{ fontSize: 48, mb: '$3' }}>🎨</Text>
            <Text style="h6" css={{ color: '$gray12', mb: '$2' }}>No NFTs Found</Text>
            <Text style="body2" css={{ color: '$gray10', mb: '$4' }}>
              You don&apos;t own any NFTs from this contract on {getExpectedChainName()}.
            </Text>
            <Link href="/create-hub" passHref legacyBehavior>
              <Button as="a" data-testid="mint-first-nft-btn">
                Create Your First NFT
              </Button>
            </Link>
          </Box>
        )}

        {/* Initial State */}
        {isConnected && !isScanning && !lastScanned && scanMode === 'manual' && (
          <Box
            css={{
              p: '$6',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)',
              borderRadius: 16,
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
            data-testid="initial-state"
          >
            <Text css={{ fontSize: 48, mb: '$3' }}>🔍</Text>
            <Text style="body1" css={{ color: '$gray11' }}>
              Click &quot;Scan Blockchain&quot; → &quot;Rescan Now&quot; to fetch your NFTs.
            </Text>
          </Box>
        )}

        {/* Loading State */}
        {isScanning && (
          <Flex
            direction="column"
            align="center"
            justify="center"
            css={{ py: '$6' }}
          >
            <Box
              css={{
                width: 48,
                height: 48,
                border: '3px solid rgba(139, 92, 246, 0.2)',
                borderTopColor: '#8b5cf6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
            <Text style="body2" css={{ color: '$gray10', mt: '$3' }}>
              Scanning blockchain...
            </Text>
          </Flex>
        )}
      </Box>
    </Layout>
  )
}

export default MyNFTsPage
