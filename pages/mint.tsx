import { useState, useEffect, useRef, useCallback } from 'react'
import type { NextPage } from 'next'
import { Flex, Text, Box, Button, Input } from 'components/primitives'
import Layout from 'components/Layout'
import { Head } from 'components/Head'
import { useAccount } from 'wagmi'
import { CHAIN_ID, CONTRACT_ADDRESS, isExpectedChain, getExpectedChainName } from 'lib/config'
import WrongNetworkBanner from 'components/common/WrongNetworkBanner'
import NetworkBadge from 'components/common/NetworkBadge'
import Link from 'next/link'

// ============================================
// TYPES
// ============================================

interface MintCheck {
  level: 'ok' | 'warn'
  label: string
  detail?: string
}

interface MintAnalysis {
  checks: MintCheck[]
}

interface ImageDimensions {
  width: number
  height: number
}

interface Attribute {
  trait_type: string
  value: string
}

type PreviewMode = 'marketplace' | 'mobile' | 'dark'

// ============================================
// ANALYSIS HELPER
// ============================================

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MIN_RESOLUTION = 1000

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot === -1 ? '' : filename.slice(lastDot).toLowerCase()
}

function isAllowedFileType(file: File): boolean {
  const ext = getFileExtension(file.name)
  if (ALLOWED_EXTENSIONS.includes(ext)) return true
  if (file.type.startsWith('image/')) return true
  return false
}

async function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

async function analyzeMintAsset(
  file: File | null,
  metadata: { name: string; description: string; attributes: Attribute[] }
): Promise<MintAnalysis> {
  const checks: MintCheck[] = []

  if (!file) {
    return { checks: [] }
  }

  // File type check
  if (isAllowedFileType(file)) {
    checks.push({ level: 'ok', label: 'File type supported', detail: file.type || getFileExtension(file.name) })
  } else {
    checks.push({ level: 'warn', label: 'Unsupported file type', detail: 'Use PNG, JPG, GIF, or WebP' })
  }

  // File size check
  const sizeMB = file.size / 1024 / 1024
  if (file.size <= MAX_FILE_SIZE) {
    checks.push({ level: 'ok', label: `File size OK (${sizeMB.toFixed(1)}MB)` })
  } else {
    checks.push({ level: 'warn', label: `File is ${sizeMB.toFixed(1)}MB — consider compressing (max 10MB)` })
  }

  // Resolution check
  try {
    const dims = await getImageDimensions(file)
    const aspectRatio = dims.width / dims.height

    if (dims.width >= MIN_RESOLUTION && dims.height >= MIN_RESOLUTION) {
      checks.push({ level: 'ok', label: `Resolution looks good (${dims.width}×${dims.height})` })
    } else {
      checks.push({ 
        level: 'warn', 
        label: `Image is under 1000px — may look blurry on marketplaces`,
        detail: `Current: ${dims.width}×${dims.height}`
      })
    }

    // Aspect ratio check
    if (aspectRatio > 1.5 || aspectRatio < 0.66) {
      checks.push({ 
        level: 'warn', 
        label: 'Extreme aspect ratio detected — square images work best',
        detail: `Current ratio: ${aspectRatio.toFixed(2)}`
      })
    } else if (Math.abs(aspectRatio - 1) < 0.1) {
      checks.push({ level: 'ok', label: 'Square format — optimal for marketplaces' })
    }
  } catch {
    checks.push({ level: 'warn', label: 'Could not analyze image dimensions' })
  }

  // Metadata checks
  if (metadata.name.trim()) {
    checks.push({ level: 'ok', label: 'Name provided' })
  } else {
    checks.push({ level: 'warn', label: 'No name provided — a default will be used' })
  }

  if (metadata.description.trim()) {
    checks.push({ level: 'ok', label: 'Description provided' })
  } else {
    checks.push({ level: 'warn', label: 'No description — adding one improves discoverability' })
  }

  // Attributes check
  const validAttrs = metadata.attributes.filter(a => a.trait_type.trim() && a.value.trim())
  if (validAttrs.length > 0) {
    checks.push({ level: 'ok', label: `${validAttrs.length} attribute(s) added` })
  } else {
    checks.push({ level: 'warn', label: 'No attributes detected — this may reduce discoverability' })
  }

  return { checks }
}

