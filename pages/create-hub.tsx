import { useState } from 'react'
import type { NextPage } from 'next'
import { Flex, Text, Box, Button, Input } from 'components/primitives'
import Layout from 'components/Layout'
import { Head } from 'components/Head'
import { useAccount } from 'wagmi'
import { ConnectWalletButton } from 'components/ConnectWalletButton'
import Link from 'next/link'

// ============================================
// TYPES
// ============================================

type TabType = 'image' | 'video' | 'character' | 'audio' | 'assets'

interface ToolCard {
  id: string
  title: string
  description: string
  icon: string
}

interface AssetCard {
  id: string
  name: string
  subtitle: string
}

// ============================================
// DATA
// ============================================

const TABS: { id: TabType; label: string }[] = [
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
  { id: 'character', label: 'Character' },
  { id: 'audio', label: 'Audio' },
  { id: 'assets', label: 'Assets' },
]

const IMAGE_TOOLS: ToolCard[] = [
  { id: 'generate', title: 'Generate Image', description: 'Create unique AI-generated artwork', icon: '🎨' },
  { id: 'edit', title: 'Edit Image', description: 'Edit and enhance your images', icon: '✏️' },
  { id: 'upscale', title: 'Image Upscale', description: 'Improve image resolution', icon: '⬆️' },
  { id: 'remove-bg', title: 'Remove Background', description: 'Remove backgrounds instantly', icon: '✨' },
  { id: 'erase', title: 'Erase Object', description: 'Remove unwanted objects', icon: '🧹' },
  { id: 'text-to-video', title: 'Text to Video', description: 'Turn text into video', icon: '📝' },
  { id: 'motion', title: 'Motion Video', description: 'Animate any photo', icon: '🎞️' },
  { id: 'img-to-video', title: 'Image to Video', description: 'Convert images to video', icon: '🎥' },
]

const PLACEHOLDER_ASSETS: AssetCard[] = [
  { id: '1', name: 'Fire Lion', subtitle: 'Mythical' },
  { id: '2', name: 'Space Explorer', subtitle: 'Astronaut' },
  { id: '3', name: 'Neon Dream', subtitle: 'Abstract' },
  { id: '4', name: 'Cyber Knight', subtitle: 'Character' },
]

// ============================================
// COMPONENTS
// ============================================

const TabButton = ({ 
  tab, 
  isActive, 
  onClick 
}: { 
  tab: typeof TABS[0]; 
  isActive: boolean; 
  onClick: () => void 
}) => (
  <Button
    onClick={onClick}
    size="small"
    color={isActive ? 'primary' : 'gray3'}
    css={{
      px: '$4',
      py: '$2',
      borderRadius: 8,
      background: isActive 
        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.3) 100%)'
        : 'rgba(255, 255, 255, 0.05)',
      border: isActive ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
      '&:hover': {
        background: isActive 
          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.5) 0%, rgba(139, 92, 246, 0.4) 100%)'
          : 'rgba(255, 255, 255, 0.1)',
      },
    }}
    data-testid={`tab-${tab.id}`}
  >
    <Text style="body2" css={{ color: isActive ? '#fff' : '$gray11' }}>{tab.label}</Text>
    {isActive && <Text css={{ ml: '$1', color: '#22c55e' }}>✓</Text>}
  </Button>
)

const ToolCardComponent = ({ tool, onUnavailable }: { tool: ToolCard; onUnavailable: () => void }) => (
  <Box
    css={{
      p: '$4',
      background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 20, 40, 0.9) 100%)',
      borderRadius: 16,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        borderColor: 'rgba(139, 92, 246, 0.5)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
      },
    }}
    data-testid={`tool-${tool.id}`}
  >
    <Text css={{ fontSize: 32, mb: '$3' }}>{tool.icon}</Text>
    <Text style="subtitle1" css={{ color: '$gray12', mb: '$2' }}>{tool.title}</Text>
    <Text style="body3" css={{ color: '$gray10', mb: '$4', minHeight: 36 }}>{tool.description}</Text>
    <Button
      size="small"
      onClick={onUnavailable}
      css={{
        width: '100%',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      }}
    >
      Create
    </Button>
  </Box>
)

