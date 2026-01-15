import type { NextApiRequest, NextApiResponse } from 'next'

const PINATA_JWT = process.env.PINATA_JWT || ''
const PINATA_API_KEY = process.env.PINATA_API_KEY || ''
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || ''

type ResponseData = {
  metadataUri?: string
  imageUri?: string
  metadataHash?: string
  imageHash?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { imageBase64, metadata, fileName } = req.body

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image is required' })
    }

    if (!metadata || !metadata.name) {
      return res.status(400).json({ error: 'Metadata with name is required' })
    }

    // Check for Pinata credentials
    if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
      return res.status(500).json({
        error: 'IPFS service not configured. Please set PINATA_JWT or PINATA_API_KEY/PINATA_SECRET_KEY.',
      })
    }

    // Prepare headers for Pinata API
    const headers: Record<string, string> = PINATA_JWT
      ? { Authorization: `Bearer ${PINATA_JWT}` }
      : {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        }

    // 1. Upload image to IPFS
    const imageBuffer = Buffer.from(imageBase64, 'base64')
    const imageFormData = new FormData()
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' })
    const imageName = fileName || `nft-image-${Date.now()}.png`
    imageFormData.append('file', imageBlob, imageName)

    const pinataMetadata = JSON.stringify({
      name: `${metadata.name} - Image`,
    })
    imageFormData.append('pinataMetadata', pinataMetadata)

    const imageResponse = await fetch(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      {
        method: 'POST',
        headers,
        body: imageFormData,
      }
    )

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text()
      throw new Error(`Failed to upload image to IPFS: ${errorText}`)
    }

    const imageResult = await imageResponse.json()
    const imageIpfsHash = imageResult.IpfsHash
    const imageUri = `ipfs://${imageIpfsHash}`

    // 2. Create and upload metadata JSON
    const fullMetadata = {
      ...metadata,
      image: imageUri,
    }

    const metadataResponse = await fetch(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pinataContent: fullMetadata,
          pinataMetadata: {
            name: `${metadata.name} - Metadata`,
          },
        }),
      }
    )

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text()
      throw new Error(`Failed to upload metadata to IPFS: ${errorText}`)
    }

    const metadataResult = await metadataResponse.json()
    const metadataIpfsHash = metadataResult.IpfsHash
    const metadataUri = `ipfs://${metadataIpfsHash}`

    return res.status(200).json({
      metadataUri,
      imageUri,
      metadataHash: metadataIpfsHash,
      imageHash: imageIpfsHash,
    })
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || 'Failed to upload to IPFS',
    })
  }
}
