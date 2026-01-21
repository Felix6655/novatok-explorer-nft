import { useState, useEffect, useRef } from 'react'
import type { NextPage } from 'next'
import { Flex, Text, Box, Button, Input } from 'components/primitives'
import Layout from 'components/Layout'
import { Head } from 'components/Head'
import { useAccount } from 'wagmi'
import { CHAIN_ID, CONTRACT_ADDRESS, isExpectedChain, getExpectedChainName } from 'lib/config'
import WrongNetworkBanner from 'components/common/WrongNetworkBanner'
import NetworkBadge from 'components/common/NetworkBadge'
import Link from 'next/link'

const MintPage: NextPage = () => {
  const { address, isConnected } = useAccount()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  
  // UI state
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [mintResult, setMintResult] = useState<{ success: boolean; txHash?: string; message: string } | null>(null)
  const [error, setError] = useState('')
  const [configError, setConfigError] = useState('')

  // Check configuration on mount
  useEffect(() => {
    if (!CONTRACT_ADDRESS) {
      setConfigError('NEXT_PUBLIC_CONTRACT_ADDRESS is not set')
    }
  }, [])

  // Check network on mount and on chain change
  useEffect(() => {
    const checkNetwork = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' })
          setIsWrongNetwork(!isExpectedChain(chainIdHex as string))
        } catch (err) {
          setIsWrongNetwork(true)
        }
      }
    }

    checkNetwork()

    if (typeof window !== 'undefined' && window.ethereum) {
      const handleChainChanged = (chainIdHex: string) => {
        setIsWrongNetwork(!isExpectedChain(chainIdHex))
      }

      window.ethereum.on('chainChanged', handleChainChanged)
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const switchNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        setError(`Please add ${getExpectedChainName()} to your wallet manually.`)
      }
    }
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, GIF, etc.)')
      return
    }

    // Validate file size (max 5MB for base64)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    setImageFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Generate tokenURI as base64 data URL
  const generateTokenURI = async (): Promise<string> => {
    if (!imagePreview) {
      throw new Error('No image selected')
    }

    const metadata = {
      name: name || `NFT #${Date.now()}`,
      description: description || 'Minted on NovatoK NFT Marketplace',
      image: imagePreview, // Base64 data URL
      attributes: [],
    }

    // Convert metadata to base64 data URL
    const metadataJson = JSON.stringify(metadata)
    const base64Metadata = btoa(unescape(encodeURIComponent(metadataJson)))
    return `data:application/json;base64,${base64Metadata}`
  }

  const handleMint = async () => {
    // Hard guard: Block if wrong network
    if (isWrongNetwork) {
      setError('Cannot mint on wrong network. Please switch to ' + getExpectedChainName())
      return
    }

    if (!imageFile || !imagePreview) {
      setError('Please select an image')
      return
    }

    if (!CONTRACT_ADDRESS) {
      setError('Contract address not configured')
      return
    }

    setIsMinting(true)
    setError('')
    setMintResult(null)

    try {
      const accounts = await window.ethereum?.request({ method: 'eth_accounts' }) as string[]
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet connected')
      }

      // Generate tokenURI
      const tokenURI = await generateTokenURI()

      // Encode mint(string tokenURI) function call
      const encoder = new TextEncoder()
      const tokenURIBytes = encoder.encode(tokenURI)
      const paddedLength = Math.ceil(tokenURIBytes.length / 32) * 32
      
      let data = '0xd85d3d27' // mint(string) selector
      data += '0000000000000000000000000000000000000000000000000000000000000020' // offset to string data
      data += tokenURIBytes.length.toString(16).padStart(64, '0') // string length
      
      let hexStr = ''
      for (let i = 0; i < tokenURIBytes.length; i++) {
        hexStr += tokenURIBytes[i].toString(16).padStart(2, '0')
      }
      data += hexStr.padEnd(paddedLength * 2, '0')

      const txHash = await window.ethereum?.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: CONTRACT_ADDRESS,
          data: data,
        }],
      }) as string

      setMintResult({
        success: true,
        txHash,
        message: 'NFT minted successfully! View it on My NFTs page.',
      })

      // Reset form
      setName('')
      setDescription('')
      setImageFile(null)
      setImagePreview('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || 'Failed to mint NFT')
    } finally {
      setIsMinting(false)
    }
  }

  const isButtonDisabled = isWrongNetwork || !isConnected || isMinting || !imageFile || !!configError

  return (
    <Layout>
      <Head title="Mint NFT" />
      <WrongNetworkBanner />
      <Flex direction="column" css={{ maxWidth: 600, mx: 'auto', p: '$4', gap: '$4' }}>
        <Flex justify="between" align="center">
          <Text style="h4" data-testid="mint-title">Mint NFT</Text>
          <NetworkBadge />
        </Flex>
        <Text style="body2" css={{ color: '$gray11' }}>
          Upload an image and mint a new NFT on {getExpectedChainName()}
        </Text>

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
          </Box>
        )}

        {isWrongNetwork && isConnected && (
          <Box css={{ p: '$4', background: '#fef3c7', borderRadius: 8, border: '1px solid #f59e0b' }}>
            <Text style="body2" css={{ color: '#92400e', mb: '$2' }}>
              ⚠️ Wrong Network - Please switch to {getExpectedChainName()}
            </Text>
            <Button onClick={switchNetwork} size="small" data-testid="switch-network-btn">
              Switch Network
            </Button>
          </Box>
        )}

        {/* Image Upload */}
        <Box>
          <Text style="subtitle2" css={{ mb: '$2' }}>Image *</Text>
          <Box
            onClick={() => fileInputRef.current?.click()}
            data-testid="image-upload-area"
            css={{
              border: '2px dashed $gray7',
              borderRadius: 12,
              p: '$4',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'border-color 0.2s',
              '&:hover': {
                borderColor: '$primary9',
              },
            }}
          >
            {imagePreview ? (
              <Box css={{ position: 'relative' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  data-testid="image-preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    borderRadius: 8,
                    objectFit: 'contain',
                  }}
                />
                <Text style="body3" css={{ color: '$gray10', mt: '$2' }}>
                  Click to change image
                </Text>
              </Box>
            ) : (
              <Flex direction="column" align="center" css={{ gap: '$2' }}>
                <Text style="h6" css={{ color: '$gray10' }}>
                  📁
                </Text>
                <Text style="body2" css={{ color: '$gray11' }}>
                  Click to select an image
                </Text>
                <Text style="body3" css={{ color: '$gray10' }}>
                  PNG, JPG, GIF up to 5MB
                </Text>
              </Flex>
            )}
          </Box>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            data-testid="file-input"
          />
        </Box>

        {/* Name Input */}
        <Box>
          <Text style="subtitle2" css={{ mb: '$2' }}>Name (optional)</Text>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Awesome NFT"
            disabled={isWrongNetwork}
            css={{ width: '100%' }}
            data-testid="name-input"
          />
        </Box>

        {/* Description Input */}
        <Box>
          <Text style="subtitle2" css={{ mb: '$2' }}>Description (optional)</Text>
          <Box
            as="textarea"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="Describe your NFT..."
            disabled={isWrongNetwork}
            data-testid="description-input"
            css={{
              width: '100%',
              minHeight: 100,
              p: '$3',
              borderRadius: 8,
              border: '1px solid $gray6',
              background: '$gray3',
              color: '$gray12',
              fontFamily: '$body',
              fontSize: 14,
              resize: 'vertical',
              '&:focus': {
                outline: 'none',
                borderColor: '$primary9',
              },
              '&:disabled': {
                opacity: 0.5,
              },
            }}
          />
        </Box>

        {error && (
          <Box data-testid="error-message" css={{ p: '$3', background: '#fef2f2', borderRadius: 8 }}>
            <Text style="body2" css={{ color: '#991b1b' }}>{error}</Text>
          </Box>
        )}

        {mintResult && mintResult.success && (
          <Box data-testid="success-message" css={{ p: '$3', background: '#dcfce7', borderRadius: 8, border: '1px solid #86efac' }}>
            <Text style="body2" css={{ color: '#166534' }}>✅ {mintResult.message}</Text>
            <Text style="body3" css={{ color: '#166534', wordBreak: 'break-all', mt: '$2' }}>
              Transaction: {mintResult.txHash}
            </Text>
            <Link href="/my-nfts" passHref legacyBehavior>
              <Button as="a" size="small" css={{ mt: '$3' }} data-testid="view-nfts-link">
                View My NFTs
              </Button>
            </Link>
          </Box>
        )}

        <Flex css={{ gap: '$3' }}>
          <Button
            onClick={handleMint}
            disabled={isButtonDisabled}
            css={{ flex: 1 }}
            data-testid="mint-btn"
          >
            {isMinting ? 'Minting...' : 'Mint NFT'}
          </Button>
          <Link href="/my-nfts" passHref legacyBehavior>
            <Button as="a" color="secondary" data-testid="back-to-nfts-btn">
              My NFTs
            </Button>
          </Link>
        </Flex>

        <Text style="body3" css={{ color: '$gray10', textAlign: 'center' }}>
          Contract: <code style={{ fontSize: 11 }}>{CONTRACT_ADDRESS || 'Not configured'}</code>
        </Text>
      </Flex>
    </Layout>
  )
}

export default MintPage
