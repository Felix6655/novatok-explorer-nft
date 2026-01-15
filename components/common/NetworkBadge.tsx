import { FC, useEffect, useState } from 'react'
import { Flex, Text } from 'components/primitives'
import { CHAIN_ID, isExpectedChain, getChainName, getExpectedChainName } from 'lib/config'

/**
 * Network Badge Component
 * Shows the current network status and whether user is on the expected chain
 */
const NetworkBadge: FC = () => {
  const [currentChainId, setCurrentChainId] = useState<number | null>(null)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)

  useEffect(() => {
    const checkNetwork = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' })
          const chainId = parseInt(chainIdHex as string, 16)
          setCurrentChainId(chainId)
          setIsCorrectNetwork(isExpectedChain(chainId))
        } catch (err) {
          setCurrentChainId(null)
          setIsCorrectNetwork(false)
        }
      }
    }

    checkNetwork()

    if (typeof window !== 'undefined' && window.ethereum) {
      const handleChainChanged = (chainIdHex: string) => {
        const chainId = parseInt(chainIdHex, 16)
        setCurrentChainId(chainId)
        setIsCorrectNetwork(isExpectedChain(chainId))
      }

      window.ethereum.on('chainChanged', handleChainChanged)
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  if (currentChainId === null) {
    return (
      <Flex
        align="center"
        css={{
          gap: 8,
          px: 12,
          py: 6,
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 500,
          background: '$gray3',
          border: '1px solid $gray5',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9ca3af' }} />
        <Text style="body3">Not Connected</Text>
      </Flex>
    )
  }

  return (
    <Flex
      align="center"
      css={{
        gap: 8,
        px: 12,
        py: 6,
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 500,
        background: isCorrectNetwork ? '#dcfce7' : '#fef2f2',
        border: `1px solid ${isCorrectNetwork ? '#86efac' : '#fca5a5'}`,
        color: isCorrectNetwork ? '#166534' : '#991b1b',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isCorrectNetwork ? '#22c55e' : '#ef4444',
        }}
      />
      <Text style="body3" css={{ color: 'inherit' }}>
        {getChainName(currentChainId)}
      </Text>
      {!isCorrectNetwork && (
        <Text style="body3" css={{ fontSize: 11, opacity: 0.8, color: 'inherit' }}>
          (Expected: {getExpectedChainName()})
        </Text>
      )}
    </Flex>
  )
}

export default NetworkBadge
