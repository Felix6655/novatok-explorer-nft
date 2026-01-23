import { useState } from 'react'
import { Flex, Text, Box, Button, Input } from 'components/primitives'

interface EmailCaptureProps {
  walletAddress?: string | null
  source: 'creator_hub' | 'mint_success' | 'promotion' | 'general'
  title?: string
  description?: string
  onSuccess?: () => void
  compact?: boolean
}

export const EmailCapture = ({
  walletAddress,
  source,
  title = 'Stay Updated',
  description = 'Get notified about new features, promotion opportunities, and marketplace updates.',
  onSuccess,
  compact = false,
}: EmailCaptureProps) => {
  const [email, setEmail] = useState('')
  const [optInMarketing, setOptInMarketing] = useState(true)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setErrorMessage('Please enter your email')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/creator/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          walletAddress,
          source,
          optInMarketing,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Failed to save email')
      }

      setStatus('success')
      onSuccess?.()
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <Box
        css={{
          p: compact ? '$3' : '$4',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.1) 100%)',
          borderRadius: 12,
          border: '1px solid rgba(34, 197, 94, 0.3)',
          textAlign: 'center',
        }}
      >
        <Text css={{ fontSize: 24, mb: '$2' }}>✅</Text>
        <Text style="subtitle2" css={{ color: '#22c55e' }}>
          You&apos;re all set!
        </Text>
        <Text style="body3" css={{ color: '$gray11', mt: '$1' }}>
          We&apos;ll keep you updated on new opportunities.
        </Text>
      </Box>
    )
  }

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      css={{
        p: compact ? '$3' : '$4',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
        borderRadius: 12,
        border: '1px solid rgba(139, 92, 246, 0.2)',
      }}
    >
      {!compact && (
        <>
          <Flex align="center" css={{ gap: '$2', mb: '$2' }}>
            <Text css={{ fontSize: 20 }}>📧</Text>
            <Text style="subtitle2" css={{ color: '$gray12' }}>{title}</Text>
          </Flex>
          <Text style="body3" css={{ color: '$gray10', mb: '$3' }}>
            {description}
          </Text>
        </>
      )}

      <Flex css={{ gap: '$2', flexDirection: compact ? 'row' : 'column', '@bp600': { flexDirection: 'row' } }}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={status === 'loading'}
          css={{ flex: 1 }}
          data-testid="email-capture-input"
        />
        <Button
          type="submit"
          disabled={status === 'loading' || !email}
          size={compact ? 'small' : 'medium'}
          data-testid="email-capture-submit"
        >
          {status === 'loading' ? 'Saving...' : 'Subscribe'}
        </Button>
      </Flex>

      {!compact && (
        <Flex 
          as="label" 
          align="center" 
          css={{ gap: '$2', mt: '$3', cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={optInMarketing}
            onChange={(e) => setOptInMarketing(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <Text style="body3" css={{ color: '$gray10' }}>
            Send me promotion opportunities and marketplace tips
          </Text>
        </Flex>
      )}

      {status === 'error' && errorMessage && (
        <Text style="body3" css={{ color: '#f87171', mt: '$2' }}>
          {errorMessage}
        </Text>
      )}
    </Box>
  )
}

// Compact inline version for post-action capture
export const EmailCaptureInline = ({
  walletAddress,
  source,
  message = 'Get notified when your NFT sells or gets featured:',
}: {
  walletAddress?: string | null
  source: 'creator_hub' | 'mint_success' | 'promotion' | 'general'
  message?: string
}) => {
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!email) return
    setLoading(true)
    try {
      await fetch('/api/creator/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, walletAddress, source, optInMarketing: true }),
      })
      setSaved(true)
    } catch {
      // Silent fail for inline capture
    } finally {
      setLoading(false)
    }
  }

  if (saved) {
    return (
      <Text style="body3" css={{ color: '#22c55e' }}>
        ✓ We&apos;ll notify you at {email}
      </Text>
    )
  }

  return (
    <Flex css={{ gap: '$2', alignItems: 'center', flexWrap: 'wrap' }}>
      <Text style="body3" css={{ color: '$gray10' }}>{message}</Text>
      <Flex css={{ gap: '$1' }}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          css={{ width: 180, fontSize: 12, py: '$1' }}
        />
        <Button size="small" onClick={handleSave} disabled={loading || !email}>
          {loading ? '...' : 'Notify Me'}
        </Button>
      </Flex>
    </Flex>
  )
}

export default EmailCapture