// ============================================
// SUGGESTIONS GENERATOR
// ============================================

function generateSuggestions(analysis: MintAnalysis, attributes: Attribute[]): string[] {
  const suggestions: string[] = []
  
  const hasResolutionWarn = analysis.checks.some(c => c.label.includes('under 1000px'))
  const hasAspectWarn = analysis.checks.some(c => c.label.includes('aspect ratio'))
  const hasNoAttrs = analysis.checks.some(c => c.label.includes('No attributes'))
  const hasNoName = analysis.checks.some(c => c.label.includes('No name'))
  const hasNoDesc = analysis.checks.some(c => c.label.includes('No description'))

  if (hasAspectWarn) {
    suggestions.push('Square images perform best on marketplaces')
  }
  
  if (hasResolutionWarn) {
    suggestions.push('Higher resolution images (1000px+) display better on marketplace listings')
  }

  if (hasNoAttrs) {
    suggestions.push('Consider adding 3–5 attributes for better visibility and filtering')
  } else if (attributes.filter(a => a.trait_type && a.value).length < 3) {
    suggestions.push('Adding more attributes can improve discoverability')
  }

  if (hasNoName) {
    suggestions.push('Short, clear titles tend to convert better')
  }

  if (hasNoDesc) {
    suggestions.push('A good description helps collectors understand your work')
  }

  // Generic helpful tips if not many warnings
  if (suggestions.length < 2) {
    suggestions.push('Your NFT looks ready to mint!')
  }

  return suggestions.slice(0, 6)
}

// ============================================
// COMPONENTS
// ============================================

const MintReadinessPanel = ({ analysis }: { analysis: MintAnalysis }) => {
  if (analysis.checks.length === 0) return null

  const okChecks = analysis.checks.filter(c => c.level === 'ok')
  const warnChecks = analysis.checks.filter(c => c.level === 'warn')

  return (
    <Box
      css={{
        p: '$3',
        borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
      }}
    >
      <Text style="subtitle2" css={{ mb: '$2', color: '$gray12' }}>
        Mint Readiness
      </Text>
      <Flex direction="column" css={{ gap: '$1' }}>
        {okChecks.map((check, i) => (
          <Text key={`ok-${i}`} style="body3" css={{ color: '$green11' }}>
            ✅ {check.label}
          </Text>
        ))}
        {warnChecks.map((check, i) => (
          <Text key={`warn-${i}`} style="body3" css={{ color: '#fbbf24' }}>
            ⚠️ {check.label}
          </Text>
        ))}
      </Flex>
    </Box>
  )
}

const PreviewModeToggle = ({ mode, setMode }: { mode: PreviewMode; setMode: (m: PreviewMode) => void }) => (
  <Flex css={{ gap: '$1', mb: '$2' }}>
    {(['marketplace', 'mobile', 'dark'] as PreviewMode[]).map((m) => (
      <Button
        key={m}
        size="small"
        color={mode === m ? 'primary' : 'gray3'}
        onClick={() => setMode(m)}
        css={{ 
          textTransform: 'capitalize', 
          fontSize: 12,
          px: '$2',
          py: '$1',
        }}
      >
        {m}
      </Button>
    ))}
  </Flex>
)