const AssetCardComponent = ({ asset }: { asset: AssetCard }) => (
  <Box
    css={{
      background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 20, 40, 0.9) 100%)',
      borderRadius: 12,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: 'rgba(139, 92, 246, 0.5)',
      },
    }}
  >
    <Box css={{ aspectRatio: '1', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', position: 'relative' }}>
      <Flex align="center" justify="center" css={{ width: '100%', height: '100%' }}>
        <Text css={{ fontSize: 32, opacity: 0.4 }}>🖼️</Text>
      </Flex>
    </Box>
    <Box css={{ p: '$2' }}>
      <Text style="body3" css={{ color: '$gray12', fontWeight: 600 }}>{asset.name}</Text>
      <Text style="body3" css={{ color: '$gray10', fontSize: 11 }}>{asset.subtitle}</Text>
    </Box>
  </Box>
)

const FeatureNFTCard = ({ onClick }: { onClick: () => void }) => (
  <Box
    onClick={onClick}
    css={{
      p: '$4',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
      borderRadius: 16,
      border: '1px solid rgba(139, 92, 246, 0.3)',
      backdropFilter: 'blur(10px)',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: 'rgba(139, 92, 246, 0.6)',
        transform: 'translateY(-2px)',
      },
    }}
    data-testid="feature-nft-cta"
  >
    <Box css={{ 
      width: 48, 
      height: 48, 
      borderRadius: '50%', 
      background: 'rgba(139, 92, 246, 0.2)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      mx: 'auto',
      mb: '$3',
    }}>
      <Text css={{ fontSize: 24 }}>⬆️</Text>
    </Box>
    <Text style="subtitle1" css={{ color: '$primary11', mb: '$1' }}>Feature NFT</Text>
    <Text style="body3" css={{ color: '$gray10' }}>
      Boost your NFT visibility
    </Text>
  </Box>
)

// ============================================
// MAIN PAGE
// ============================================

