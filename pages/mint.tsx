import { useState, useEffect } from 'react'
import type { NextPage } from 'next'
import { Flex, Text, Box, Button, Input } from 'components/primitives'
import Layout from 'components/Layout'
import { Head } from 'components/Head'
import { useAccount } from 'wagmi'
import { CHAIN_ID, CONTRACT_ADDRESS, isExpectedChain, getExpectedChainName } from 'lib/config'
import WrongNetworkBanner from 'components/common/WrongNetworkBanner'
import NetworkBadge from 'components/common/NetworkBadge'

const MintPage: NextPage = () => {
  const { address, isConnected } = useAccount()
  const [tokenURI, setTokenURI] = useState('')
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [mintResult, setMintResult] = useState<{ success: boolean; txHash?: string; message: string } | null>(null)
  const [error, setError] = useState('')
  const [uriWarning, setUriWarning] = useState('')

  // Check network on mount and on chain change
  useEffect(() => {
    const checkNetwork = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' })
          setIsWrongNetwork(!isExpectedChain(chainIdHex as string))
        } catch (err) {
          setIsWrongNetwork(true)
        }
      }
    }

    checkNetwork()

    if (typeof window !== 'undefined' && window.ethereum) {
      const handleChainChanged = (chainIdHex: string) => {
        setIsWrongNetwork(!isExpectedChain(chainIdHex))
      }

      window.ethereum.on('chainChanged', handleChainChanged)
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  // Validate tokenURI when it changes
  useEffect(() => {
    if (!tokenURI) {
      setUriWarning('')
      return
    }

    const isValidHttp = /^https?:\/\/.+/.test(tokenURI)
    const isValidIpfs = tokenURI.startsWith('ipfs://')

    if (!isValidHttp && !isValidIpfs) {
      setUriWarning('Token URI must start with http://, https://, or ipfs://')
    } else if (isValidHttp && !isValidIpfs) {
      setUriWarning('Warning: HTTP(S) URIs are less permanent. Consider using ipfs:// for better decentralization.')
    } else {
      setUriWarning('')
    }
  }, [tokenURI])

  const switchNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        setError(`Please add ${getExpectedChainName()} to your wallet manually.`)
      }
    }
  }

  const handleMint = async () => {
    // Hard guard: Block if wrong network
    if (isWrongNetwork) {
      setError('Cannot mint on wrong network. Please switch to ' + getExpectedChainName())
      return
    }

    if (!tokenURI) {
      setError('Please enter a token URI')
      return
    }

    const isValidHttp = /^https?:\/\/.+/.test(tokenURI)
    const isValidIpfs = tokenURI.startsWith('ipfs://')

    if (!isValidHttp && !isValidIpfs) {
      setError('Token URI must be a valid http(s):// or ipfs:// URL')
      return
    }

    if (!CONTRACT_ADDRESS) {
      setError('Contract address not configured')
      return
    }

    setIsMinting(true)
    setError('')
    setMintResult(null)

    try {
      const accounts = await window.ethereum?.request({ method: 'eth_accounts' }) as string[]
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet connected')
      }

      // Encode mint(string tokenURI) function call
      const encoder = new TextEncoder()
      const tokenURIBytes = encoder.encode(tokenURI)
      const paddedLength = Math.ceil(tokenURIBytes.length / 32) * 32
      
      let data = '0xd85d3d27' // mint(string) selector
      data += '0000000000000000000000000000000000000000000000000000000000000020' // offset to string data
      data += tokenURIBytes.length.toString(16).padStart(64, '0') // string length
      
      let hexStr = ''
      for (let i = 0; i < tokenURIBytes.length; i++) {
        hexStr += tokenURIBytes[i].toString(16).padStart(2, '0')
      }
      data += hexStr.padEnd(paddedLength * 2, '0')

      const txHash = await window.ethereum?.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: CONTRACT_ADDRESS,
          data: data,
        }],
      }) as string

      setMintResult({
        success: true,
        txHash,
        message: 'NFT minted successfully!',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to mint NFT')
    } finally {
      setIsMinting(false)
    }
  }

  const isButtonDisabled = isWrongNetwork || !isConnected || isMinting || !tokenURI

  return (
    <Layout>
      <Head title="Mint NFT" />
      <WrongNetworkBanner />
      <Flex direction="column" css={{ maxWidth: 600, mx: 'auto', p: '$4', gap: '$4' }}>
        <Flex justify="between" align="center">
          <Text style="h4">Mint NFT</Text>
          <NetworkBadge />
        </Flex>
        <Text style="body2" css={{ color: '$gray11' }}>
          Mint a new NFT with a custom token URI
        </Text>

        {isWrongNetwork && isConnected && (
          <Box css={{ p: '$4', background: '#fef3c7', borderRadius: 8, border: '1px solid #f59e0b' }}>
            <Text style="body2" css={{ color: '#92400e', mb: '$2' }}>
              ⚠️ Wrong Network - Please switch to {getExpectedChainName()}
            </Text>
            <Button onClick={switchNetwork} size="small">
              Switch Network
            </Button>
          </Box>
        )}

        <Box>
          <Text style="subtitle2" css={{ mb: '$2' }}>Token URI</Text>
          <Input
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
            placeholder="ipfs://... or https://..."
            disabled={isWrongNetwork}
            css={{ width: '100%' }}
          />
          {uriWarning && (
            <Text style="body3" css={{ mt: '$2', p: '$2', background: '#fef3c7', borderRadius: 6, color: '#92400e' }}>
              {uriWarning}
            </Text>
          )}
          <Text style="body3" css={{ mt: '$2', color: '$gray10' }}>
            Enter the metadata URI for your NFT. IPFS URIs (ipfs://...) are recommended.
          </Text>
        </Box>

        {error && (
          <Box css={{ p: '$3', background: '#fef2f2', borderRadius: 8 }}>
            <Text style="body2" css={{ color: '#991b1b' }}>{error}</Text>
          </Box>
        )}

        {mintResult && mintResult.success && (
          <Box css={{ p: '$3', background: '#dcfce7', borderRadius: 8, border: '1px solid #86efac' }}>
            <Text style="body2" css={{ color: '#166534' }}>✅ {mintResult.message}</Text>
            <Text style="body3" css={{ color: '#166534', wordBreak: 'break-all', mt: '$2' }}>
              Transaction: {mintResult.txHash}
            </Text>
          </Box>
        )}

        <Button
          onClick={handleMint}
          disabled={isButtonDisabled}
          css={{ width: '100%' }}
        >
          {isMinting ? 'Minting...' : 'Mint NFT'}
        </Button>
      </Flex>
    </Layout>
  )
}

export default MintPage
