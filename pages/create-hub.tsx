import { useState } from 'react'
import type { NextPage } from 'next'
import { Flex, Text, Box, Button } from 'components/primitives'
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
  route?: string
}

interface AssetCard {
  id: string
  name: string
  image: string
}

// ============================================
// DATA
// ============================================

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'image', label: 'Image', icon: '🖼️' },
  { id: 'video', label: 'Video', icon: '🎬' },
  { id: 'character', label: 'Character', icon: '👤' },
  { id: 'audio', label: 'Audio', icon: '🎵' },
  { id: 'assets', label: 'Assets', icon: '📦' },
]

const IMAGE_TOOLS: ToolCard[] = [
  { id: 'generate', title: 'Generate Image', description: 'Use AI to generate unique art.', icon: '🎨', route: '/mint' },
  { id: 'edit', title: 'Edit Image', description: 'Edit and enhance your images.', icon: '✏️' },
  { id: 'upscale', title: 'Image Upscale', description: 'Improve image resolution and quality.', icon: '⬆️' },
  { id: 'remove-bg', title: 'Remove Background', description: 'Remove backgrounds with one click.', icon: '✨' },
  { id: 'erase', title: 'Erase Object', description: 'Easily remove unwanted objects.', icon: '🧹' },
  { id: 'text-to-video', title: 'Text to Video', description: 'Turn text prompts into video.', icon: '📝' },
  { id: 'motion', title: 'Motion Video', description: 'Animate any photo into a video.', icon: '🎞️' },
  { id: 'img-to-video', title: 'Image to Video', description: 'Convert any image into video clips.', icon: '🎥' },
]

const PLACEHOLDER_ASSETS: AssetCard[] = [
  { id: '1', name: 'Space Explorer', image: '' },
  { id: '2', name: 'Fire Lion', image: '' },
  { id: '3', name: 'Mecha Warrior', image: '' },
  { id: '4', name: 'Neon Dream', image: '' },
]

const RECENT_UPLOADS: AssetCard[] = [
  { id: '1', name: 'Space Explorer', image: '' },
  { id: '2', name: 'Cosmic Art', image: '' },
  { id: '3', name: 'Digital World', image: '' },
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
      display: 'flex',
      alignItems: 'center',
      gap: '$2',
      px: '$3',
      py: '$2',
      borderRadius: 8,
      background: isActive 
        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.2) 100%)'
        : 'rgba(255, 255, 255, 0.05)',
      border: isActive ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
      '&:hover': {
        background: isActive 
          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.3) 100%)'
          : 'rgba(255, 255, 255, 0.1)',
      },
    }}
    data-testid={`tab-${tab.id}`}
  >
    <span>{tab.icon}</span>
    <Text style="body3" css={{ color: isActive ? '$primary11' : '$gray11' }}>{tab.label}</Text>
    {isActive && <span style={{ color: '#22c55e' }}>✓</span>}
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
      cursor: 'pointer',
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
    <Text style="body3" css={{ color: '$gray10', mb: '$4', minHeight: 40 }}>{tool.description}</Text>
    {tool.route ? (
      <Link href={tool.route} passHref legacyBehavior>
        <Button
          as="a"
          size="small"
          css={{
            width: '100%',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          }}
        >
          Create
        </Button>
      </Link>
    ) : (
      <Button
        size="small"
        color="gray3"
        onClick={onUnavailable}
        css={{ width: '100%' }}
      >
        Create
      </Button>
    )}
  </Box>
)

const AssetCardComponent = ({ asset }: { asset: AssetCard }) => (
  <Box
    css={{
      background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.8) 0%, rgba(20, 20, 40, 0.9) 100%)',
      borderRadius: 16,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: 'rgba(139, 92, 246, 0.5)',
      },
    }}
    data-testid={`asset-${asset.id}`}
  >
    <Box css={{ aspectRatio: '1', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', position: 'relative' }}>
      {asset.image ? (
        <img src={asset.image} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <Flex align="center" justify="center" css={{ width: '100%', height: '100%' }}>
          <Text css={{ fontSize: 40, opacity: 0.3 }}>🖼️</Text>
        </Flex>
      )}
    </Box>
    <Box css={{ p: '$3' }}>
      <Text style="subtitle2" css={{ color: '$gray12', mb: '$2' }}>{asset.name}</Text>
      <Flex css={{ gap: '$2' }}>
        <Button size="small" css={{ flex: 1, fontSize: 11 }}>Create</Button>
        <Button size="small" color="gray3" css={{ px: '$2' }}>⋮</Button>
      </Flex>
    </Box>
  </Box>
)

const FeatureNFTCard = ({ onClick }: { onClick: () => void }) => (
  <Box
    onClick={onClick}
    css={{
      p: '$4',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
      borderRadius: 16,
      border: '2px solid rgba(139, 92, 246, 0.4)',
      backdropFilter: 'blur(10px)',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: 'rgba(139, 92, 246, 0.7)',
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
      },
    }}
    data-testid="feature-nft-cta"
  >
    <Box css={{ 
      width: 60, 
      height: 60, 
      borderRadius: '50%', 
      background: 'rgba(139, 92, 246, 0.2)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      mx: 'auto',
      mb: '$3',
    }}>
      <Text css={{ fontSize: 28 }}>⬆️</Text>
    </Box>
    <Text style="h6" css={{ color: '$primary11', mb: '$1' }}>Feature NFT</Text>
    <Text style="subtitle1" css={{ color: '$gray12' }}>$9</Text>
    <Text style="body3" css={{ color: '$gray10', mt: '$2' }}>
      Boost your NFT visibility on the marketplace
    </Text>
  </Box>
)

