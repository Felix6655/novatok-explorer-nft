import { useState, useEffect } from 'react'
import type { NextPage } from 'next'
import { Flex, Text, Box, Button } from 'components/primitives'
import Layout from 'components/Layout'
import { Head } from 'components/Head'
import { useAccount } from 'wagmi'
import { ConnectWalletButton } from 'components/ConnectWalletButton'
import EmailCapture from 'components/EmailCapture'
import Link from 'next/link'
import { getExpectedChainName } from 'lib/config'

// ============================================
// TYPES
// ============================================

interface CreatorStats {
  nftsMinted: number
  featuredCount: number
  totalViews: number
  earnings: string
}

interface NFTItem {
  id: string
  name: string
  image: string
  status: 'draft' | 'active' | 'featured'
  views: number
  mintedAt: string
}

type PromotionTier = 'feature_nft' | 'feature_creator' | 'visibility_boost'

interface PromotionOption {
  id: PromotionTier
  title: string
  description: string
  price: string
  duration: string
  icon: string
  color: string
}

// ============================================
// MOCK DATA (Replace with real data later)
// ============================================

const MOCK_STATS: CreatorStats = {
  nftsMinted: 0,
  featuredCount: 0,
  totalViews: 0,
  earnings: '0.00',
}

const PROMOTION_OPTIONS: PromotionOption[] = [
  {
    id: 'feature_nft',
    title: 'Feature NFT',
    description: 'Highlight your NFT on the homepage carousel for maximum exposure',
    price: '0.05 ETH',
    duration: '7 days',
    icon: '⭐',
    color: 'rgba(251, 191, 36, 0.2)',
  },
  {
    id: 'feature_creator',
    title: 'Feature Creator',
    description: 'Get your creator profile featured in the "Top Creators" section',
    price: '0.1 ETH',
    duration: '14 days',
    icon: '👤',
    color: 'rgba(139, 92, 246, 0.2)',
  },
  {
    id: 'visibility_boost',
    title: 'Visibility Boost',
    description: 'Boost all your NFTs in search results and collection views',
    price: '0.02 ETH',
    duration: '3 days',
    icon: '🚀',
    color: 'rgba(59, 130, 246, 0.2)',
  },
]

// ============================================
// COMPONENTS
// ============================================

const StatCard = ({ label, value, icon }: { label: string; value: string | number; icon: string }) => (
  <Box
    css={{
      p: '$4',
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
      borderRadius: 16,
      border: '1px solid rgba(139, 92, 246, 0.2)',
      textAlign: 'center',
      flex: 1,
      minWidth: 140,
    }}
  >
    <Text css={{ fontSize: 28, mb: '$1' }}>{icon}</Text>
    <Text style="h5" css={{ color: '$gray12', mb: '$1' }}>{value}</Text>
    <Text style="body3" css={{ color: '$gray10' }}>{label}</Text>
  </Box>
)

