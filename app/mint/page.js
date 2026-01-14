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
import { Loader2, CheckCircle, ExternalLink, ImageIcon, AlertTriangle, Bug } from 'lucide-react'
import Link from 'next/link'
import { isAddress } from 'viem'

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

// Debug panel component
function DebugPanel({ chainId, expectedChainId, contractAddress, hasWalletConnect }) {
  const [isOpen, setIsOpen] = useState(false)
  
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

export default function MintPage() {
  const { isConnected, address, chain } = useAccount()
  const { switchChain } = useSwitchChain()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [localError, setLocalError] = useState('')

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash,
  })

  // Derived state using viem's isAddress for validation
  const isWrongNetwork = isConnected && chain?.id !== SEPOLIA_CHAIN_ID
  const hasValidContractAddress = Boolean(NFT_CONTRACT_ADDRESS && isAddress(NFT_CONTRACT_ADDRESS))
  const isValidImageUrl = isValidHttpUrl(imageUrl)
  
  // Can mint only if ALL conditions are met
  const canMint = isConnected && 
                  !isWrongNetwork && 
                  hasValidContractAddress && 
                  imageUrl.trim().length > 0 &&
                  isValidImageUrl

  // Handle image URL change - clear errors
  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value)
    if (localError) setLocalError('')
  }

  const handleMint = async () => {
    // Clear previous errors
    setLocalError('')
    resetWrite?.()

    // Validation with specific error messages
    if (!isConnected) {
      setLocalError('Please connect your wallet first')
      return
    }

    if (isWrongNetwork) {
      setLocalError(`Wrong network. Please switch to Sepolia (Chain ID: ${SEPOLIA_CHAIN_ID}). Current: ${chain?.id}`)
      return
    }

    if (!NFT_CONTRACT_ADDRESS) {
      setLocalError('NFT contract address is not set. Please set NEXT_PUBLIC_NFT_CONTRACT_ADDRESS in your .env file.')
      return
    }

    if (!isAddress(NFT_CONTRACT_ADDRESS)) {
      setLocalError(`Invalid contract address format: "${NFT_CONTRACT_ADDRESS}". Must be a valid Ethereum address (0x + 40 hex chars).`)
      return
    }

    if (!imageUrl.trim()) {
      setLocalError('Please enter an image URL')
      return
    }

    if (!isValidImageUrl) {
      setLocalError('Invalid image URL. Must be a valid http:// or https:// URL.')
      return
    }

    try {
      // tokenURI is the raw image URL string - exactly what the contract expects
      const tokenURI = imageUrl.trim()
      
      console.log('[Mint] Starting mint transaction')
      console.log('[Mint] Contract:', NFT_CONTRACT_ADDRESS)
      console.log('[Mint] tokenURI:', tokenURI)
      console.log('[Mint] Function: mint(string)')
      console.log('[Mint] Args:', [tokenURI])
      
      // Call the contract - mint(string _tokenURI) takes exactly ONE string argument
      writeContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NOVATOK_NFT_ABI,
        functionName: 'mint',
        args: [tokenURI], // Single string argument - the image URL
      })
    } catch (err) {
      console.error('[Mint] Error:', err)
      setLocalError(err?.message || 'Failed to initiate mint transaction')
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
    resetWrite?.()
  }

  // Extract tokenId from logs if available
  // The NFTMinted event has tokenId as the second indexed parameter (topics[2])
  const mintedTokenId = receipt?.logs?.[0]?.topics?.[2] 
    ? parseInt(receipt.logs[0].topics[2], 16)
    : null

  // Build detailed error message from wagmi/viem error
  const getDetailedError = (error) => {
    if (!error) return ''
    
    // Try to extract the most useful error message
    if (error.shortMessage) return error.shortMessage
    if (error.details) return error.details
    if (error.cause?.shortMessage) return error.cause.shortMessage
    if (error.cause?.message) return error.cause.message
    if (error.message) return error.message
    
    return 'Transaction failed. Check console for details.'
  }

  // Combine errors for display - show full error details
  const displayError = localError || getDetailedError(writeError)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      {/* Debug Panel */}
      <DebugPanel
        chainId={chain?.id}
        expectedChainId={SEPOLIA_CHAIN_ID}
        contractAddress={ENV.NFT_CONTRACT_ADDRESS}
        hasWalletConnect={Boolean(ENV.WALLETCONNECT_PROJECT_ID)}
      />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Mint NFT</h1>
          <p className="text-white/60 mb-8">Create your unique NFT on Sepolia testnet</p>

          {/* Contract Not Configured Warning */}
          {!hasValidContractAddress && (
            <Card className="bg-orange-500/10 border-orange-500/30 mb-6">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-orange-300">Contract Not Configured</h4>
                    <p className="text-sm text-orange-200/80 mt-1">
                      {!NFT_CONTRACT_ADDRESS ? (
                        <>
                          NFT contract address is not set. Please deploy the contract and add{' '}
                          <code className="px-1 py-0.5 bg-orange-500/20 rounded text-xs">
                            NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
                          </code>{' '}
                          to your .env file.
                        </>
                      ) : (
                        <>
                          Invalid contract address format:{' '}
                          <code className="px-1 py-0.5 bg-orange-500/20 rounded text-xs break-all">
                            {NFT_CONTRACT_ADDRESS}
                          </code>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wrong Network Warning */}
          {isWrongNetwork && (
            <Card className="bg-yellow-500/10 border-yellow-500/30 mb-6">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div>
                      <h4 className="font-medium text-yellow-300">Wrong Network</h4>
                      <p className="text-sm text-yellow-200/80">
                        Connected to chain {chain?.id}. Please switch to Sepolia ({SEPOLIA_CHAIN_ID}).
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSwitchNetwork}
                    variant="outline" 
                    className="border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/20"
                  >
                    Switch to Sepolia
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isConnected ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-12 text-center">
                <p className="text-white/70">Connect your wallet to mint NFTs</p>
              </CardContent>
            </Card>
          ) : isConfirmed ? (
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="py-8">
                <div className="flex flex-col items-center text-center">
                  <CheckCircle className="h-12 w-12 text-green-400 mb-4" />
                  <h3 className="text-xl font-semibold text-green-300">NFT Minted Successfully!</h3>
                  {mintedTokenId && (
                    <p className="text-green-200/80 mt-2">Token ID: #{mintedTokenId}</p>
                  )}
                  <div className="flex gap-3 mt-6">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-green-300 hover:text-green-200"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Transaction
                    </a>
                    {mintedTokenId && (
                      <Link
                        href={`/nft/${mintedTokenId}`}
                        className="inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200"
                      >
                        View NFT
                      </Link>
                    )}
                  </div>
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="mt-6 border-green-500/50 text-green-300 hover:bg-green-500/20"
                  >
                    Mint Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">NFT Details</CardTitle>
                <CardDescription className="text-white/60">
                  Fill in the details for your new NFT
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
                    <Label htmlFor="name" className="text-white">Name (UI only)</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Awesome NFT"
                      className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <p className="text-xs text-white/40 mt-1">
                      For display purposes only - not stored on-chain
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-white">Description (UI only)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your NFT..."
                      rows={3}
                      className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <p className="text-xs text-white/40 mt-1">
                      For display purposes only - not stored on-chain
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="imageUrl" className="text-white">Image URL * (stored on-chain)</Label>
                    <Input
                      id="imageUrl"
                      value={imageUrl}
                      onChange={handleImageUrlChange}
                      placeholder="https://example.com/image.png"
                      className={`mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40 ${
                        imageUrl && !isValidImageUrl ? 'border-red-500/50' : ''
                      }`}
                    />
                    <p className="text-xs text-white/40 mt-1">
                      Direct link to your image (http/https) - this becomes the tokenURI
                    </p>
                    {imageUrl && !isValidImageUrl && (
                      <p className="text-xs text-red-400 mt-1">
                        Please enter a valid URL starting with http:// or https://
                      </p>
                    )}
                  </div>
                </div>

                {/* Errors - show full error message */}
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
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isPending ? 'Confirm in Wallet...' : 'Minting...'}
                    </>
                  ) : (
                    'Mint NFT'
                  )}
                </Button>

                {/* Help text */}
                {!canMint && isConnected && !isWrongNetwork && hasValidContractAddress && (
                  <p className="text-center text-sm text-white/40">
                    Please enter a valid image URL to enable minting
                  </p>
                )}

                {/* Transaction Hash */}
                {hash && !isConfirmed && (
                  <div className="text-center">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-300 hover:text-purple-200 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View pending transaction
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