const CreateHubPage: NextPage = () => {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<TabType>('image')
  const [prompt, setPrompt] = useState('')
  const [imageCount, setImageCount] = useState('1')
  const [model, setModel] = useState('Flux')
  const [style, setStyle] = useState('Cinematic')
  const [size, setSize] = useState('1024x1024')
  const [ratio, setRatio] = useState('1:1')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const showNotification = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleGenerate = () => {
    if (!prompt.trim()) {
      showNotification('Please enter a prompt')
      return
    }
    showNotification('AI Service Not Configured')
  }

  const handleSurpriseMe = () => {
    setPrompt('3D astronaut, epic futuristic space suit, galaxy background, cinematic lighting, lens flare')
  }

  const handleFeatureNFT = () => {
    window.location.href = '/my-nfts?action=feature'
  }

  return (
    <Layout>
      <Head title="Create Hub" />
      
      {/* Toast */}
      {showToast && (
        <Box
          css={{
            position: 'fixed',
            top: 100,
            right: 20,
            p: '$3',
            background: 'rgba(251, 191, 36, 0.95)',
            borderRadius: 8,
            zIndex: 1000,
          }}
        >
          <Text style="body2" css={{ color: '#1a1a1a' }}>{toastMessage}</Text>
        </Box>
      )}

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
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)',
          },
        }}
      />

      <Box css={{ maxWidth: 1400, mx: 'auto', p: '$4', pt: '$5' }}>
        {/* Header */}
        <Box css={{ mb: '$5', textAlign: 'center' }}>
          <Text style="h3" css={{ color: '$gray12', mb: '$2' }} data-testid="create-hub-title">
            Welcome to the Create Hub
          </Text>
          <Text style="body1" css={{ color: '$gray10' }}>
            Create, mint, and feature unique NFTs
          </Text>
        </Box>

        {/* Connect Wallet */}
        {!isConnected && (
          <Box
            css={{
              p: '$5',
              mb: '$5',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
              borderRadius: 16,
              border: '1px solid rgba(139, 92, 246, 0.3)',
              textAlign: 'center',
            }}
          >
            <Text style="h6" css={{ color: '$gray12', mb: '$3' }}>Connect Your Wallet</Text>
            <Text style="body2" css={{ color: '$gray10', mb: '$4' }}>
              Connect your wallet to start creating NFTs
            </Text>
            <ConnectWalletButton />
          </Box>
        )}

        {/* Tabs */}
        <Flex css={{ gap: '$2', mb: '$5', flexWrap: 'wrap', justifyContent: 'center' }}>
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </Flex>

        <Flex css={{ gap: '$5', flexDirection: 'column', '@bp1000': { flexDirection: 'row' } }}>
          {/* Main Content */}
          <Box css={{ flex: 1 }}>
            {/* Generate NFT Image Section */}
            <Box
              css={{
                p: '$5',
                mb: '$5',
                background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 20, 40, 0.9) 100%)',
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Text style="h5" css={{ color: '$gray12', mb: '$4' }}>Generate NFT Image</Text>
              
              {/* Prompt Input */}
              <Box css={{ mb: '$4' }}>
                <Text style="body3" css={{ color: '$gray10', mb: '$2' }}>
                  Describe the NFT you want to generate...
                </Text>
                <Flex css={{ gap: '$2' }}>
                  <Box
                    as="textarea"
                    value={prompt}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                    placeholder="3D astronaut, epic futuristic space suit, galaxy background, cinematic lighting, lens flare"
                    css={{
                      flex: 1,
                      minHeight: 80,
                      p: '$3',
                      borderRadius: 8,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '$gray12',
                      fontFamily: '$body',
                      fontSize: 14,
                      resize: 'vertical',
                      '&:focus': {
                        outline: 'none',
                        borderColor: 'rgba(139, 92, 246, 0.5)',
                      },
                      '&::placeholder': {
                        color: '$gray9',
                      },
                    }}
                    data-testid="prompt-input"
                  />
                </Flex>
                <Flex css={{ mt: '$2', justifyContent: 'flex-end' }}>
                  <Button size="small" color="gray3" onClick={handleSurpriseMe}>
                    Surprise me
                  </Button>
                </Flex>
              </Box>

              {/* Controls Row */}
              <Flex css={{ gap: '$3', flexWrap: 'wrap', mb: '$4' }}>
                <Box css={{ minWidth: 100 }}>
                  <Text style="body3" css={{ color: '$gray10', mb: '$1' }}>Image count</Text>
                  <Box
                    as="select"
                    value={imageCount}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setImageCount(e.target.value)}
                    css={{
                      width: '100%',
                      p: '$2',
                      borderRadius: 6,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '$gray12',
                      fontSize: 13,
                    }}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="4">4</option>
                  </Box>
                </Box>
                <Box css={{ minWidth: 100 }}>
                  <Text style="body3" css={{ color: '$gray10', mb: '$1' }}>Model</Text>
                  <Box
                    as="select"
                    value={model}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setModel(e.target.value)}
                    css={{
                      width: '100%',
                      p: '$2',
                      borderRadius: 6,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '$gray12',
                      fontSize: 13,
                    }}
                  >
                    <option value="Flux">Flux</option>
                    <option value="SDXL">SDXL</option>
                    <option value="Midjourney">Midjourney</option>
                  </Box>
                </Box>
                <Box css={{ minWidth: 100 }}>
                  <Text style="body3" css={{ color: '$gray10', mb: '$1' }}>Style</Text>
                  <Box
                    as="select"
                    value={style}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStyle(e.target.value)}
                    css={{
                      width: '100%',
                      p: '$2',
                      borderRadius: 6,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '$gray12',
                      fontSize: 13,
                    }}
                  >
                    <option value="Cinematic">Cinematic</option>
                    <option value="Anime">Anime</option>
                    <option value="Photorealistic">Photorealistic</option>
                    <option value="Abstract">Abstract</option>
                  </Box>
                </Box>
                <Box css={{ minWidth: 100 }}>
                  <Text style="body3" css={{ color: '$gray10', mb: '$1' }}>Size</Text>
                  <Box
                    as="select"
                    value={size}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSize(e.target.value)}
                    css={{
                      width: '100%',
                      p: '$2',
                      borderRadius: 6,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '$gray12',
                      fontSize: 13,
                    }}
                  >
                    <option value="512x512">512x512</option>
                    <option value="1024x1024">1024x1024</option>
                    <option value="1536x1536">1536x1536</option>
                  </Box>
                </Box>
                <Box css={{ minWidth: 80 }}>
                  <Text style="body3" css={{ color: '$gray10', mb: '$1' }}>Ratio</Text>
                  <Box
                    as="select"
                    value={ratio}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRatio(e.target.value)}
                    css={{
                      width: '100%',
                      p: '$2',
                      borderRadius: 6,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '$gray12',
                      fontSize: 13,
                    }}
                  >
                    <option value="1:1">1:1</option>
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="4:3">4:3</option>
                  </Box>
                </Box>
              </Flex>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                css={{
                  width: '100%',
                  py: '$3',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  fontSize: 16,
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  },
                }}
                data-testid="generate-btn"
              >
                Generate
              </Button>
            </Box>

            {/* Tool Cards Grid */}
            <Box
              css={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '$4',
                mb: '$5',
              }}
            >
              {IMAGE_TOOLS.map((tool) => (
                <ToolCardComponent 
                  key={tool.id} 
                  tool={tool} 
                  onUnavailable={() => showNotification('AI Service Not Configured')}
                />
              ))}
            </Box>

            {/* Assets Library */}
            <Box>
              <Text style="h6" css={{ color: '$gray12', mb: '$4' }}>Assets Library</Text>
              <Box
                css={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '$3',
                }}
              >
                {PLACEHOLDER_ASSETS.map((asset) => (
                  <AssetCardComponent key={asset.id} asset={asset} />
                ))}
              </Box>
            </Box>
          </Box>

          {/* Right Sidebar */}
          <Box css={{ width: '100%', '@bp1000': { width: 280 } }}>
            {/* Recent Uploads */}
            <Box
              css={{
                p: '$4',
                mb: '$4',
                background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 20, 40, 0.9) 100%)',
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Flex justify="between" align="center" css={{ mb: '$3' }}>
                <Text style="subtitle1" css={{ color: '$gray12' }}>Recent Uploads</Text>
              </Flex>
              
              {/* Upload Preview */}
              <Box
                css={{
                  p: '$3',
                  mb: '$3',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Flex css={{ gap: '$3' }} align="center">
                  <Box
                    css={{
                      width: 56,
                      height: 56,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text css={{ fontSize: 24, opacity: 0.5 }}>🚀</Text>
                  </Box>
                  <Box css={{ flex: 1 }}>
                    <Text style="body3" css={{ color: '$gray12', fontWeight: 600 }}>Space Explorer</Text>
                    <Button size="small" css={{ mt: '$2', fontSize: 11 }}>
                      Create
                    </Button>
                  </Box>
                </Flex>
              </Box>

              <Link href="/mint" passHref legacyBehavior>
                <Button
                  as="a"
                  size="small"
                  color="gray3"
                  css={{ width: '100%' }}
                >
                  Upload File →
                </Button>
              </Link>
            </Box>

            {/* Feature NFT CTA */}
            <FeatureNFTCard onClick={handleFeatureNFT} />
          </Box>
        </Flex>
      </Box>
    </Layout>
  )
}

export default CreateHubPage
