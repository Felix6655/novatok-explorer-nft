import { FC, useEffect, useState } from 'react'
import { Flex, Text, Button } from 'components/primitives'
import { CHAIN_ID, isExpectedChain, getExpectedChainName } from 'lib/config'

/**
 * Wrong Network Banner Component
 * Shows a warning banner when user is on the wrong network
 * Includes a "Switch Network" button
 */
const WrongNetworkBanner: FC = () => {
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  useEffect(() => {
    const checkNetwork = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' })
          setIsWrongNetwork(!isExpectedChain(chainIdHex as string))
        } catch (err) {
          setIsWrongNetwork(false)
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

  const handleSwitchNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return

    setIsSwitching(true)
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        alert(`Please add ${getExpectedChainName()} to your wallet manually.`)
      }
    } finally {
      setIsSwitching(false)
    }
  }

  if (!isWrongNetwork) return null

  return (
    <Flex
      align="center"
      justify="center"
      css={{
        gap: 12,
        p: 12,
        background: 'linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)',
        borderBottom: '2px solid #f59e0b',
        flexWrap: 'wrap',
      }}
    >
      <Text style="body2" css={{ color: '#92400e' }}>
        ⚠️ <strong>Wrong Network</strong> - Please switch to {getExpectedChainName()} to continue.
      </Text>
      <Button
        onClick={handleSwitchNetwork}
        disabled={isSwitching}
        size="small"
        css={{
          background: '#f59e0b',
          color: 'white',
          '&:hover': { background: '#d97706' },
          '&:disabled': { opacity: 0.6 },
        }}
      >
        {isSwitching ? 'Switching...' : 'Switch Network'}
      </Button>
    </Flex>
  )
}

export default WrongNetworkBanner
