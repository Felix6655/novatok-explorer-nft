import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

// Initialize Stripe - will fail gracefully if key missing
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(secretKey, { apiVersion: '2025-04-30.basil' })
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

    // Validate required fields
    if (!nftId || !walletAddress) {
      return res.status(400).json({ error: 'Missing nftId or walletAddress' })
    }

    // Only support feature_nft for now
    if (promotionType !== 'feature_nft') {
      return res.status(400).json({ error: 'Only feature_nft promotion is available' })
    }

    // Check for price ID
    const priceId = process.env.STRIPE_FEATURE_NFT_PRICE_ID
    if (!priceId) {
      return res.status(500).json({ error: 'STRIPE_FEATURE_NFT_PRICE_ID is not configured' })
    }

    const stripe = getStripe()

    // Determine URLs for redirect
    const origin = req.headers.origin || 'http://localhost:3000'
    
    // Create Stripe Checkout session
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
      success_url: `${origin}/creator-hub?featured=success&nftId=${nftId}`,
      cancel_url: `${origin}/creator-hub?featured=cancelled`,
    })

    return res.status(200).json({
      ok: true,
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Stripe checkout error:', error.message)
    
    // Return user-friendly error
    if (error.message.includes('STRIPE_SECRET_KEY')) {
      return res.status(500).json({ error: 'Payment system not configured' })
    }
    
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}
