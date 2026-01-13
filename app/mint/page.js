'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Header } from '@/components/Header'
import { NetworkBanner } from '@/components/NetworkBanner'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NOVATOK_NFT_ABI, NFT_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from '@/lib/contractConfig'
import { createTokenURI } from '@/lib/nftClient'
import { Loader2, CheckCircle, ExternalLink, ImageIcon } from 'lucide-react'
import Link from 'next/link'

export default function MintPage() {
  const { isConnected, address, chain } = useAccount()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash,
  })

  const isWrongNetwork = chain?.id !== SEPOLIA_CHAIN_ID
  const canMint = isConnected && !isWrongNetwork && NFT_CONTRACT_ADDRESS && name && imageUrl

  const handleMint = async () => {
    if (!canMint) return
    setError('')

    try {
      const tokenURI = createTokenURI(name, description, imageUrl)
      
      writeContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NOVATOK_NFT_ABI,
        functionName: 'mint',
        args: [tokenURI],
      })
    } catch (err) {
      setError(err.message || 'Failed to mint NFT')
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setImageUrl('')
    setError('')
  }

  // Extract tokenId from logs if available
  const mintedTokenId = receipt?.logs?.[0]?.topics?.[3] 
    ? parseInt(receipt.logs[0].topics[3], 16)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Mint NFT</h1>
          <p className="text-white/60 mb-8">Create your unique NFT on Sepolia testnet</p>

          {!NFT_CONTRACT_ADDRESS && (
            <ErrorBanner
              title="Contract Not Configured"
              message="NFT contract address is not set. Please deploy the contract and set NEXT_PUBLIC_NFT_CONTRACT_ADDRESS in your environment."
            />
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
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="NFT Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex flex-col items-center justify-center text-white/40 ${imageUrl ? 'hidden' : ''}`}>
                    <ImageIcon className="h-12 w-12 mb-2" />
                    <span className="text-sm">Image Preview</span>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Awesome NFT"
                      className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-white">Description</Label>
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
                    <Label htmlFor="imageUrl" className="text-white">Image URL *</Label>
                    <Input
                      id="imageUrl"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.png"
                      className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <p className="text-xs text-white/40 mt-1">
                      Enter a direct link to your image (PNG, JPG, GIF, etc.)
                    </p>
                  </div>
                </div>

                {/* Errors */}
                {(error || writeError) && (
                  <ErrorBanner
                    message={error || writeError?.shortMessage || writeError?.message || 'Transaction failed'}
                    onDismiss={() => setError('')}
                  />
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleMint}
                  disabled={!canMint || isPending || isConfirming}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
