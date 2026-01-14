import { NextResponse } from 'next/server';

/**
 * IPFS Upload API Route
 * Uploads image and metadata to Pinata IPFS
 * 
 * POST /api/ipfs/upload
 * Body: { imageBase64: string, metadata: object }
 * Returns: { metadataUri: string, imageUri: string }
 */

// Pinata API endpoints
const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

// Environment check
const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Check if Pinata is configured
 */
function isPinataConfigured() {
  return !!process.env.PINATA_JWT || 
    (!!process.env.PINATA_API_KEY && !!process.env.PINATA_API_SECRET);
}

/**
 * Get Pinata auth headers
 */
function getPinataHeaders() {
  if (process.env.PINATA_JWT) {
    return {
      'Authorization': `Bearer ${process.env.PINATA_JWT}`,
    };
  }
  
  return {
    'pinata_api_key': process.env.PINATA_API_KEY,
    'pinata_secret_api_key': process.env.PINATA_API_SECRET,
  };
}

/**
 * Upload file to Pinata
 * @param {Buffer} fileBuffer - File data as buffer
 * @param {string} fileName - Name for the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} IPFS CID
 */
async function uploadFileToPinata(fileBuffer, fileName, mimeType) {
  const formData = new FormData();
  
  // Create a Blob from the buffer
  const blob = new Blob([fileBuffer], { type: mimeType });
  formData.append('file', blob, fileName);
  
  // Add pinata options
  const pinataOptions = JSON.stringify({
    cidVersion: 1,
  });
  formData.append('pinataOptions', pinataOptions);
  
  // Add metadata
  const pinataMetadata = JSON.stringify({
    name: fileName,
  });
  formData.append('pinataMetadata', pinataMetadata);
  
  const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: getPinataHeaders(),
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  return result.IpfsHash;
}

/**
 * Upload JSON to Pinata
 * @param {object} jsonData - JSON data to upload
 * @param {string} name - Name for the file
 * @returns {Promise<string>} IPFS CID
 */
async function uploadJSONToPinata(jsonData, name) {
  const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      ...getPinataHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: jsonData,
      pinataOptions: {
        cidVersion: 1,
      },
      pinataMetadata: {
        name: name,
      },
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinata JSON upload failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  return result.IpfsHash;
}

/**
 * Convert base64 data URL to buffer
 */
function base64ToBuffer(base64DataUrl) {
  // Remove data URL prefix (e.g., "data:image/png;base64,")
  const base64Data = base64DataUrl.split(',')[1];
  if (!base64Data) {
    throw new Error('Invalid base64 data URL');
  }
  return Buffer.from(base64Data, 'base64');
}

/**
 * Extract MIME type from data URL
 */
function getMimeType(dataUrl) {
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'application/octet-stream';
}

export async function POST(request) {
  try {
    // Check if Pinata is configured
    if (!isPinataConfigured()) {
      return NextResponse.json(
        { 
          error: 'IPFS not configured',
          message: 'Pinata API keys are not set. Please configure PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET.',
          fallback: true,
        },
        { status: 503 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { imageBase64, metadata } = body;
    
    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Missing imageBase64' },
        { status: 400 }
      );
    }
    
    if (!metadata) {
      return NextResponse.json(
        { error: 'Missing metadata' },
        { status: 400 }
      );
    }
    
    // 1. Upload image to IPFS
    if (IS_DEV) {
      console.log('[IPFS] Uploading image...');
    }
    
    const imageBuffer = base64ToBuffer(imageBase64);
    const mimeType = getMimeType(imageBase64);
    const imageName = `novatok-${metadata.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'nft'}.png`;
    
    const imageCid = await uploadFileToPinata(imageBuffer, imageName, mimeType);
    const imageUri = `ipfs://${imageCid}`;
    
    if (IS_DEV) {
      console.log('[IPFS] Image uploaded:', imageUri);
    }
    
    // 2. Update metadata with IPFS image URL and upload
    const updatedMetadata = {
      ...metadata,
      image: imageUri,
    };
    
    if (IS_DEV) {
      console.log('[IPFS] Uploading metadata...');
    }
    
    const metadataName = `${imageName.replace('.png', '')}-metadata.json`;
    const metadataCid = await uploadJSONToPinata(updatedMetadata, metadataName);
    const metadataUri = `ipfs://${metadataCid}`;
    
    if (IS_DEV) {
      console.log('[IPFS] Metadata uploaded:', metadataUri);
    }
    
    return NextResponse.json({
      success: true,
      metadataUri,
      imageUri,
      imageCid,
      metadataCid,
      gateway: {
        metadata: `${PINATA_GATEWAY}/${metadataCid}`,
        image: `${PINATA_GATEWAY}/${imageCid}`,
      },
    });
    
  } catch (error) {
    if (IS_DEV) {
      console.error('[IPFS] Upload error:', error);
    }
    
    return NextResponse.json(
      { 
        error: 'IPFS upload failed',
        message: error.message || 'Unknown error',
        fallback: true,
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const configured = isPinataConfigured();
  
  return NextResponse.json({
    configured,
    message: configured 
      ? 'IPFS (Pinata) is configured and ready'
      : 'IPFS not configured. Set PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET',
  });
}