const StatusBadge = ({ status }: { status: NFTItem['status'] }) => {
  const styles = {
    draft: { bg: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af', label: 'Draft' },
    active: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', label: 'Active' },
    featured: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', label: '⭐ Featured' },
  }
  const s = styles[status]
  
  return (
    <Box
      css={{
        px: '$2',
        py: '$1',
        borderRadius: 6,
        background: s.bg,
        display: 'inline-block',
      }}
    >
      <Text style="body3" css={{ color: s.color, fontWeight: 600 }}>{s.label}</Text>
    </Box>
  )
}

const NFTCard = ({ nft }: { nft: NFTItem }) => (
  <Box
    css={{
      background: '$gray3',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid $gray5',
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: '$primary9',
        transform: 'translateY(-2px)',
      },
    }}
  >
    <Box css={{ aspectRatio: '1', background: '$gray4', position: 'relative' }}>
      {nft.image ? (
        <img
          src={nft.image}
          alt={nft.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Flex align="center" justify="center" css={{ width: '100%', height: '100%' }}>
          <Text css={{ fontSize: 40, opacity: 0.3 }}>🖼️</Text>
        </Flex>
      )}
      <Box css={{ position: 'absolute', top: '$2', right: '$2' }}>
        <StatusBadge status={nft.status} />
      </Box>
    </Box>
    <Box css={{ p: '$3' }}>
      <Text style="subtitle1" css={{ mb: '$1' }}>{nft.name}</Text>
      <Flex justify="between" align="center">
        <Text style="body3" css={{ color: '$gray10' }}>
          {nft.views} views
        </Text>
        <Text style="body3" css={{ color: '$gray10' }}>
          {nft.mintedAt}
        </Text>
      </Flex>
    </Box>
  </Box>
)

const PromotionCard = ({ 
  option, 
  onSelect 
}: { 
  option: PromotionOption; 
  onSelect: (id: PromotionTier) => void 
}) => (
  <Box
    css={{
      p: '$4',
      background: option.color,
      borderRadius: 16,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
    }}
  >
    <Text css={{ fontSize: 32, mb: '$2' }}>{option.icon}</Text>
    <Text style="h6" css={{ mb: '$1', color: '$gray12' }}>{option.title}</Text>
    <Text style="body3" css={{ color: '$gray11', mb: '$3', minHeight: 40 }}>
      {option.description}
    </Text>
    <Flex justify="between" align="center" css={{ mb: '$3' }}>
      <Box>
        <Text style="subtitle1" css={{ color: '$primary11' }}>{option.price}</Text>
        <Text style="body3" css={{ color: '$gray10' }}>{option.duration}</Text>
      </Box>
    </Flex>
    <Button
      onClick={() => onSelect(option.id)}
      css={{ width: '100%' }}
      size="small"
    >
      Select
    </Button>
  </Box>
)

const EmptyState = () => (
  <Flex
    direction="column"
    align="center"
    justify="center"
    css={{
      py: '$6',
      px: '$4',
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)',
      borderRadius: 16,
      border: '2px dashed $gray6',
      textAlign: 'center',
    }}
  >
    <Text css={{ fontSize: 48, mb: '$3' }}>🎨</Text>
    <Text style="h6" css={{ mb: '$2', color: '$gray12' }}>No NFTs Yet</Text>
    <Text style="body2" css={{ color: '$gray10', mb: '$4', maxWidth: 300 }}>
      Start your creator journey by minting your first NFT
    </Text>
    <Link href="/mint" passHref legacyBehavior>
      <Button as="a" data-testid="mint-first-nft-btn">
        Mint Your First NFT
      </Button>
    </Link>
  </Flex>
)

// ============================================
// MAIN PAGE
// ============================================

