import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import fs from 'fs'
import path from 'path'

// Initialize Stripe
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(secretKey)
}

// Persistent storage path
const DATA_DIR = path.join(process.cwd(), '.data')
const FEATURED_FILE = path.join(DATA_DIR, 'featured-nfts.json')

interface FeaturedNFT {
  nftId: string
  walletAddress: string
  featuredUntil: string
  createdAt: string
}

interface FeaturedData {
  nfts: FeaturedNFT[]
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function readFeaturedNFTs(): FeaturedData {
  ensureDataDir()
  if (!fs.existsSync(FEATURED_FILE)) {
    return { nfts: [] }
  }
  try {
    const data = fs.readFileSync(FEATURED_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { nfts: [] }
  }
}

export function writeFeaturedNFTs(data: FeaturedData) {
  ensureDataDir()
  fs.writeFileSync(FEATURED_FILE, JSON.stringify(data, null, 2))
}

export function addFeaturedNFT(nftId: string, walletAddress: string) {
  const data = readFeaturedNFTs()
  const featuredUntil = new Date()
  featuredUntil.setDate(featuredUntil.getDate() + 7)

  // Remove existing entry if exists
  data.nfts = data.nfts.filter(n => n.nftId !== nftId)

  // Add new entry
  data.nfts.push({
    nftId,
    walletAddress,
    featuredUntil: featuredUntil.toISOString(),
    createdAt: new Date().toISOString(),
  })

  writeFeaturedNFTs(data)
  return featuredUntil
}

export function getFeaturedStatus(nftId: string): { is_featured: boolean; featured_until: string | null } {
  const data = readFeaturedNFTs()
  const nft = data.nfts.find(n => n.nftId === nftId)

  if (!nft) {
    return { is_featured: false, featured_until: null }
  }

  const now = new Date()
  const featuredUntil = new Date(nft.featuredUntil)

  if (featuredUntil > now) {
    return { is_featured: true, featured_until: nft.featuredUntil }
  }

  return { is_featured: false, featured_until: null }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { nftId, walletAddress, promotionType } = req.body

    if (!nftId || !walletAddress) {
      return res.status(400).json({ error: 'Missing nftId or walletAddress' })
    }

    if (promotionType !== 'feature_nft') {
      return res.status(400).json({ error: 'Only feature_nft promotion is available' })
    }

    const priceId = process.env.STRIPE_FEATURE_NFT_PRICE_ID
    if (!priceId) {
      return res.status(500).json({ error: 'STRIPE_FEATURE_NFT_PRICE_ID is not configured' })
    }

    const stripe = getStripe()
    const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        nftId,
        walletAddress,
        promotionType,
      },
      success_url: `${origin}/my-nfts?featured=success&nftId=${nftId}`,
      cancel_url: `${origin}/my-nfts?featured=cancelled`,
    })

    return res.status(200).json({
      ok: true,
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Stripe checkout error:', error.message)

    if (error.message.includes('STRIPE_SECRET_KEY')) {
      return res.status(500).json({ error: 'Payment system not configured' })
    }

    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}
