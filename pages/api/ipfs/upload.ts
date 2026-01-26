import type { NextApiRequest, NextApiResponse } from 'next'

// Force Node.js runtime (NOT edge) for multipart/form-data parsing
export const config = {
  api: {
    bodyParser: false,
  },
}

type ResponseData = {
  ok: boolean
  url?: string
  error?: 'unsupported_type' | 'too_large' | 'no_file' | 'server_error'
  detail?: string
}

// Allowed image extensions and their MIME types
const ALLOWED_EXTENSIONS: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Get extension from filename
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  return filename.slice(lastDot).toLowerCase()
}

// Determine MIME type from filename extension or Content-Type header
function resolveMimeType(fileName: string, headerMimeType: string): string | null {
  const ext = getExtension(fileName)
  
  // If we have a valid extension, use its MIME type
  if (ext && ALLOWED_EXTENSIONS[ext]) {
    return ALLOWED_EXTENSIONS[ext]
  }
  
  // If header MIME type is valid image type, use it
  if (headerMimeType.startsWith('image/') && headerMimeType !== 'application/octet-stream') {
    return headerMimeType
  }
  
  // Fallback: try to infer from extension even if not in allowed list
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.webp') return 'image/webp'
  
  return null
}

// Check if MIME type is allowed
function isAllowedMimeType(mimeType: string): boolean {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
  return allowedTypes.includes(mimeType)
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
        
        const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)
        if (!boundaryMatch) {
          resolve(null)
          return
        }
        const boundary = boundaryMatch[1] || boundaryMatch[2]
        
        const boundaryBuffer = Buffer.from(`--${boundary}`)
        const parts = splitBuffer(buffer, boundaryBuffer)
        
        for (const part of parts) {
          const partStr = part.toString('utf8', 0, Math.min(1000, part.length))
          
          if (partStr.includes('Content-Disposition') && partStr.includes('filename=')) {
            const filenameMatch = partStr.match(/filename="([^"]+)"/)
            const fileName = filenameMatch ? filenameMatch[1] : 'upload.png'
            
            const mimeMatch = partStr.match(/Content-Type:\s*([^\r\n]+)/)
            const headerMimeType = mimeMatch ? mimeMatch[1].trim() : 'application/octet-stream'
            
            const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'))
            if (headerEnd !== -1) {
              let fileData = part.slice(headerEnd + 4)
              const trailingCRLF = fileData.lastIndexOf(Buffer.from('\r\n'))
              if (trailingCRLF > 0) {
                fileData = fileData.slice(0, trailingCRLF)
              }
              
              // Resolve MIME type using extension fallback
              const resolvedMime = resolveMimeType(fileName, headerMimeType) || headerMimeType
              
              resolve({ file: fileData, mimeType: resolvedMime, fileName })
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
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'server_error', detail: 'Method not allowed' })
  }

  try {
    const parsed = await parseMultipartForm(req)
    
    if (!parsed || !parsed.file || parsed.file.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'no_file', 
        detail: 'No file uploaded or file is empty' 
      })
    }
    
    const { file, mimeType, fileName } = parsed
    
    // Validate file size (max 10MB)
    if (file.length > MAX_FILE_SIZE) {
      return res.status(400).json({ 
        ok: false, 
        error: 'too_large', 
        detail: `File too large (${(file.length / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.` 
      })
    }
    
    // Validate MIME type
    if (!isAllowedMimeType(mimeType)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'unsupported_type', 
        detail: `Unsupported file type: ${mimeType}. Allowed: PNG, JPG, GIF, WebP.` 
      })
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
      error: 'server_error',
      detail: error.message || 'Failed to process upload',
    })
  }
}
