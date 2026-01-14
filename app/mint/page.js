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
import { Loader2, CheckCircle, ExternalLink, ImageIcon, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { isAddress } from 'viem'

// Helper to validate URL
function isValidUrl(string) {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Helper to create a simple tokenURI - just the image URL for now
function createSimpleTokenURI(imageUrl) {
  // For simplicity, just return the image URL directly as the tokenURI
  // The contract stores this string on-chain
  return imageUrl
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

  // Derived state
  const isWrongNetwork = isConnected && chain?.id !== SEPOLIA_CHAIN_ID
  const hasValidContractAddress = NFT_CONTRACT_ADDRESS && isAddress(NFT_CONTRACT_ADDRESS)
  const isValidImageUrl = isValidUrl(imageUrl)
  
  // Can mint only if all conditions are met
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

    // Validation
    if (!isConnected) {
      setLocalError('Please connect your wallet first')
      return
    }

    if (isWrongNetwork) {
      setLocalError('Please switch to Sepolia network')
      return
    }

    if (!hasValidContractAddress) {
      setLocalError('NFT contract address is not configured or invalid. Please set a valid NEXT_PUBLIC_NFT_CONTRACT_ADDRESS.')
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
      // Create the tokenURI - using image URL directly for simplicity
      const tokenURI = createSimpleTokenURI(imageUrl.trim())
      
      console.log('Minting NFT with tokenURI:', tokenURI)
      console.log('Contract address:', NFT_CONTRACT_ADDRESS)
      
      // Call the contract - mint takes exactly ONE string argument
      writeContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NOVATOK_NFT_ABI,
        functionName: 'mint',
        args: [tokenURI], // Single string argument
      })
    } catch (err) {
      console.error('Mint error:', err)
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

  // Combine errors for display
  const displayError = localError || 
    (writeError?.shortMessage) || 
    (writeError?.message) || 
    ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

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
                      NFT contract address is not set. Please deploy the contract and set 
                      <code className="mx-1 px-1 py-0.5 bg-orange-500/20 rounded text-xs">
                        NEXT_PUBLIC_NFT_CONTRACT_ADDRESS
                      </code>
                      in your environment variables.
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
                        Please switch to Sepolia testnet to mint NFTs
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSwitchNetwork}
                    variant="outline" 
                    className="border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/20"
                  >
                    Switch Network
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
                    <Label htmlFor="imageUrl" className="text-white">Image URL *</Label>
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
                      Enter a direct link to your image - this will be stored on-chain as the tokenURI
                    </p>
                    {imageUrl && !isValidImageUrl && (
                      <p className="text-xs text-red-400 mt-1">
                        Please enter a valid URL starting with http:// or https://
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
