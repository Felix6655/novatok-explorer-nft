import { NextResponse } from 'next/server';

/**
 * IPFS Upload API Route
 * Uploads image and metadata to IPFS via Pinata
 * 
 * POST /api/ipfs/upload
 * Body: { imageBase64: string, metadata: object, fileName?: string }
 * Returns: { metadataUri: string, imageUri: string }
 */

const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || '';
const PINATA_JWT = process.env.PINATA_JWT || '';

export async function POST(request) {
  try {
    const { imageBase64, metadata, fileName } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    if (!metadata || !metadata.name) {
      return NextResponse.json(
        { error: 'Metadata with name is required' },
        { status: 400 }
      );
    }

    // Check for Pinata credentials
    if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
      return NextResponse.json(
        { error: 'IPFS service not configured. Please set PINATA_JWT or PINATA_API_KEY/PINATA_SECRET_KEY.' },
        { status: 500 }
      );
    }

    // Prepare headers for Pinata API
    const headers = PINATA_JWT
      ? { Authorization: `Bearer ${PINATA_JWT}` }
      : {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        };

    // 1. Upload image to IPFS
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const imageFormData = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    const imageName = fileName || `nft-image-${Date.now()}.png`;
    imageFormData.append('file', imageBlob, imageName);
    
    // Add pinata metadata
    const pinataMetadata = JSON.stringify({
      name: `${metadata.name} - Image`,
    });
    imageFormData.append('pinataMetadata', pinataMetadata);

    const imageResponse = await fetch(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      {
        method: 'POST',
        headers,
        body: imageFormData,
      }
    );

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      throw new Error(`Failed to upload image to IPFS: ${errorText}`);
    }

    const imageResult = await imageResponse.json();
    const imageIpfsHash = imageResult.IpfsHash;
    const imageUri = `ipfs://${imageIpfsHash}`;

    // 2. Create and upload metadata JSON
    const fullMetadata = {
      ...metadata,
      image: imageUri,
    };

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
    );

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      throw new Error(`Failed to upload metadata to IPFS: ${errorText}`);
    }

    const metadataResult = await metadataResponse.json();
    const metadataIpfsHash = metadataResult.IpfsHash;
    const metadataUri = `ipfs://${metadataIpfsHash}`;

    return NextResponse.json({
      metadataUri,
      imageUri,
      metadataHash: metadataIpfsHash,
      imageHash: imageIpfsHash,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to upload to IPFS' },
      { status: 500 }
    );
  }
}
