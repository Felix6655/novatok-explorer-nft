import { useState, useEffect, useCallback } from 'react'
import type { NextPage } from 'next'
import { Flex, Text, Box, Button, Input } from 'components/primitives'
import Layout from 'components/Layout'
import { Head } from 'components/Head'
import { useAccount } from 'wagmi'
import { CHAIN_ID, CONTRACT_ADDRESS, isExpectedChain, getExpectedChainName } from 'lib/config'
import WrongNetworkBanner from 'components/common/WrongNetworkBanner'
import NetworkBadge from 'components/common/NetworkBadge'

const GeneratePage: NextPage = () => {
  const { address, isConnected } = useAccount()
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [attributes, setAttributes] = useState([{ trait_type: '', value: '' }])

  // IPFS state
  const [isUploading, setIsUploading] = useState(false)
  const [metadataUri, setMetadataUri] = useState('')
  const [imageUri, setImageUri] = useState('')
  const [uploadError, setUploadError] = useState('')

  // Mint state
  const [isMinting, setIsMinting] = useState(false)
  const [mintResult, setMintResult] = useState<{ success: boolean; txHash?: string; message: string } | null>(null)
  const [mintError, setMintError] = useState('')

  // Network state
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
  const [copied, setCopied] = useState(false)

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
        setMintError(`Please add ${getExpectedChainName()} to your wallet manually.`)
      }
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }])
  }

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newAttributes = [...attributes]
    newAttributes[index][field] = value
    setAttributes(newAttributes)
  }

  const handleUploadToIPFS = async () => {
    if (!imageFile || !name) {
      setUploadError('Please provide an image and name')
      return
    }

    setIsUploading(true)
    setUploadError('')

    try {
      const imageBase64 = imagePreview.split(',')[1]
      const validAttributes = attributes.filter(
        (attr) => attr.trait_type && attr.value
      )
      const metadata = {
        name,
        description,
        attributes: validAttributes,
      }

      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          metadata,
          fileName: imageFile.name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload to IPFS')
      }

      const data = await response.json()
      setMetadataUri(data.metadataUri)
      setImageUri(data.imageUri)
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload to IPFS')
    } finally {
      setIsUploading(false)
    }
  }

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [])

  const handleMint = async () => {
    // Hard guard: Block if wrong network
    if (isWrongNetwork) {
      setMintError('Cannot mint on wrong network. Please switch to ' + getExpectedChainName())
      return
    }

    // Hard guard: Only allow ipfs:// URIs
    if (!metadataUri || !metadataUri.startsWith('ipfs://')) {
      setMintError('Please upload to IPFS first. Token URI must start with ipfs://')
      return
    }

    if (!CONTRACT_ADDRESS) {
      setMintError('Contract address not configured')
      return
    }

    setIsMinting(true)
    setMintError('')
    setMintResult(null)

    try {
      const accounts = await window.ethereum?.request({ method: 'eth_accounts' }) as string[]
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet connected')
      }

      const tokenURI = metadataUri
      const encoder = new TextEncoder()
      const tokenURIBytes = encoder.encode(tokenURI)
      const paddedLength = Math.ceil(tokenURIBytes.length / 32) * 32
      
      let data = '0xd85d3d27'
      data += '0000000000000000000000000000000000000000000000000000000000000020'
      data += tokenURIBytes.length.toString(16).padStart(64, '0')
      
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
        message: 'NFT minted successfully!',
      })
    } catch (err: any) {
      setMintError(err.message || 'Failed to mint NFT')
    } finally {
      setIsMinting(false)
    }
  }

  const canUpload = imageFile && name && !isUploading
  const canMint = metadataUri && metadataUri.startsWith('ipfs://') && !isWrongNetwork && isConnected && !isMinting

  return (
    <Layout>
      <Head title="Generate & Mint NFT" />
      <WrongNetworkBanner />
      <Flex direction="column" css={{ maxWidth: 700, mx: 'auto', p: '$4', gap: '$4' }}>
        <Flex justify="between" align="center">
          <Text style="h4">Generate & Mint NFT</Text>
          <NetworkBadge />
        </Flex>
        <Text style="body2" css={{ color: '$gray11' }}>
          Create metadata, upload to IPFS, and mint your NFT
        </Text>

        {isWrongNetwork && isConnected && (
          <Box css={{ p: '$4', background: '#fef3c7', borderRadius: 8, border: '1px solid #f59e0b' }}>
            <Text style="body2" css={{ color: '#92400e', mb: '$2' }}>
              ⚠️ Wrong Network - Please switch to {getExpectedChainName()}
            </Text>
            <Button onClick={switchNetwork} size="small">
              Switch Network
            </Button>
          </Box>
        )}

        {/* Section 1: NFT Details */}
        <Box css={{ p: '$4', background: '$gray2', borderRadius: 12, border: '1px solid $gray5' }}>
          <Text style="subtitle1" css={{ mb: '$4', pb: '$3', borderBottom: '1px solid $gray5' }}>
            1. NFT Details
          </Text>
          
          <Flex direction="column" css={{ gap: '$4' }}>
            <Box>
              <Text style="subtitle2" css={{ mb: '$2' }}>Name *</Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome NFT"
                css={{ width: '100%' }}
              />
            </Box>

            <Box>
              <Text style="subtitle2" css={{ mb: '$2' }}>Description</Text>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your NFT..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 15,
                  fontFamily: 'inherit',
                }}
              />
            </Box>

            <Box>
              <Text style="subtitle2" css={{ mb: '$2' }}>Image *</Text>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <Box css={{ mt: '$3' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                </Box>
              )}
            </Box>

            <Box>
              <Text style="subtitle2" css={{ mb: '$2' }}>Attributes (Optional)</Text>
              {attributes.map((attr, index) => (
                <Flex key={index} css={{ gap: '$3', mb: '$2' }}>
                  <Input
                    value={attr.trait_type}
                    onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                    placeholder="Trait type"
                    css={{ flex: 1 }}
                  />
                  <Input
                    value={attr.value}
                    onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                    placeholder="Value"
                    css={{ flex: 1 }}
                  />
                  <Button
                    onClick={() => removeAttribute(index)}
                    size="small"
                    color="gray3"
                  >
                    ×
                  </Button>
                </Flex>
              ))}
              <Button onClick={addAttribute} size="small" color="gray3">
                + Add Attribute
              </Button>
            </Box>
          </Flex>
        </Box>

        {/* Section 2: Upload to IPFS */}
        <Box css={{ p: '$4', background: '$gray2', borderRadius: 12, border: '1px solid $gray5' }}>
          <Text style="subtitle1" css={{ mb: '$4', pb: '$3', borderBottom: '1px solid $gray5' }}>
            2. Upload to IPFS
          </Text>
          
          <Button
            onClick={handleUploadToIPFS}
            disabled={!canUpload}
            css={{ width: '100%', background: '#8b5cf6', '&:hover': { background: '#7c3aed' } }}
          >
            {isUploading ? 'Uploading...' : 'Upload to IPFS'}
          </Button>

          {uploadError && (
            <Box css={{ mt: '$3', p: '$3', background: '#fef2f2', borderRadius: 8 }}>
              <Text style="body2" css={{ color: '#991b1b' }}>{uploadError}</Text>
            </Box>
          )}

          {metadataUri && (
            <Flex direction="column" css={{ mt: '$4', gap: '$3' }}>
              <Box>
                <Text style="subtitle2" css={{ mb: '$2' }}>Metadata URI (Token URI)</Text>
                <Flex css={{ gap: '$2', p: '$3', background: '$gray3', borderRadius: 8 }}>
                  <code style={{ flex: 1, fontSize: 13, wordBreak: 'break-all' }}>{metadataUri}</code>
                  <Button onClick={() => copyToClipboard(metadataUri)} size="small">
                    {copied ? '✓ Copied' : 'Copy'}
                  </Button>
                </Flex>
              </Box>
              {imageUri && (
                <Box>
                  <Text style="subtitle2" css={{ mb: '$2' }}>Image URI</Text>
                  <Flex css={{ gap: '$2', p: '$3', background: '$gray3', borderRadius: 8 }}>
                    <code style={{ flex: 1, fontSize: 13, wordBreak: 'break-all' }}>{imageUri}</code>
                    <Button onClick={() => copyToClipboard(imageUri)} size="small">
                      Copy
                    </Button>
                  </Flex>
                </Box>
              )}
            </Flex>
          )}
        </Box>

        {/* Section 3: Mint NFT */}
        <Box css={{ p: '$4', background: '$gray2', borderRadius: 12, border: '1px solid $gray5' }}>
          <Text style="subtitle1" css={{ mb: '$4', pb: '$3', borderBottom: '1px solid $gray5' }}>
            3. Mint NFT
          </Text>
          
          {!metadataUri && (
            <Box css={{ p: '$3', background: '#eff6ff', borderRadius: 8, mb: '$3' }}>
              <Text style="body2" css={{ color: '#1e40af' }}>
                ℹ️ Upload your NFT to IPFS first to get the token URI.
              </Text>
            </Box>
          )}

          {metadataUri && !metadataUri.startsWith('ipfs://') && (
            <Box css={{ p: '$3', background: '#fef3c7', borderRadius: 8, mb: '$3' }}>
              <Text style="body2" css={{ color: '#92400e' }}>
                ⚠️ Token URI must start with ipfs:// to mint.
              </Text>
            </Box>
          )}

          {mintError && (
            <Box css={{ p: '$3', background: '#fef2f2', borderRadius: 8, mb: '$3' }}>
              <Text style="body2" css={{ color: '#991b1b' }}>{mintError}</Text>
            </Box>
          )}

          {mintResult && mintResult.success && (
            <Box css={{ p: '$3', background: '#dcfce7', borderRadius: 8, border: '1px solid #86efac', mb: '$3' }}>
              <Text style="body2" css={{ color: '#166534' }}>✅ {mintResult.message}</Text>
              <Text style="body3" css={{ color: '#166534', wordBreak: 'break-all', mt: '$2' }}>
                Transaction: {mintResult.txHash}
              </Text>
            </Box>
          )}

          <Button
            onClick={handleMint}
            disabled={!canMint}
            css={{ width: '100%', background: '#10b981', '&:hover': { background: '#059669' } }}
          >
            {isMinting ? 'Minting...' : 'Mint NFT'}
          </Button>
        </Box>
      </Flex>
    </Layout>
  )
}

export default GeneratePage
