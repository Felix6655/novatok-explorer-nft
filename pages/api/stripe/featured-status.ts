import type { NextApiRequest, NextApiResponse } from 'next'
import { featuredNFTs } from './webhook'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { nftId } = req.query

  if (!nftId || typeof nftId !== 'string') {
    return res.status(400).json({ error: 'Missing nftId parameter' })
  }

  const featured = featuredNFTs.get(nftId)

  if (!featured) {
    return res.status(200).json({
      ok: true,
      is_featured: false,
      featured_until: null,
    })
  }

  // Check if still within featured period
  const now = new Date()
  const isFeatured = featured.featuredUntil > now

  if (!isFeatured) {
    // Clean up expired entry
    featuredNFTs.delete(nftId)
  }

  return res.status(200).json({
    ok: true,
    is_featured: isFeatured,
    featured_until: isFeatured ? featured.featuredUntil.toISOString() : null,
  })
}
