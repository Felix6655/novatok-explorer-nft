import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

// MVP: Store emails in a JSON file. Replace with MongoDB/Postgres in production.
const DATA_DIR = path.join(process.cwd(), '.data')
const EMAILS_FILE = path.join(DATA_DIR, 'creator-emails.json')

interface CreatorEmail {
  email: string
  walletAddress: string | null
  createdAt: string
  source: 'creator_hub' | 'mint_success' | 'promotion' | 'general'
  optInMarketing: boolean
}

interface EmailsData {
  creators: CreatorEmail[]
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readEmails(): EmailsData {
  ensureDataDir()
  if (!fs.existsSync(EMAILS_FILE)) {
    return { creators: [] }
  }
  try {
    const data = fs.readFileSync(EMAILS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { creators: [] }
  }
}

function writeEmails(data: EmailsData) {
  ensureDataDir()
  fs.writeFileSync(EMAILS_FILE, JSON.stringify(data, null, 2))
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // POST: Save email
  if (req.method === 'POST') {
    try {
      const { email, walletAddress, source, optInMarketing } = req.body

      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ ok: false, error: 'Invalid email address' })
      }

      const data = readEmails()
      
      // Check if email already exists
      const existingIndex = data.creators.findIndex(c => c.email.toLowerCase() === email.toLowerCase())
      
      if (existingIndex >= 0) {
        // Update existing record with new wallet if provided
        if (walletAddress && !data.creators[existingIndex].walletAddress) {
          data.creators[existingIndex].walletAddress = walletAddress
        }
        // Update opt-in preference if explicitly set
        if (typeof optInMarketing === 'boolean') {
          data.creators[existingIndex].optInMarketing = optInMarketing
        }
      } else {
        // Add new creator
        data.creators.push({
          email: email.toLowerCase(),
          walletAddress: walletAddress || null,
          createdAt: new Date().toISOString(),
          source: source || 'general',
          optInMarketing: optInMarketing !== false,
        })
      }

      writeEmails(data)

      // Hook placeholder for future automation
      // TODO: Trigger welcome email via SendGrid/Resend
      // TODO: Add to email automation sequence
      console.log(`[Creator Email] New signup: ${email} from ${source}`)

      return res.status(200).json({ 
        ok: true, 
        message: 'Email saved successfully',
        // Placeholder for automation status
        automationHooks: {
          welcomeEmail: 'pending', // TODO: implement
          promotionReminders: 'pending', // TODO: implement
        }
      })
    } catch (error: any) {
      console.error('Email save error:', error)
      return res.status(500).json({ ok: false, error: 'Failed to save email' })
    }
  }

  // GET: Check if email exists (for pre-filling forms)
  if (req.method === 'GET') {
    const { walletAddress } = req.query

    if (!walletAddress) {
      return res.status(400).json({ ok: false, error: 'Wallet address required' })
    }

    const data = readEmails()
    const creator = data.creators.find(c => 
      c.walletAddress?.toLowerCase() === (walletAddress as string).toLowerCase()
    )

    return res.status(200).json({
      ok: true,
      hasEmail: !!creator,
      email: creator?.email || null,
      optInMarketing: creator?.optInMarketing ?? null,
    })
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' })
}
