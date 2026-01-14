'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { Header } from '@/components/Header'
import { NetworkBanner } from '@/components/NetworkBanner'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NOVATOK_NFT_ABI, NFT_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from '@/lib/contractConfig'
import { Loader2, CheckCircle, ExternalLink, ImageIcon, AlertTriangle, Bug, Wallet, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { isAddress } from 'viem'
import { extractTokenIdFromReceipt, truncateAddress, toEtherscanTxUrl } from '@/lib/nftUtils'

// Environment check - only show debug in development
const IS_DEV = process.env.NODE_ENV !== 'production'

// Environment variables (standardized names)
const ENV = {
  NFT_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '',
  CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111', 10),
  WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
}

// Helper to validate URL - must be http or https
function isValidHttpUrl(string) {
  if (!string || typeof string !== 'string') return false
  try {
    const url = new URL(string.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Debug panel component - only shown in development
function DebugPanel({ chainId, expectedChainId, contractAddress, hasWalletConnect, mintState }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Hide in production
  if (!IS_DEV) return null
  
  const isValidContract = contractAddress && isAddress(contractAddress)
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
      >
        <Bug className="h-4 w-4 mr-1" />
        Debug
      </Button>
      
      {isOpen && (
        <Card className="absolute bottom-12 right-0 w-80 bg-slate-800 border-slate-600 shadow-xl">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm text-slate-200">Mint Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Mint State:</span>
              <span className="text-blue-400">{mintState}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Connected Chain:</span>
              <span className={chainId === expectedChainId ? 'text-green-400' : 'text-red-400'}>
                {chainId || 'Not connected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Expected Chain:</span>
              <span className="text-slate-200">{expectedChainId} (Sepolia)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Contract Address:</span>
              <span className={isValidContract ? 'text-green-400' : 'text-red-400'}>
                {contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : 'NOT SET'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Valid Address:</span>
              <span className={isValidContract ? 'text-green-400' : 'text-red-400'}>
                {isValidContract ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">WalletConnect:</span>
              <span className={hasWalletConnect ? 'text-green-400' : 'text-yellow-400'}>
                {hasWalletConnect ? 'Configured' : 'Not configured'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-600 text-slate-500">
              <p>Mint signature: mint(string _tokenURI)</p>
              <p>Args: [imageUrl]</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Mint state enum for clarity
const MINT_STATE = {
  IDLE: 'idle',
  NOT_CONNECTED: 'not_connected',
  WRONG_NETWORK: 'wrong_network',
  CONTRACT_NOT_CONFIGURED: 'contract_not_configured',
  READY: 'ready',
  PENDING_WALLET: 'pending_wallet',
  MINTING: 'minting',
  SUCCESS: 'success',
  ERROR: 'error',
}

export default function MintPage() {
  const { isConnected, chain } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [localError, setLocalError] = useState('')
  const [mintedTokenURI, setMintedTokenURI] = useState('')
  const [copied, setCopied] = useState(false)

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash,
  })

  // Derived state using viem's isAddress for validation
  const isWrongNetwork = isConnected && chain?.id !== SEPOLIA_CHAIN_ID
  const hasValidContractAddress = Boolean(NFT_CONTRACT_ADDRESS && isAddress(NFT_CONTRACT_ADDRESS))
  const isValidImageUrl = isValidHttpUrl(imageUrl)
  
  // Determine current mint state
  const getMintState = () => {
    if (isConfirmed) return MINT_STATE.SUCCESS
    if (writeError || localError) return MINT_STATE.ERROR
    if (isConfirming) return MINT_STATE.MINTING
    if (isPending) return MINT_STATE.PENDING_WALLET
    if (!isConnected) return MINT_STATE.NOT_CONNECTED
    if (!hasValidContractAddress) return MINT_STATE.CONTRACT_NOT_CONFIGURED
    if (isWrongNetwork) return MINT_STATE.WRONG_NETWORK
    if (imageUrl.trim() && isValidImageUrl) return MINT_STATE.READY
    return MINT_STATE.IDLE
  }
  
  const mintState = getMintState()
  
  // Can mint only if ALL conditions are met
  const canMint = mintState === MINT_STATE.READY

  // Handle image URL change - clear errors
  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value)
    if (localError) setLocalError('')
  }

  const handleMint = async () => {
    // Clear previous errors
    setLocalError('')
    resetWrite?.()

    // Validation with user-friendly error messages
    if (!isConnected) {
      setLocalError('Please connect your wallet first')
      return
    }

    if (isWrongNetwork) {
      setLocalError('Please switch to Sepolia network to mint NFTs')
      return
    }

    if (!hasValidContractAddress) {
      setLocalError('NFT contract is not configured. Please contact the administrator.')
      return
    }

    if (!imageUrl.trim()) {
      setLocalError('Please enter an image URL')
      return
    }

    if (!isValidImageUrl) {
      setLocalError('Please enter a valid image URL (must start with http:// or https://)')
      return
    }

    try {
      // tokenURI is the raw image URL string - exactly what the contract expects
      const tokenURI = imageUrl.trim()
      
      // Store for success display
      setMintedTokenURI(tokenURI)
      
      // Only log in development
      if (IS_DEV) {
        console.log('[Mint] Starting mint transaction')
        console.log('[Mint] Contract:', NFT_CONTRACT_ADDRESS)
        console.log('[Mint] tokenURI:', tokenURI)
      }
      
      // Call the contract - mint(string _tokenURI) takes exactly ONE string argument
      writeContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NOVATOK_NFT_ABI,
        functionName: 'mint',
        args: [tokenURI], // Single string argument - the image URL
      })
    } catch (err) {
      if (IS_DEV) console.error('[Mint] Error:', err)
      setLocalError('Failed to initiate transaction. Please try again.')
    }
  }

  const handleSwitchNetwork = () => {
    switchChain?.({ chainId: SEPOLIA_CHAIN_ID })
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setImageUrl('')
    setLocalError('')
    setMintedTokenURI('')
    resetWrite?.()
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Extract tokenId from logs using robust utility function
  const mintedTokenId = extractTokenIdFromReceipt(receipt, NFT_CONTRACT_ADDRESS)

  // Build user-friendly error message from wagmi/viem error
  const getUserFriendlyError = (error) => {
    if (!error) return ''
    
    // Common error patterns with user-friendly messages
    const errorMessage = error.shortMessage || error.message || ''
    
    if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
      return 'Transaction was cancelled. Please try again when ready.'
    }
    if (errorMessage.includes('insufficient funds')) {
      return 'Insufficient funds. Please add Sepolia ETH to your wallet.'
    }
    if (errorMessage.includes('nonce')) {
      return 'Transaction conflict. Please reset your wallet or wait a moment and try again.'
    }
    if (errorMessage.includes('network') || errorMessage.includes('chain')) {
      return 'Network error. Please check your connection and try again.'
    }
    
    // Return shortened message for other errors
    if (error.shortMessage) return error.shortMessage
    if (error.details) return error.details
    
    return 'Transaction failed. Please try again.'
  }

  // Display error - user-friendly version
  const displayError = localError || getUserFriendlyError(writeError)

  // Get button text based on state
  const getButtonText = () => {
    switch (mintState) {
      case MINT_STATE.PENDING_WALLET:
        return 'Confirm in Wallet...'
      case MINT_STATE.MINTING:
        return 'Minting...'
      case MINT_STATE.NOT_CONNECTED:
        return 'Connect Wallet to Mint'
      case MINT_STATE.WRONG_NETWORK:
        return 'Switch to Sepolia'
      case MINT_STATE.CONTRACT_NOT_CONFIGURED:
        return 'Contract Not Available'
      default:
        return 'Mint NFT'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      {/* Debug Panel - only visible in development */}
      <DebugPanel
        chainId={chain?.id}
        expectedChainId={SEPOLIA_CHAIN_ID}
        contractAddress={ENV.NFT_CONTRACT_ADDRESS}
        hasWalletConnect={Boolean(ENV.WALLETCONNECT_PROJECT_ID)}
        mintState={mintState}
      />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Mint NFT</h1>
          <p className="text-white/60 mb-8">Create your unique NFT on Sepolia testnet</p>

          {/* Contract Not Configured Warning - only show to developers in dev mode */}
          {!hasValidContractAddress && IS_DEV && (
            <Card className="bg-orange-500/10 border-orange-500/30 mb-6">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-orange-300">Contract Not Configured</h4>
                    <p className="text-sm text-orange-200/80 mt-1">
                      {!NFT_CONTRACT_ADDRESS ? (
                        <>
                          Set <code className="px-1 py-0.5 bg-orange-500/20 rounded text-xs">
                            NEXT_PUBLIC_NFT_CONTRACT_ADDRESS
                          </code> in your .env file.
                        </>
                      ) : (
                        <>Invalid contract address format.</>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Production-friendly contract not available message */}
          {!hasValidContractAddress && !IS_DEV && (
            <Card className="bg-slate-500/10 border-slate-500/30 mb-6">
              <CardContent className="py-6 text-center">
                <AlertTriangle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                <h4 className="font-medium text-slate-300">Minting Unavailable</h4>
                <p className="text-sm text-slate-400 mt-1">
                  NFT minting is currently not available. Please check back later.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Wrong Network Warning with Switch Button */}
          {isWrongNetwork && hasValidContractAddress && (
            <Card className="bg-yellow-500/10 border-yellow-500/30 mb-6">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-300">Wrong Network</h4>
                      <p className="text-sm text-yellow-200/80">
                        Please switch to Sepolia testnet to mint NFTs.
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSwitchNetwork}
                    disabled={isSwitching}
                    variant="outline" 
                    className="border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/20 whitespace-nowrap"
                  >
                    {isSwitching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Switching...
                      </>
                    ) : (
                      'Switch to Sepolia'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content based on State */}
          {!isConnected ? (
            // Not Connected State
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-12 text-center">
                <Wallet className="h-12 w-12 text-white/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Connect Your Wallet</h3>
                <p className="text-white/60 mb-4">Connect your wallet to start minting NFTs</p>
                <p className="text-sm text-white/40">Use the Connect Wallet button in the header</p>
              </CardContent>
            </Card>
          ) : isConfirmed ? (
            // Success State
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="py-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-300 mb-2">NFT Minted Successfully!</h3>
                  
                  {mintedTokenId && (
                    <p className="text-green-200/80 text-lg mb-4">Token ID: #{mintedTokenId}</p>
                  )}
                  
                  {/* Transaction Details */}
                  <div className="w-full max-w-md bg-black/20 rounded-lg p-4 mb-6 text-left">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-green-300/60 mb-1">Transaction Hash</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-green-200 bg-green-500/10 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                            {hash}
                          </code>
                          <button
                            onClick={() => copyToClipboard(hash)}
                            className="text-green-300 hover:text-green-200 p-1"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      
                      {mintedTokenURI && (
                        <div>
                          <p className="text-xs text-green-300/60 mb-1">Token URI (Stored On-Chain)</p>
                          <code className="text-xs text-green-200 bg-green-500/10 px-2 py-1 rounded block overflow-hidden text-ellipsis">
                            {mintedTokenURI}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-center gap-3">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Etherscan
                    </a>
                    {mintedTokenId && (
                      <Link
                        href={`/nft/${mintedTokenId}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors"
                      >
                        View NFT Details
                      </Link>
                    )}
                  </div>
                  
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="mt-6 border-green-500/50 text-green-300 hover:bg-green-500/20"
                  >
                    Mint Another NFT
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : hasValidContractAddress && !isWrongNetwork ? (
            // Ready to Mint Form
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">NFT Details</CardTitle>
                <CardDescription className="text-white/60">
                  Enter your NFT information below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Preview */}
                <div className="aspect-video relative bg-white/5 rounded-lg overflow-hidden border border-white/10">
                  {imageUrl && isValidImageUrl ? (
                    <img
                      src={imageUrl}
                      alt="NFT Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex'
                        }
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex flex-col items-center justify-center text-white/40 ${imageUrl && isValidImageUrl ? 'hidden' : ''}`}>
                    <ImageIcon className="h-12 w-12 mb-2" />
                    <span className="text-sm">Image Preview</span>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Name <span className="text-white/40 text-xs">(optional, display only)</span></Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Awesome NFT"
                      className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-white">Description <span className="text-white/40 text-xs">(optional, display only)</span></Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your NFT..."
                      rows={3}
                      className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>

                  <div>
                    <Label htmlFor="imageUrl" className="text-white">
                      Image URL <span className="text-red-400">*</span>
                      <span className="text-white/40 text-xs ml-2">(stored on-chain as tokenURI)</span>
                    </Label>
                    <Input
                      id="imageUrl"
                      value={imageUrl}
                      onChange={handleImageUrlChange}
                      placeholder="https://example.com/my-nft-image.png"
                      className={`mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40 ${
                        imageUrl && !isValidImageUrl ? 'border-red-500/50 focus:border-red-500' : ''
                      }`}
                    />
                    {imageUrl && !isValidImageUrl && (
                      <p className="text-xs text-red-400 mt-1">
                        Please enter a valid URL starting with http:// or https://
                      </p>
                    )}
                    {!imageUrl && (
                      <p className="text-xs text-white/40 mt-1">
                        Direct link to your image - this will be permanently stored on-chain
                      </p>
                    )}
                  </div>
                </div>

                {/* Errors */}
                {displayError && (
                  <ErrorBanner
                    message={displayError}
                    onDismiss={() => {
                      setLocalError('')
                      resetWrite?.()
                    }}
                  />
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleMint}
                  disabled={!canMint || isPending || isConfirming}
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {getButtonText()}
                    </>
                  ) : (
                    getButtonText()
                  )}
                </Button>

                {/* Status indicator */}
                {mintState === MINT_STATE.IDLE && (
                  <p className="text-center text-sm text-white/40">
                    Enter an image URL to enable minting
                  </p>
                )}

                {/* Pending Transaction */}
                {hash && !isConfirmed && (
                  <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-400 mx-auto mb-2" />
                    <p className="text-sm text-purple-300 mb-2">Transaction submitted!</p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View on Etherscan
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </div>
  )
}
