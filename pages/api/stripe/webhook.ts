import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { buffer } from 'micro'

// Disable body parsing for raw webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}

// Initialize Stripe
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(secretKey)
}

// In-memory store for featured NFTs (replace with DB in production)
// This is exported so other routes can read it
export const featuredNFTs: Map<string, { walletAddress: string; featuredUntil: Date }> = new Map()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return res.status(500).json({ error: 'Webhook not configured' })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    const buf = await buffer(req)
    const signature = req.headers['stripe-signature'] as string

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' })
    }

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(buf, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    
    // Extract metadata
    const { nftId, walletAddress, promotionType } = session.metadata || {}

    if (nftId && walletAddress && promotionType === 'feature_nft') {
      // Calculate featured_until (7 days from now)
      const featuredUntil = new Date()
      featuredUntil.setDate(featuredUntil.getDate() + 7)

      // Store featured status
      featuredNFTs.set(nftId, {
        walletAddress,
        featuredUntil,
      })

      console.log(`[Feature NFT] Activated: nftId=${nftId}, wallet=${walletAddress}, until=${featuredUntil.toISOString()}`)
      
      // TODO: In production, persist to database:
      // await db.collection('featured_nfts').updateOne(
      //   { nftId },
      //   { $set: { is_featured: true, featured_until: featuredUntil, walletAddress } },
      //   { upsert: true }
      // )
    }
  }

  // Return 200 to acknowledge receipt
  return res.status(200).json({ received: true })
}