const MarketplacePreview = ({ 
  imageUrl, 
  name, 
  mode 
}: { 
  imageUrl: string; 
  name: string; 
  mode: PreviewMode 
}) => {
  if (!imageUrl) return null

  const containerStyles: Record<PreviewMode, React.CSSProperties> = {
    marketplace: {
      background: 'var(--colors-gray3)',
      padding: 12,
      borderRadius: 16,
      maxWidth: 280,
    },
    mobile: {
      background: 'var(--colors-gray3)',
      padding: 8,
      borderRadius: 12,
      maxWidth: 180,
      margin: '0 auto',
    },
    dark: {
      background: '#0a0a0a',
      padding: 12,
      borderRadius: 16,
      maxWidth: 280,
    },
  }

  const textColor = mode === 'dark' ? '#e5e5e5' : 'var(--colors-gray12)'
  const subtextColor = mode === 'dark' ? '#a3a3a3' : 'var(--colors-gray10)'

  return (
    <Box css={{ mt: '$2' }}>
      <Text style="body3" css={{ color: '$gray10', mb: '$2' }}>
        Preview: {mode.charAt(0).toUpperCase() + mode.slice(1)}
      </Text>
      <div style={containerStyles[mode]}>
        <img
          src={imageUrl}
          alt="Preview"
          style={{
            width: '100%',
            aspectRatio: '1',
            objectFit: 'cover',
            borderRadius: 8,
            display: 'block',
          }}
        />
        <div style={{ marginTop: 8 }}>
          <div style={{ 
            color: textColor, 
            fontWeight: 600, 
            fontSize: mode === 'mobile' ? 12 : 14,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {name || 'Untitled NFT'}
          </div>
          <div style={{ 
            color: subtextColor, 
            fontSize: mode === 'mobile' ? 10 : 12,
            marginTop: 2,
          }}>
            NovaTok Collection
          </div>
          <div style={{ 
            color: textColor, 
            fontSize: mode === 'mobile' ? 11 : 13,
            fontWeight: 500,
            marginTop: 6,
          }}>
            — ETH
          </div>
        </div>
      </div>
    </Box>
  )
}

const SuggestionsPanel = ({ 
  suggestions, 
  collapsed, 
  setCollapsed 
}: { 
  suggestions: string[]; 
  collapsed: boolean; 
  setCollapsed: (c: boolean) => void 
}) => {
  if (suggestions.length === 0) return null

  return (
    <Box
      css={{
        p: '$3',
        borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}
    >
      <Flex justify="between" align="center" css={{ mb: collapsed ? 0 : '$2' }}>
        <Text style="subtitle2" css={{ color: '$gray12' }}>
          NovaTok Suggestions
        </Text>
        <Button
          size="small"
          color="gray3"
          onClick={() => setCollapsed(!collapsed)}
          css={{ fontSize: 11, px: '$2', py: '$1' }}
        >
          {collapsed ? 'Show' : 'Hide'}
        </Button>
      </Flex>
      {!collapsed && (
        <Flex direction="column" css={{ gap: '$1' }}>
          {suggestions.map((s, i) => (
            <Text key={i} style="body3" css={{ color: '$gray11' }}>
              💡 {s}
            </Text>
          ))}
        </Flex>
      )}
    </Box>
  )
}

const AttributesEditor = ({ 
  attributes, 
  setAttributes 
}: { 
  attributes: Attribute[]; 
  setAttributes: (a: Attribute[]) => void 
}) => {
  const updateAttribute = (index: number, field: 'trait_type' | 'value', val: string) => {
    const newAttrs = [...attributes]
    newAttrs[index] = { ...newAttrs[index], [field]: val }
    setAttributes(newAttrs)
  }

  const addAttribute = () => {
    if (attributes.length < 5) {
      setAttributes([...attributes, { trait_type: '', value: '' }])
    }
  }

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  return (
    <Box>
      <Flex justify="between" align="center" css={{ mb: '$2' }}>
        <Text style="subtitle2">Attributes (optional)</Text>
        {attributes.length < 5 && (
          <Button size="small" color="gray3" onClick={addAttribute} css={{ fontSize: 11 }}>
            + Add
          </Button>
        )}
      </Flex>
      <Flex direction="column" css={{ gap: '$2' }}>
        {attributes.map((attr, i) => (
          <Flex key={i} css={{ gap: '$2' }} align="center">
            <Input
              value={attr.trait_type}
              onChange={(e) => updateAttribute(i, 'trait_type', e.target.value)}
              placeholder="Trait (e.g., Color)"
              css={{ flex: 1, fontSize: 13 }}
            />
            <Input
              value={attr.value}
              onChange={(e) => updateAttribute(i, 'value', e.target.value)}
              placeholder="Value (e.g., Blue)"
              css={{ flex: 1, fontSize: 13 }}
            />
            <Button
              size="small"
              color="gray3"
              onClick={() => removeAttribute(i)}
              css={{ px: '$2', fontSize: 11 }}
            >
              ×
            </Button>
          </Flex>
        ))}
        {attributes.length === 0 && (
          <Text style="body3" css={{ color: '$gray10', fontStyle: 'italic' }}>
            No attributes. Click &quot;+ Add&quot; to improve discoverability.
          </Text>
        )}
      </Flex>
    </Box>
  )
}

// ============================================
// MAIN PAGE
// ============================================

const MintPage: NextPage = () => {
  const { address, isConnected } = useAccount()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  
  // Analysis state
  const [analysis, setAnalysis] = useState<MintAnalysis>({ checks: [] })
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(false)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('marketplace')
  
  // UI state
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [mintResult, setMintResult] = useState<{ success: boolean; txHash?: string; message: string } | null>(null)
  const [error, setError] = useState('')
  const [configError, setConfigError] = useState('')

  // Run analysis when file or metadata changes
  const runAnalysis = useCallback(async () => {
    if (!imageFile) {
      setAnalysis({ checks: [] })
      setSuggestions([])
      return
    }
    const result = await analyzeMintAsset(imageFile, { name, description, attributes })
    setAnalysis(result)
    setSuggestions(generateSuggestions(result, attributes))
  }, [imageFile, name, description, attributes])

  useEffect(() => {
    runAnalysis()
  }, [runAnalysis])

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
        } catch {
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

  // Upload file to API
  const uploadToApi = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      body: formData,
    })
    
    const result = await response.json()
    
    if (!response.ok || !result.ok) {
      throw new Error(result.detail || result.error || 'Upload failed')
    }
    
    return result.url
  }

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Basic client-side validation (API does thorough check)
    const ext = getFileExtension(file.name)
    const isValidType = ALLOWED_EXTENSIONS.includes(ext) || file.type.startsWith('image/')
    
    if (!isValidType) {
      setError('Please select an image file (PNG, JPG, GIF, WebP)')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`Image must be smaller than 10MB (current: ${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      return
    }

    setImageFile(file)
    setError('')
    setUploadedImageUrl('')

    // Create local preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to API
    setIsUploading(true)
    try {
      const url = await uploadToApi(file)
      setUploadedImageUrl(url)
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`)
      setImageFile(null)
      setImagePreview('')
    } finally {
      setIsUploading(false)
    }
  }

  // Generate tokenURI as base64 data URL
  const generateTokenURI = async (): Promise<string> => {
    if (!uploadedImageUrl) {
      throw new Error('Image not uploaded')
    }

    const validAttrs = attributes.filter(a => a.trait_type.trim() && a.value.trim())

    const metadata = {
      name: name || `NFT #${Date.now()}`,
      description: description || 'Minted on NovatoK NFT Marketplace',
      image: uploadedImageUrl,
      attributes: validAttrs,
    }

    const metadataJson = JSON.stringify(metadata)
    const base64Metadata = btoa(unescape(encodeURIComponent(metadataJson)))
    return `data:application/json;base64,${base64Metadata}`
  }

  const handleMint = async () => {
    if (isWrongNetwork) {
      setError('Cannot mint on wrong network. Please switch to ' + getExpectedChainName())
      return
    }

    if (!imageFile || !uploadedImageUrl) {
      setError('Please select and upload an image first')
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

      const tokenURI = await generateTokenURI()

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
        message: 'NFT minted successfully! View it on My NFTs page.',
      })

      // Reset form
      setName('')
      setDescription('')
      setAttributes([])
      setImageFile(null)
      setImagePreview('')
      setUploadedImageUrl('')
      setAnalysis({ checks: [] })
      setSuggestions([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || 'Failed to mint NFT')
    } finally {
      setIsMinting(false)
    }
  }

  const isButtonDisabled = isWrongNetwork || !isConnected || isMinting || isUploading || !uploadedImageUrl || !!configError

  return (
    <Layout>
      <Head title="Mint NFT" />
      <WrongNetworkBanner />
      <Flex css={{ maxWidth: 900, mx: 'auto', p: '$4', gap: '$5', flexDirection: 'column', '@bp800': { flexDirection: 'row' } }}>
        {/* Main Form Column */}
        <Flex direction="column" css={{ flex: 1, gap: '$4' }}>
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
                background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.2) 0%, rgba(153, 27, 27, 0.1) 100%)',
                borderRadius: 12,
                border: '1px solid rgba(252, 165, 165, 0.5)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Text style="subtitle2" css={{ color: '#fca5a5', mb: '$2' }}>
                ⚠️ Configuration Error
              </Text>
              <Text style="body2" css={{ color: '#fca5a5' }}>
                {configError}
              </Text>
            </Box>
          )}

          {isWrongNetwork && isConnected && (
            <Box css={{ 
              p: '$4', 
              background: 'linear-gradient(135deg, rgba(146, 64, 14, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
              borderRadius: 12, 
              border: '1px solid rgba(245, 158, 11, 0.5)',
              backdropFilter: 'blur(8px)',
            }}>
              <Text style="body2" css={{ color: '#fcd34d', mb: '$2' }}>
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
              onClick={() => !isUploading && fileInputRef.current?.click()}
              data-testid="image-upload-area"
              css={{
                border: '2px dashed $gray7',
                borderRadius: 12,
                p: '$4',
                cursor: isUploading ? 'wait' : 'pointer',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                background: imagePreview ? 'transparent' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                '&:hover': {
                  borderColor: '$primary9',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                },
              }}
            >
              {isUploading ? (
                <Flex direction="column" align="center" css={{ gap: '$2', py: '$4' }}>
                  <Box css={{
                    width: 40,
                    height: 40,
                    border: '3px solid $gray6',
                    borderTopColor: '$primary9',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }} />
                  <Text style="body2" css={{ color: '$primary11' }}>
                    Uploading image...
                  </Text>
                </Flex>
              ) : imagePreview ? (
                <Box css={{ position: 'relative' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    data-testid="image-preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 250,
                      borderRadius: 8,
                      objectFit: 'contain',
                    }}
                  />
                  {uploadedImageUrl ? (
                    <Text style="body3" css={{ color: '$green11', mt: '$2' }}>
                      ✓ Image uploaded successfully
                    </Text>
                  ) : (
                    <Text style="body3" css={{ color: '$gray10', mt: '$2' }}>
                      Click to change image
                    </Text>
                  )}
                </Box>
              ) : (
                <Flex direction="column" align="center" css={{ gap: '$2', py: '$4' }}>
                  <Box css={{ fontSize: 48, lineHeight: 1, filter: 'grayscale(0.5)' }}>
                    🖼️
                  </Box>
                  <Text style="body2" css={{ color: '$gray11' }}>
                    Click to select an image
                  </Text>
                  <Text style="body3" css={{ color: '$gray10' }}>
                    PNG, JPG, GIF, WebP up to 10MB
                  </Text>
                </Flex>
              )}
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              data-testid="file-input"
            />
          </Box>

          {/* Mint Readiness Panel */}
          {analysis.checks.length > 0 && <MintReadinessPanel analysis={analysis} />}

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
                minHeight: 80,
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

          {/* Attributes Editor */}
          <AttributesEditor attributes={attributes} setAttributes={setAttributes} />

          {/* Error Message */}
          {error && (
            <Box 
              data-testid="error-message" 
              css={{ 
                p: '$3', 
                background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.15) 0%, rgba(185, 28, 28, 0.1) 100%)',
                borderRadius: 12,
                border: '1px solid rgba(248, 113, 113, 0.3)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Text style="body2" css={{ color: '#f87171' }}>⚠️ {error}</Text>
            </Box>
          )}

          {/* Success Message */}
          {mintResult && mintResult.success && (
            <Box 
              data-testid="success-message" 
              css={{ 
                p: '$4', 
                background: 'linear-gradient(135deg, rgba(22, 101, 52, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%)',
                borderRadius: 12, 
                border: '1px solid rgba(134, 239, 172, 0.3)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Text style="body2" css={{ color: '#86efac' }}>✅ {mintResult.message}</Text>
              <Text style="body3" css={{ color: '#86efac', wordBreak: 'break-all', mt: '$2', opacity: 0.8 }}>
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
              {isMinting ? 'Minting...' : isUploading ? 'Uploading...' : 'Mint NFT'}
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

        {/* Preview & Suggestions Column */}
        {imagePreview && (
          <Box css={{ width: '100%', '@bp800': { width: 300 } }}>
            <Text style="subtitle2" css={{ mb: '$2' }}>Preview</Text>
            <PreviewModeToggle mode={previewMode} setMode={setPreviewMode} />
            <MarketplacePreview imageUrl={imagePreview} name={name} mode={previewMode} />
            
            {suggestions.length > 0 && (
              <Box css={{ mt: '$4' }}>
                <SuggestionsPanel 
                  suggestions={suggestions} 
                  collapsed={suggestionsCollapsed} 
                  setCollapsed={setSuggestionsCollapsed} 
                />
              </Box>
            )}
          </Box>
        )}
      </Flex>
    </Layout>
  )
}

export default MintPage
