import type { NextApiRequest, NextApiResponse } from 'next'

// Force Node.js runtime (NOT edge) for multipart/form-data parsing
export const config = {
  api: {
    bodyParser: false, // Disable default body parser for multipart
  },
}

type ResponseData = {
  ok: boolean
  url?: string
  error?: string
}

// Simple multipart parser for Vercel Node runtime
async function parseMultipartForm(req: NextApiRequest): Promise<{ file: Buffer; mimeType: string; fileName: string } | null> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks)
        const contentType = req.headers['content-type'] || ''
        
        // Extract boundary from content-type
        const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)
        if (!boundaryMatch) {
          resolve(null)
          return
        }
        const boundary = boundaryMatch[1] || boundaryMatch[2]
        
        // Parse multipart data
        const boundaryBuffer = Buffer.from(`--${boundary}`)
        const parts = splitBuffer(buffer, boundaryBuffer)
        
        for (const part of parts) {
          const partStr = part.toString('utf8', 0, Math.min(1000, part.length))
          
          // Check if this part contains a file
          if (partStr.includes('Content-Disposition') && partStr.includes('filename=')) {
            // Extract filename
            const filenameMatch = partStr.match(/filename="([^"]+)"/)
            const fileName = filenameMatch ? filenameMatch[1] : 'upload.png'
            
            // Extract content type
            const mimeMatch = partStr.match(/Content-Type:\s*([^\r\n]+)/)
            const mimeType = mimeMatch ? mimeMatch[1].trim() : 'image/png'
            
            // Find the start of binary data (after \r\n\r\n)
            const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'))
            if (headerEnd !== -1) {
              // Extract file data, removing trailing \r\n
              let fileData = part.slice(headerEnd + 4)
              // Remove trailing boundary markers
              const trailingCRLF = fileData.lastIndexOf(Buffer.from('\r\n'))
              if (trailingCRLF > 0) {
                fileData = fileData.slice(0, trailingCRLF)
              }
              
              resolve({ file: fileData, mimeType, fileName })
              return
            }
          }
        }
        
        resolve(null)
      } catch (err) {
        reject(err)
      }
    })
    
    req.on('error', reject)
  })
}

// Helper to split buffer by boundary
function splitBuffer(buffer: Buffer, boundary: Buffer): Buffer[] {
  const parts: Buffer[] = []
  let start = 0
  let index = buffer.indexOf(boundary, start)
  
  while (index !== -1) {
    if (start !== index) {
      parts.push(buffer.slice(start, index))
    }
    start = index + boundary.length
    index = buffer.indexOf(boundary, start)
  }
  
  if (start < buffer.length) {
    parts.push(buffer.slice(start))
  }
  
  return parts
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    // Parse multipart form data
    const parsed = await parseMultipartForm(req)
    
    if (!parsed || !parsed.file || parsed.file.length === 0) {
      return res.status(400).json({ ok: false, error: 'No file uploaded or file is empty' })
    }
    
    const { file, mimeType } = parsed
    
    // Validate file size (max 5MB)
    if (file.length > 5 * 1024 * 1024) {
      return res.status(400).json({ ok: false, error: 'File too large. Maximum size is 5MB.' })
    }
    
    // Validate mime type
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ ok: false, error: 'Only image files are allowed' })
    }
    
    // Convert to base64 data URL
    const base64 = file.toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64}`
    
    return res.status(200).json({
      ok: true,
      url: dataUrl,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to process upload',
    })
  }
}
