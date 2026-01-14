'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { Header } from '@/components/Header'
import { NetworkBanner } from '@/components/NetworkBanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { NOVATOK_NFT_ABI, NFT_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID, isContractConfigured } from '@/lib/contractConfig'
import { 
  TRAITS, 
  DEFAULT_TRAITS, 
  NFTRenderer, 
  generateMetadata, 
  generateNFT,
  generateSeed 
} from '@/lib/nftGenerator'
import { extractTokenIdFromReceipt } from '@/lib/nftUtils'
import { 
  Loader2, 
  CheckCircle, 
  ExternalLink, 
  Sparkles, 
  Download, 
  Lock,
  Unlock,
  RefreshCw,
  Wallet,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { isAddress } from 'viem'

// Environment check
const IS_DEV = process.env.NODE_ENV !== 'production'

// Generator states
const GEN_STATE = {
  EDITING: 'editing',
  PREVIEWING: 'previewing',
  GENERATED: 'generated',
  MINTING: 'minting',
  SUCCESS: 'success',
}

export default function GeneratePage() {
  const { isConnected, chain } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  
  // Trait state
  const [traits, setTraits] = useState(DEFAULT_TRAITS)
  
  // Generator state
  const [genState, setGenState] = useState(GEN_STATE.EDITING)
  const [generatedNFT, setGeneratedNFT] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  
  // Canvas ref for preview
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  
  // Mint state
  const { writeContract, data: hash, isPending: isMinting, error: mintError, reset: resetMint } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isMinted, data: receipt } = useWaitForTransactionReceipt({ hash })

  // Derived state
  const isWrongNetwork = isConnected && chain?.id !== SEPOLIA_CHAIN_ID
  const hasValidContract = isContractConfigured() && isAddress(NFT_CONTRACT_ADDRESS)
  const canMint = isConnected && !isWrongNetwork && hasValidContract && genState === GEN_STATE.GENERATED
  const isLocked = genState === GEN_STATE.GENERATED || genState === GEN_STATE.MINTING || genState === GEN_STATE.SUCCESS

  // Initialize renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new NFTRenderer(canvasRef.current, 512)
    }
  }, [])

  // Update preview when traits change
  useEffect(() => {
    if (rendererRef.current && !isLocked) {
      rendererRef.current.render(traits)
      setGenState(GEN_STATE.PREVIEWING)
    }
  }, [traits, isLocked])

  // Handle mint success
  useEffect(() => {
    if (isMinted) {
      setGenState(GEN_STATE.SUCCESS)
    }
  }, [isMinted])

  // Update trait
  const updateTrait = useCallback((key, value) => {
    if (isLocked) return
    setTraits(prev => ({ ...prev, [key]: value }))
    setError('')
  }, [isLocked])

  // Generate final NFT
  const handleGenerate = async () => {
    setIsGenerating(true)
    setError('')
    
    try {
      const nft = await generateNFT(traits, 1024)
      setGeneratedNFT(nft)
      setGenState(GEN_STATE.GENERATED)
      
      if (IS_DEV) {
        console.log('[Generate] NFT generated:', nft.seed)
      }
    } catch (err) {
      if (IS_DEV) console.error('[Generate] Error:', err)
      setError('Failed to generate NFT. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Reset to editing
  const handleReset = () => {
    setGeneratedNFT(null)
    setGenState(GEN_STATE.EDITING)
    setError('')
    resetMint?.()
    
    // Re-render preview
    if (rendererRef.current) {
      rendererRef.current.render(traits)
    }
  }

  // Randomize traits
  const handleRandomize = () => {
    if (isLocked) return
    
    const newTraits = {}
    Object.keys(TRAITS).forEach(key => {
      const options = TRAITS[key].options
      const randomIndex = Math.floor(Math.random() * options.length)
      newTraits[key] = options[randomIndex].value
    })
    setTraits(newTraits)
  }

  // Download generated image
  const handleDownload = () => {
    if (!generatedNFT?.imageDataUrl) return
    
    const link = document.createElement('a')
    link.download = `novatok-${generatedNFT.seed}.png`
    link.href = generatedNFT.imageDataUrl
    link.click()
  }

  // Handle mint
  const handleMint = async () => {
    if (!canMint || !generatedNFT) return
    
    setError('')
    setGenState(GEN_STATE.MINTING)
    
    try {
      // Create metadata with image as data URL
      const metadata = {
        ...generatedNFT.metadata,
        image: generatedNFT.imageDataUrl,
      }
      
      // Encode metadata as data URI
      const metadataJson = JSON.stringify(metadata)
      const tokenURI = `data:application/json;base64,${btoa(metadataJson)}`
      
      if (IS_DEV) {
        console.log('[Mint] Starting mint with tokenURI length:', tokenURI.length)
      }
      
      writeContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NOVATOK_NFT_ABI,
        functionName: 'mint',
        args: [tokenURI],
      })
    } catch (err) {
      if (IS_DEV) console.error('[Mint] Error:', err)
      setError('Failed to initiate mint. Please try again.')
      setGenState(GEN_STATE.GENERATED)
    }
  }

  // Handle network switch
  const handleSwitchNetwork = () => {
    switchChain?.({ chainId: SEPOLIA_CHAIN_ID })
  }

  // Extract minted token ID
  const mintedTokenId = extractTokenIdFromReceipt(receipt, NFT_CONTRACT_ADDRESS)

  // Combined error display
  const displayError = error || (mintError?.shortMessage) || (mintError?.message ? 'Transaction failed' : '')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NetworkBanner />
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">NFT Generator</h1>
            <p className="text-white/60">Create your unique procedurally generated NFT</p>
          </div>

          {/* Contract Warning */}
          {!hasValidContract && (
            <Card className="bg-orange-500/10 border-orange-500/30 mb-6">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                  <p className="text-orange-300">
                    NFT contract is not configured. Generation works but minting is disabled.
                  </p>
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
                    <p className="text-yellow-300">Please switch to Sepolia to mint</p>
                  </div>
                  <Button 
                    onClick={handleSwitchNetwork}
                    disabled={isSwitching}
                    variant="outline" 
                    className="border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/20"
                  >
                    {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Switch Network'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Panel - Preview */}
            <div className="space-y-4">
              <Card className="bg-white/5 border-white/10 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">
                      {genState === GEN_STATE.SUCCESS ? 'Minted NFT' : 
                       genState === GEN_STATE.GENERATED ? 'Generated NFT' : 
                       'Live Preview'}
                    </CardTitle>
                    {isLocked ? (
                      <Lock className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <Unlock className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Canvas Preview */}
                  <div className="aspect-square bg-black/20 rounded-lg overflow-hidden relative">
                    {genState === GEN_STATE.GENERATED || genState === GEN_STATE.MINTING || genState === GEN_STATE.SUCCESS ? (
                      // Show generated high-res image
                      <img 
                        src={generatedNFT?.imageDataUrl} 
                        alt="Generated NFT"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      // Show live preview canvas
                      <canvas
                        ref={canvasRef}
                        className="w-full h-full"
                        style={{ imageRendering: 'auto' }}
                      />
                    )}
                    
                    {/* Loading overlay */}
                    {isGenerating && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Seed display */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-white/40">
                      Seed: {generateSeed(traits)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                {genState === GEN_STATE.SUCCESS ? (
                  // Success state
                  <Card className="bg-green-500/10 border-green-500/30">
                    <CardContent className="py-6 text-center">
                      <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                      <h3 className="text-xl font-semibold text-green-300 mb-2">NFT Minted!</h3>
                      {mintedTokenId && (
                        <p className="text-green-200 mb-4">Token ID: #{mintedTokenId}</p>
                      )}
                      <div className="flex flex-wrap justify-center gap-3">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Transaction
                        </a>
                        {mintedTokenId && (
                          <Link
                            href={`/nft/${mintedTokenId}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors"
                          >
                            View NFT
                          </Link>
                        )}
                      </div>
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="mt-4 border-green-500/50 text-green-300 hover:bg-green-500/20"
                      >
                        Create Another
                      </Button>
                    </CardContent>
                  </Card>
                ) : genState === GEN_STATE.GENERATED ? (
                  // Generated state - ready to mint
                  <>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Edit Traits
                      </Button>
                    </div>
                    
                    {!isConnected ? (
                      <Card className="bg-slate-500/10 border-slate-500/30">
                        <CardContent className="py-4 text-center">
                          <Wallet className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                          <p className="text-slate-300 text-sm">Connect wallet to mint</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <Button
                        onClick={handleMint}
                        disabled={!canMint || isMinting || isConfirming}
                        className="w-full h-12 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        {isMinting ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Confirm in Wallet...
                          </>
                        ) : isConfirming ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Minting...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5 mr-2" />
                            Mint NFT
                          </>
                        )}
                      </Button>
                    )}

                    {/* Pending transaction */}
                    {hash && !isMinted && (
                      <div className="text-center">
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
                  </>
                ) : (
                  // Editing/Previewing state
                  <>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleRandomize}
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Randomize
                      </Button>
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Generate Final
                      </Button>
                    </div>
                  </>
                )}

                {/* Error display */}
                {displayError && (
                  <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="py-3">
                      <p className="text-red-300 text-sm text-center">{displayError}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Right Panel - Traits */}
            <div className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Trait Selection</CardTitle>
                  <CardDescription className="text-white/60">
                    {isLocked ? 'Traits are locked. Reset to edit.' : 'Select traits to customize your NFT'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(TRAITS).map(([key, trait]) => (
                    <div key={key}>
                      <Label className="text-white mb-2 block">{trait.label}</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {trait.options.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => updateTrait(key, option.value)}
                            disabled={isLocked}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              traits[key] === option.value
                                ? 'bg-purple-500 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900'
                                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                            } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Metadata Preview */}
              {(genState === GEN_STATE.GENERATED || genState === GEN_STATE.SUCCESS) && generatedNFT && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-white/60">Name:</span>
                        <span className="text-white ml-2">{generatedNFT.metadata.name}</span>
                      </div>
                      <div>
                        <span className="text-white/60">Attributes:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {generatedNFT.metadata.attributes.map((attr, i) => (
                            <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                              {attr.trait_type}: {attr.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