const CreatorHubPage: NextPage = () => {
  const { address, isConnected } = useAccount()
  const [stats, setStats] = useState<CreatorStats>(MOCK_STATS)
  const [nfts, setNfts] = useState<NFTItem[]>([])
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionTier | null>(null)
  const [showPromoModal, setShowPromoModal] = useState(false)

  // Load creator data (mock for now)
  useEffect(() => {
    if (isConnected && address) {
      // TODO: Fetch real data from blockchain/API
      // For now, using mock data
      setStats(MOCK_STATS)
      setNfts([])
    }
  }, [isConnected, address])

  const handlePromotionSelect = (tier: PromotionTier) => {
    setSelectedPromotion(tier)
    setShowPromoModal(true)
    // TODO: Implement payment flow
    alert(`Promotion "${tier}" selected. Payment integration coming soon!`)
  }

  return (
    <Layout>
      <Head title="Creator Hub" />
      <Box css={{ maxWidth: 1200, mx: 'auto', p: '$4' }}>
        {/* Header */}
        <Flex 
          justify="between" 
          align="center" 
          css={{ 
            mb: '$5',
            pb: '$4',
            borderBottom: '1px solid $gray5',
          }}
        >
          <Box>
            <Text style="h3" css={{ mb: '$1' }} data-testid="creator-hub-title">
              Creator Hub
            </Text>
            <Text style="body2" css={{ color: '$gray10' }}>
              Manage, promote, and monetize your NFT creations
            </Text>
          </Box>
          <Link href="/mint" passHref legacyBehavior>
            <Button as="a" data-testid="create-new-btn">
              + Create New
            </Button>
          </Link>
        </Flex>

        {/* Not Connected State */}
        {!isConnected && (
          <Flex
            direction="column"
            align="center"
            justify="center"
            css={{
              py: '$6',
              px: '$4',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
              borderRadius: 16,
              border: '1px solid rgba(139, 92, 246, 0.3)',
              textAlign: 'center',
            }}
          >
            <Text css={{ fontSize: 48, mb: '$3' }}>🔗</Text>
            <Text style="h5" css={{ mb: '$2', color: '$gray12' }}>
              Connect Your Wallet
            </Text>
            <Text style="body2" css={{ color: '$gray10', mb: '$4', maxWidth: 400 }}>
              Connect your wallet to access your Creator Hub and manage your NFTs on {getExpectedChainName()}
            </Text>
            <ConnectWalletButton />
          </Flex>
        )}

        {/* Connected State */}
        {isConnected && (
          <Flex css={{ gap: '$5', flexDirection: 'column', '@bp1000': { flexDirection: 'row' } }}>
            {/* Main Content */}
            <Box css={{ flex: 1 }}>
              {/* Stats Section */}
              <Box css={{ mb: '$5' }}>
                <Text style="subtitle1" css={{ mb: '$3', color: '$gray11' }}>
                  Your Stats
                </Text>
                <Flex css={{ gap: '$3', flexWrap: 'wrap' }}>
                  <StatCard label="NFTs Minted" value={stats.nftsMinted} icon="🖼️" />
                  <StatCard label="Featured" value={stats.featuredCount} icon="⭐" />
                  <StatCard label="Total Views" value={stats.totalViews} icon="👁️" />
                  <StatCard label="Earnings (ETH)" value={stats.earnings} icon="💰" />
                </Flex>
              </Box>

              {/* My NFTs Section */}
              <Box>
                <Flex justify="between" align="center" css={{ mb: '$3' }}>
                  <Text style="subtitle1" css={{ color: '$gray11' }}>
                    My NFTs
                  </Text>
                  <Link href="/my-nfts" passHref legacyBehavior>
                    <Button as="a" color="gray3" size="small">
                      View All →
                    </Button>
                  </Link>
                </Flex>

                {nfts.length > 0 ? (
                  <Box
                    css={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '$3',
                    }}
                  >
                    {nfts.map((nft) => (
                      <NFTCard key={nft.id} nft={nft} />
                    ))}
                  </Box>
                ) : (
                  <EmptyState />
                )}
              </Box>
            </Box>

            {/* Promotions Sidebar */}
            <Box css={{ width: '100%', '@bp1000': { width: 320 } }}>
              <Box
                css={{
                  p: '$4',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
                  borderRadius: 16,
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  position: 'sticky',
                  top: 100,
                }}
              >
                <Flex align="center" css={{ gap: '$2', mb: '$4' }}>
                  <Text css={{ fontSize: 24 }}>📢</Text>
                  <Text style="h6" css={{ color: '$gray12' }}>
                    Promote Your Work
                  </Text>
                </Flex>
                <Text style="body3" css={{ color: '$gray10', mb: '$4' }}>
                  Boost visibility and reach more collectors with our promotion tools
                </Text>

                <Flex direction="column" css={{ gap: '$3' }}>
                  {PROMOTION_OPTIONS.map((option) => (
                    <PromotionCard
                      key={option.id}
                      option={option}
                      onSelect={handlePromotionSelect}
                    />
                  ))}
                </Flex>

                <Box
                  css={{
                    mt: '$4',
                    pt: '$3',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Text style="body3" css={{ color: '$gray9', textAlign: 'center' }}>
                    💳 Payment integration coming soon
                  </Text>
                </Box>
              </Box>
            </Box>
          </Flex>
        )}

        {/* Quick Links */}
        <Box css={{ mt: '$6', pt: '$4', borderTop: '1px solid $gray5' }}>
          <Text style="subtitle2" css={{ mb: '$3', color: '$gray10' }}>
            Quick Actions
          </Text>
          <Flex css={{ gap: '$3', flexWrap: 'wrap' }}>
            <Link href="/mint" passHref legacyBehavior>
              <Button as="a" color="secondary" size="small">
                🎨 Mint NFT
              </Button>
            </Link>
            <Link href="/my-nfts" passHref legacyBehavior>
              <Button as="a" color="secondary" size="small">
                📦 My NFTs
              </Button>
            </Link>
            <Link href="/ethereum" passHref legacyBehavior>
              <Button as="a" color="secondary" size="small">
                🔍 Explore Market
              </Button>
            </Link>
          </Flex>
        </Box>
      </Box>
    </Layout>
  )
}

export default CreatorHubPage