// ============================================
// MAIN PAGE
// ============================================

const CreateHubPage: NextPage = () => {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<TabType>('image')
  const [showUnavailableToast, setShowUnavailableToast] = useState(false)

  const handleUnavailable = () => {
    setShowUnavailableToast(true)
    setTimeout(() => setShowUnavailableToast(false), 3000)
  }

  const handleFeatureNFT = () => {
    // Redirect to My NFTs to select an NFT to feature
    window.location.href = '/my-nfts?action=feature'
  }

  return (
    <Layout>
      <Head title="Create Hub" />
      
      {/* Toast Notification */}
      {showUnavailableToast && (
        <Box
          css={{
            position: 'fixed',
            top: 100,
            right: 20,
            p: '$3',
            background: 'rgba(251, 191, 36, 0.9)',
            borderRadius: 8,
            zIndex: 1000,
            animation: 'slideIn 0.3s ease',
          }}
        >
          <Text style="body2" css={{ color: '#1a1a1a' }}>
            AI Service Not Configured
          </Text>
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
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
          },
        }}
      />

      <Box css={{ maxWidth: 1400, mx: 'auto', p: '$4', pt: '$5' }}>
        {/* Header */}
        <Flex justify="between" align="start" css={{ mb: '$5' }}>
          <Box>
            <Text style="h3" css={{ color: '$gray12', mb: '$2' }} data-testid="create-hub-title">
              Welcome to the Create Hub
            </Text>
            <Text style="body1" css={{ color: '$gray10' }}>
              Create, mint, and feature unique NFTs
            </Text>
          </Box>
          <Link href="/mint" passHref legacyBehavior>
            <Button
              as="a"
              css={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                },
              }}
              data-testid="create-collection-btn"
            >
              + Create Collection
            </Button>
          </Link>
        </Flex>

        {/* Connect Wallet Prompt */}
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
              Connect your wallet to start creating and minting NFTs
            </Text>
            <ConnectWalletButton />
          </Box>
        )}

        {/* Tabs */}
        <Flex css={{ gap: '$2', mb: '$5', flexWrap: 'wrap' }}>
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
            {/* Tools Grid */}
            <Box
              css={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '$4',
                mb: '$5',
              }}
            >
              {IMAGE_TOOLS.map((tool) => (
                <ToolCardComponent 
                  key={tool.id} 
                  tool={tool} 
                  onUnavailable={handleUnavailable}
                />
              ))}
            </Box>

            {/* Assets Library */}
            <Box css={{ mb: '$5' }}>
              <Text style="h6" css={{ color: '$gray12', mb: '$4' }}>Assets Library</Text>
              <Box
                css={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
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
                <Link href="/my-nfts" passHref legacyBehavior>
                  <Button as="a" size="small" color="gray3" css={{ fontSize: 11 }}>
                    Upload File →
                  </Button>
                </Link>
              </Flex>
              <Flex direction="column" css={{ gap: '$2' }}>
                {RECENT_UPLOADS.map((item) => (
                  <Flex
                    key={item.id}
                    align="center"
                    css={{
                      gap: '$3',
                      p: '$2',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.03)',
                      '&:hover': { background: 'rgba(255, 255, 255, 0.06)' },
                    }}
                  >
                    <Box
                      css={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text css={{ fontSize: 16, opacity: 0.5 }}>🖼️</Text>
                    </Box>
                    <Box css={{ flex: 1 }}>
                      <Text style="body3" css={{ color: '$gray12' }}>{item.name}</Text>
                    </Box>
                    <Button size="small" css={{ fontSize: 10, px: '$2' }}>Create</Button>
                  </Flex>
                ))}
              </Flex>
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
