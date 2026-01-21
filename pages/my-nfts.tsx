import { useState, useEffect, useCallback } from 'react'
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

// ERC721 ABI fragments for reading NFT data
const ERC721_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tokenOfOwnerByIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

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
}

const MyNFTsPage: NextPage = () => {
  const { address, isConnected } = useAccount()
  const [nfts, setNfts] = useState<NFTItem[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [configError, setConfigError] = useState('')
  const [lastScanned, setLastScanned] = useState<Date | null>(null)

  // Check for missing configuration
  useEffect(() => {
    const errors: string[] = []
    if (!CONTRACT_ADDRESS) {
      errors.push('NEXT_PUBLIC_CONTRACT_ADDRESS is not set')
    }
    if (!RPC_URL) {
      errors.push('NEXT_PUBLIC_RPC_URL is not set')
    }
    if (!CHAIN_ID) {
      errors.push('NEXT_PUBLIC_CHAIN_ID is not set')
    }
    setConfigError(errors.join('. '))
  }, [])

  // Fetch metadata from tokenURI
  const fetchMetadata = async (tokenURI: string): Promise<NFTMetadata | null> => {
    try {
      let url = tokenURI

      // Handle IPFS URLs
      if (tokenURI.startsWith('ipfs://')) {
        url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
      }

      // Handle data URIs
      if (tokenURI.startsWith('data:application/json')) {
        const base64Match = tokenURI.match(/data:application\/json;base64,(.+)/)
        if (base64Match) {
          const decoded = atob(base64Match[1])
          return JSON.parse(decoded)
        }
        const jsonMatch = tokenURI.match(/data:application\/json,(.+)/)
        if (jsonMatch) {
          return JSON.parse(decodeURIComponent(jsonMatch[1]))
        }
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch metadata')
      return await response.json()
    } catch (err) {
      console.error('Error fetching metadata:', err)
      return null
    }
  }

  // Convert image URL (handle IPFS)
  const getImageUrl = (metadata: NFTMetadata | null): string => {
    if (!metadata?.image) return ''
    if (metadata.image.startsWith('ipfs://')) {
      return metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }
    if (metadata.image.startsWith('data:')) {
      return metadata.image
    }
    return metadata.image
  }

  // Perform eth_call via RPC
  const ethCall = async (to: string, data: string): Promise<string> => {
    const response = await fetch(RPC_URL, {
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
    if (result.error) {
      throw new Error(result.error.message || 'RPC call failed')
    }
    return result.result
  }

  // Encode function call
  const encodeFunctionCall = (name: string, args: (string | bigint)[]): string => {
    // Simple ABI encoding for our specific functions
    if (name === 'balanceOf') {
      const selector = '0x70a08231' // keccak256("balanceOf(address)")[:4]
      const paddedAddr = (args[0] as string).slice(2).toLowerCase().padStart(64, '0')
      return selector + paddedAddr
    }
    if (name === 'tokenOfOwnerByIndex') {
      const selector = '0x2f745c59' // keccak256("tokenOfOwnerByIndex(address,uint256)")[:4]
      const paddedAddr = (args[0] as string).slice(2).toLowerCase().padStart(64, '0')
      const paddedIndex = BigInt(args[1]).toString(16).padStart(64, '0')
      return selector + paddedAddr + paddedIndex
    }
    if (name === 'tokenURI') {
      const selector = '0xc87b56dd' // keccak256("tokenURI(uint256)")[:4]
      const paddedTokenId = BigInt(args[0]).toString(16).padStart(64, '0')
      return selector + paddedTokenId
    }
    throw new Error(`Unknown function: ${name}`)
  }

  // Decode uint256 from hex result
  const decodeUint256 = (hex: string): bigint => {
    if (!hex || hex === '0x') return 0n
    return BigInt(hex)
  }

  // Decode string from hex result
  const decodeString = (hex: string): string => {
    if (!hex || hex === '0x' || hex.length < 130) return ''
    // ABI encoded string: offset (32 bytes) + length (32 bytes) + data
    const cleanHex = hex.slice(2) // remove 0x
    const lengthHex = cleanHex.slice(64, 128)
    const length = parseInt(lengthHex, 16)
    const dataHex = cleanHex.slice(128, 128 + length * 2)
    let result = ''
    for (let i = 0; i < dataHex.length; i += 2) {
      result += String.fromCharCode(parseInt(dataHex.slice(i, i + 2), 16))
    }
    return result
  }

  // Scan blockchain for NFTs
  const scanBlockchain = useCallback(async () => {
    if (!address || !CONTRACT_ADDRESS || !RPC_URL) {
      setScanError('Missing wallet address or contract configuration')
      return
    }

    setIsScanning(true)
    setScanError('')
    setNfts([])

    try {
      // Get balance
      const balanceData = encodeFunctionCall('balanceOf', [address])
      const balanceResult = await ethCall(CONTRACT_ADDRESS, balanceData)
      const balance = decodeUint256(balanceResult)

      if (balance === 0n) {
        setNfts([])
        setLastScanned(new Date())
        setIsScanning(false)
        return
      }

      const fetchedNFTs: NFTItem[] = []

      // Fetch each token
      for (let i = 0n; i < balance; i++) {
        try {
          // Get tokenId at index
          const tokenOfOwnerData = encodeFunctionCall('tokenOfOwnerByIndex', [address, i])
          const tokenIdResult = await ethCall(CONTRACT_ADDRESS, tokenOfOwnerData)
          const tokenId = decodeUint256(tokenIdResult)

          // Get tokenURI
          const tokenURIData = encodeFunctionCall('tokenURI', [tokenId])
          const tokenURIResult = await ethCall(CONTRACT_ADDRESS, tokenURIData)
          const tokenURI = decodeString(tokenURIResult)

          // Fetch metadata
          const metadata = tokenURI ? await fetchMetadata(tokenURI) : null

          fetchedNFTs.push({
            tokenId: tokenId.toString(),
            tokenURI,
            metadata,
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
      console.error('Scan error:', err)
      setScanError(err.message || 'Failed to scan blockchain')
    } finally {
      setIsScanning(false)
    }
  }, [address])

  return (
    <Layout>
      <Head title="My NFTs" />
      <WrongNetworkBanner />
      <Flex direction="column" css={{ maxWidth: 1200, mx: 'auto', p: '$4', gap: '$4' }}>
        <Flex justify="between" align="center" css={{ flexWrap: 'wrap', gap: '$3' }}>
          <Text style="h4" data-testid="my-nfts-title">My NFTs</Text>
          <NetworkBadge />
        </Flex>

        {/* Config Error */}
        {configError && (
          <Box
            data-testid="config-error"
            css={{
              p: '$4',
              background: '#fef2f2',
              borderRadius: 8,
              border: '1px solid #fca5a5',
            }}
          >
            <Text style="subtitle2" css={{ color: '#991b1b', mb: '$2' }}>
              ⚠️ Configuration Error
            </Text>
            <Text style="body2" css={{ color: '#991b1b' }}>
              {configError}
            </Text>
            <Text style="body3" css={{ color: '#b91c1c', mt: '$2' }}>
              Please set the required environment variables in your .env file.
            </Text>
          </Box>
        )}

        {/* Not Connected */}
        {!isConnected && (
          <Flex
            direction="column"
            align="center"
            css={{ py: '$6', gap: '$4' }}
            data-testid="connect-wallet-prompt"
          >
            <Text style="body1" css={{ color: '$gray11', textAlign: 'center' }}>
              Connect your wallet to view your NFTs on {getExpectedChainName()}
            </Text>
            <ConnectWalletButton />
          </Flex>
        )}

        {/* Connected - Show Scan UI */}
        {isConnected && !configError && (
          <>
            <Flex css={{ gap: '$3', flexWrap: 'wrap' }} align="center">
              <Button
                onClick={scanBlockchain}
                disabled={isScanning}
                data-testid="scan-blockchain-btn"
              >
                {isScanning ? 'Scanning...' : 'Scan Blockchain'}
              </Button>
              <Link href="/mint" passHref legacyBehavior>
                <Button as="a" color="secondary" data-testid="mint-new-btn">
                  Mint New NFT
                </Button>
              </Link>
              {lastScanned && (
                <Text style="body3" css={{ color: '$gray10' }}>
                  Last scanned: {lastScanned.toLocaleTimeString()}
                </Text>
              )}
            </Flex>

            <Text style="body2" css={{ color: '$gray11' }}>
              Contract: <code style={{ fontSize: 12 }}>{CONTRACT_ADDRESS || 'Not configured'}</code>
            </Text>

            {/* Scan Error */}
            {scanError && (
              <Box
                data-testid="scan-error"
                css={{
                  p: '$3',
                  background: '#fef2f2',
                  borderRadius: 8,
                  border: '1px solid #fca5a5',
                }}
              >
                <Text style="body2" css={{ color: '#991b1b' }}>
                  Error: {scanError}
                </Text>
              </Box>
            )}

            {/* NFT Grid */}
            {nfts.length > 0 && (
              <Box
                css={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '$4',
                }}
                data-testid="nft-grid"
              >
                {nfts.map((nft) => (
                  <Box
                    key={nft.tokenId}
                    data-testid={`nft-card-${nft.tokenId}`}
                    css={{
                      background: '$gray2',
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '1px solid $gray5',
                    }}
                  >
                    {/* Image */}
                    <Box css={{ aspectRatio: '1', background: '$gray4', position: 'relative' }}>
                      {nft.metadata?.image ? (
                        <img
                          src={getImageUrl(nft.metadata)}
                          alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <Flex
                          align="center"
                          justify="center"
                          css={{ width: '100%', height: '100%' }}
                        >
                          <Text style="body2" css={{ color: '$gray9' }}>
                            No Image
                          </Text>
                        </Flex>
                      )}
                    </Box>

                    {/* Details */}
                    <Box css={{ p: '$3' }}>
                      <Text style="subtitle1" css={{ mb: '$1' }}>
                        {nft.metadata?.name || `NFT #${nft.tokenId}`}
                      </Text>
                      <Text style="body3" css={{ color: '$gray10' }}>
                        Token ID: {nft.tokenId}
                      </Text>
                      {nft.metadata?.description && (
                        <Text
                          style="body3"
                          css={{
                            color: '$gray11',
                            mt: '$2',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {nft.metadata.description}
                        </Text>
                      )}
                      {nft.error && (
                        <Text style="body3" css={{ color: '#ef4444', mt: '$2' }}>
                          Error: {nft.error}
                        </Text>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* Empty State */}
            {!isScanning && lastScanned && nfts.length === 0 && !scanError && (
              <Flex
                direction="column"
                align="center"
                css={{ py: '$6', gap: '$3' }}
                data-testid="empty-state"
              >
                <Text style="h6" css={{ color: '$gray11' }}>
                  No NFTs Found
                </Text>
                <Text style="body2" css={{ color: '$gray10', textAlign: 'center' }}>
                  You don&apos;t own any NFTs from this contract on {getExpectedChainName()}.
                </Text>
                <Link href="/mint" passHref legacyBehavior>
                  <Button as="a" data-testid="mint-first-nft-btn">
                    Mint Your First NFT
                  </Button>
                </Link>
              </Flex>
            )}

            {/* Initial State */}
            {!isScanning && !lastScanned && (
              <Flex
                direction="column"
                align="center"
                css={{ py: '$6', gap: '$3' }}
                data-testid="initial-state"
              >
                <Text style="body1" css={{ color: '$gray11', textAlign: 'center' }}>
                  Click &quot;Scan Blockchain&quot; to fetch your NFTs from the contract.
                </Text>
              </Flex>
            )}
          </>
        )}
      </Flex>
    </Layout>
  )
}

export default MyNFTsPage
