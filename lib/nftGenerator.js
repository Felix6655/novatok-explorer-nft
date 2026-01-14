/**
 * NovaTok NFT Generator Engine
 * Procedural NFT generation using canvas
 */

// Trait definitions with visual parameters
export const TRAITS = {
  coreType: {
    label: 'Core Type',
    options: [
      { value: 'quantum', label: 'Quantum', color: '#8B5CF6', shape: 'hexagon' },
      { value: 'nova', label: 'Nova', color: '#EC4899', shape: 'star' },
      { value: 'cosmic', label: 'Cosmic', color: '#3B82F6', shape: 'circle' },
      { value: 'void', label: 'Void', color: '#1F2937', shape: 'diamond' },
      { value: 'plasma', label: 'Plasma', color: '#F59E0B', shape: 'burst' },
    ],
  },
  edgeType: {
    label: 'Edge Type',
    options: [
      { value: 'sharp', label: 'Sharp', strokeWidth: 3, strokeStyle: 'solid' },
      { value: 'soft', label: 'Soft', strokeWidth: 8, strokeStyle: 'blur' },
      { value: 'glitch', label: 'Glitch', strokeWidth: 2, strokeStyle: 'dashed' },
      { value: 'none', label: 'None', strokeWidth: 0, strokeStyle: 'none' },
      { value: 'double', label: 'Double', strokeWidth: 4, strokeStyle: 'double' },
    ],
  },
  energyMode: {
    label: 'Energy Mode',
    options: [
      { value: 'calm', label: 'Calm', intensity: 0.2, animation: 'none' },
      { value: 'pulse', label: 'Pulse', intensity: 0.5, animation: 'pulse' },
      { value: 'surge', label: 'Surge', intensity: 0.8, animation: 'wave' },
      { value: 'chaos', label: 'Chaos', intensity: 1.0, animation: 'noise' },
    ],
  },
  accentGeometry: {
    label: 'Accent Geometry',
    options: [
      { value: 'triangles', label: 'Triangles', shape: 'triangle', count: 6 },
      { value: 'circles', label: 'Circles', shape: 'circle', count: 8 },
      { value: 'lines', label: 'Lines', shape: 'line', count: 12 },
      { value: 'dots', label: 'Dots', shape: 'dot', count: 20 },
      { value: 'none', label: 'None', shape: 'none', count: 0 },
    ],
  },
  lightBurst: {
    label: 'Light Burst',
    options: [
      { value: 'radial', label: 'Radial', type: 'radial', intensity: 0.6 },
      { value: 'directional', label: 'Directional', type: 'linear', intensity: 0.5 },
      { value: 'spotlight', label: 'Spotlight', type: 'spot', intensity: 0.8 },
      { value: 'ambient', label: 'Ambient', type: 'ambient', intensity: 0.3 },
      { value: 'none', label: 'None', type: 'none', intensity: 0 },
    ],
  },
  rarityTier: {
    label: 'Rarity Tier',
    options: [
      { value: 'common', label: 'Common', multiplier: 1.0, effects: [] },
      { value: 'uncommon', label: 'Uncommon', multiplier: 1.2, effects: ['glow'] },
      { value: 'rare', label: 'Rare', multiplier: 1.5, effects: ['glow', 'particles'] },
      { value: 'epic', label: 'Epic', multiplier: 2.0, effects: ['glow', 'particles', 'aura'] },
      { value: 'legendary', label: 'Legendary', multiplier: 3.0, effects: ['glow', 'particles', 'aura', 'shimmer'] },
    ],
  },
}

// Default trait selection
export const DEFAULT_TRAITS = {
  coreType: 'quantum',
  edgeType: 'sharp',
  energyMode: 'pulse',
  accentGeometry: 'triangles',
  lightBurst: 'radial',
  rarityTier: 'common',
}

/**
 * Seeded random number generator for deterministic output
 */
class SeededRandom {
  constructor(seed) {
    this.seed = seed
  }

  // Simple hash function for string seeds
  static hashString(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  // Get next random number (0-1)
  next() {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff
    return this.seed / 0x7fffffff
  }

  // Get random number in range
  range(min, max) {
    return min + this.next() * (max - min)
  }

  // Get random integer in range
  int(min, max) {
    return Math.floor(this.range(min, max + 1))
  }
}

/**
 * Generate a deterministic seed from traits
 */
export function generateSeed(traits) {
  const traitString = Object.entries(traits)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|')
  return SeededRandom.hashString(traitString)
}

/**
 * Get trait option details
 */
export function getTraitOption(traitKey, value) {
  const trait = TRAITS[traitKey]
  if (!trait) return null
  return trait.options.find(opt => opt.value === value) || trait.options[0]
}

/**
 * Main NFT renderer class
 */
export class NFTRenderer {
  constructor(canvas, size = 512) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.size = size
    canvas.width = size
    canvas.height = size
  }

  /**
   * Render the NFT based on traits
   */
  render(traits) {
    const seed = generateSeed(traits)
    const rng = new SeededRandom(seed)
    const ctx = this.ctx
    const size = this.size
    const center = size / 2

    // Get trait options
    const core = getTraitOption('coreType', traits.coreType)
    const edge = getTraitOption('edgeType', traits.edgeType)
    const energy = getTraitOption('energyMode', traits.energyMode)
    const accent = getTraitOption('accentGeometry', traits.accentGeometry)
    const light = getTraitOption('lightBurst', traits.lightBurst)
    const rarity = getTraitOption('rarityTier', traits.rarityTier)

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Draw background gradient
    this.drawBackground(ctx, size, core, rng)

    // Draw light burst
    this.drawLightBurst(ctx, size, center, light, core, rng)

    // Draw energy field
    this.drawEnergyField(ctx, size, center, energy, core, rng)

    // Draw accent geometry
    this.drawAccentGeometry(ctx, size, center, accent, core, rng)

    // Draw core shape
    this.drawCoreShape(ctx, size, center, core, edge, rarity, rng)

    // Apply rarity effects
    this.applyRarityEffects(ctx, size, center, rarity, core, rng)

    // Draw edge effects
    this.drawEdgeEffects(ctx, size, edge, rng)
  }

  drawBackground(ctx, size, core, rng) {
    // Create deep space gradient
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size * 0.8
    )
    
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#0f0f23')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    // Add subtle noise texture
    for (let i = 0; i < 200; i++) {
      const x = rng.range(0, size)
      const y = rng.range(0, size)
      const alpha = rng.range(0.02, 0.08)
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  drawLightBurst(ctx, size, center, light, core, rng) {
    if (light.type === 'none') return

    ctx.save()
    
    const color = core.color
    const intensity = light.intensity

    if (light.type === 'radial') {
      const gradient = ctx.createRadialGradient(
        center, center, 0,
        center, center, size * 0.6
      )
      gradient.addColorStop(0, this.hexToRgba(color, intensity * 0.3))
      gradient.addColorStop(0.5, this.hexToRgba(color, intensity * 0.1))
      gradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)

      // Add rays
      const rayCount = 12
      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2
        const rayLength = size * 0.4 * (0.8 + rng.next() * 0.4)
        
        ctx.beginPath()
        ctx.moveTo(center, center)
        ctx.lineTo(
          center + Math.cos(angle) * rayLength,
          center + Math.sin(angle) * rayLength
        )
        ctx.strokeStyle = this.hexToRgba(color, intensity * 0.2)
        ctx.lineWidth = 2 + rng.next() * 3
        ctx.stroke()
      }
    } else if (light.type === 'linear') {
      const angle = rng.range(0, Math.PI * 2)
      const x2 = center + Math.cos(angle) * size
      const y2 = center + Math.sin(angle) * size
      
      const gradient = ctx.createLinearGradient(center, center, x2, y2)
      gradient.addColorStop(0, this.hexToRgba(color, intensity * 0.4))
      gradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
    } else if (light.type === 'spot') {
      const spotX = center + rng.range(-size * 0.2, size * 0.2)
      const spotY = center + rng.range(-size * 0.2, size * 0.2)
      
      const gradient = ctx.createRadialGradient(
        spotX, spotY, 0,
        spotX, spotY, size * 0.3
      )
      gradient.addColorStop(0, this.hexToRgba('#ffffff', intensity * 0.5))
      gradient.addColorStop(0.3, this.hexToRgba(color, intensity * 0.3))
      gradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
    } else if (light.type === 'ambient') {
      ctx.fillStyle = this.hexToRgba(color, intensity * 0.1)
      ctx.fillRect(0, 0, size, size)
    }

    ctx.restore()
  }

  drawEnergyField(ctx, size, center, energy, core, rng) {
    if (energy.intensity === 0) return

    ctx.save()
    
    const color = core.color
    const intensity = energy.intensity
    const rings = Math.floor(3 + intensity * 5)

    for (let i = 0; i < rings; i++) {
      const radius = size * 0.15 + (i / rings) * size * 0.25
      const alpha = (1 - i / rings) * intensity * 0.3
      
      ctx.beginPath()
      ctx.arc(center, center, radius, 0, Math.PI * 2)
      ctx.strokeStyle = this.hexToRgba(color, alpha)
      ctx.lineWidth = 1 + rng.next() * 2
      
      if (energy.animation === 'noise') {
        ctx.setLineDash([rng.range(2, 10), rng.range(2, 10)])
      } else if (energy.animation === 'wave') {
        ctx.setLineDash([10, 5])
      }
      
      ctx.stroke()
      ctx.setLineDash([])
    }

    ctx.restore()
  }

  drawAccentGeometry(ctx, size, center, accent, core, rng) {
    if (accent.shape === 'none' || accent.count === 0) return

    ctx.save()
    
    const color = core.color
    const count = accent.count

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rng.range(-0.1, 0.1)
      const distance = size * 0.25 + rng.range(0, size * 0.15)
      const x = center + Math.cos(angle) * distance
      const y = center + Math.sin(angle) * distance
      const shapeSize = size * 0.02 + rng.range(0, size * 0.02)

      ctx.fillStyle = this.hexToRgba(color, 0.3 + rng.next() * 0.3)
      ctx.strokeStyle = this.hexToRgba(color, 0.5)
      ctx.lineWidth = 1

      if (accent.shape === 'triangle') {
        this.drawTriangle(ctx, x, y, shapeSize, angle)
      } else if (accent.shape === 'circle') {
        ctx.beginPath()
        ctx.arc(x, y, shapeSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      } else if (accent.shape === 'line') {
        const lineLength = shapeSize * 3
        ctx.beginPath()
        ctx.moveTo(x - Math.cos(angle) * lineLength, y - Math.sin(angle) * lineLength)
        ctx.lineTo(x + Math.cos(angle) * lineLength, y + Math.sin(angle) * lineLength)
        ctx.strokeStyle = this.hexToRgba(color, 0.4)
        ctx.lineWidth = 2
        ctx.stroke()
      } else if (accent.shape === 'dot') {
        ctx.beginPath()
        ctx.arc(x, y, shapeSize * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.restore()
  }

  drawTriangle(ctx, x, y, size, rotation = 0) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    
    ctx.beginPath()
    ctx.moveTo(0, -size)
    ctx.lineTo(size * 0.866, size * 0.5)
    ctx.lineTo(-size * 0.866, size * 0.5)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    ctx.restore()
  }

  drawCoreShape(ctx, size, center, core, edge, rarity, rng) {
    ctx.save()
    
    const coreSize = size * 0.2 * rarity.multiplier * 0.7
    const color = core.color

    // Glow effect
    if (rarity.effects.includes('glow')) {
      const glowGradient = ctx.createRadialGradient(
        center, center, coreSize * 0.5,
        center, center, coreSize * 2
      )
      glowGradient.addColorStop(0, this.hexToRgba(color, 0.4))
      glowGradient.addColorStop(0.5, this.hexToRgba(color, 0.1))
      glowGradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = glowGradient
      ctx.fillRect(0, 0, size, size)
    }

    // Core gradient
    const coreGradient = ctx.createRadialGradient(
      center - coreSize * 0.2, center - coreSize * 0.2, 0,
      center, center, coreSize
    )
    coreGradient.addColorStop(0, this.lightenColor(color, 40))
    coreGradient.addColorStop(0.5, color)
    coreGradient.addColorStop(1, this.darkenColor(color, 30))

    ctx.fillStyle = coreGradient

    // Edge styling
    if (edge.strokeWidth > 0) {
      ctx.strokeStyle = this.lightenColor(color, 20)
      ctx.lineWidth = edge.strokeWidth
      
      if (edge.strokeStyle === 'dashed') {
        ctx.setLineDash([8, 4])
      } else if (edge.strokeStyle === 'double') {
        // Will draw twice
      }
    }

    // Draw shape based on core type
    ctx.beginPath()
    
    if (core.shape === 'hexagon') {
      this.drawHexagon(ctx, center, center, coreSize)
    } else if (core.shape === 'star') {
      this.drawStar(ctx, center, center, coreSize, 6)
    } else if (core.shape === 'circle') {
      ctx.arc(center, center, coreSize, 0, Math.PI * 2)
    } else if (core.shape === 'diamond') {
      this.drawDiamond(ctx, center, center, coreSize)
    } else if (core.shape === 'burst') {
      this.drawBurst(ctx, center, center, coreSize, rng)
    }

    ctx.closePath()
    ctx.fill()
    
    if (edge.strokeWidth > 0) {
      ctx.stroke()
      
      if (edge.strokeStyle === 'double') {
        ctx.lineWidth = edge.strokeWidth * 0.5
        ctx.stroke()
      }
    }

    ctx.setLineDash([])
    ctx.restore()
  }

  drawHexagon(ctx, x, y, size) {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
      const px = x + Math.cos(angle) * size
      const py = y + Math.sin(angle) * size
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
  }

  drawStar(ctx, x, y, size, points) {
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 === 0 ? size : size * 0.5
      const px = x + Math.cos(angle) * r
      const py = y + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
  }

  drawDiamond(ctx, x, y, size) {
    ctx.moveTo(x, y - size)
    ctx.lineTo(x + size * 0.7, y)
    ctx.lineTo(x, y + size)
    ctx.lineTo(x - size * 0.7, y)
  }

  drawBurst(ctx, x, y, size, rng) {
    const spikes = 12
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i / (spikes * 2)) * Math.PI * 2
      const r = i % 2 === 0 ? size * (0.8 + rng.next() * 0.4) : size * 0.4
      const px = x + Math.cos(angle) * r
      const py = y + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
  }

  applyRarityEffects(ctx, size, center, rarity, core, rng) {
    ctx.save()

    // Particles
    if (rarity.effects.includes('particles')) {
      const particleCount = 30 + rarity.multiplier * 20
      for (let i = 0; i < particleCount; i++) {
        const angle = rng.range(0, Math.PI * 2)
        const distance = rng.range(size * 0.15, size * 0.4)
        const x = center + Math.cos(angle) * distance
        const y = center + Math.sin(angle) * distance
        const particleSize = rng.range(1, 3)
        
        ctx.beginPath()
        ctx.arc(x, y, particleSize, 0, Math.PI * 2)
        ctx.fillStyle = this.hexToRgba(core.color, rng.range(0.3, 0.8))
        ctx.fill()
      }
    }

    // Aura
    if (rarity.effects.includes('aura')) {
      const auraSize = size * 0.35
      for (let i = 0; i < 3; i++) {
        const gradient = ctx.createRadialGradient(
          center, center, auraSize * (0.5 + i * 0.2),
          center, center, auraSize * (0.8 + i * 0.2)
        )
        gradient.addColorStop(0, 'transparent')
        gradient.addColorStop(0.5, this.hexToRgba(core.color, 0.1))
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, size, size)
      }
    }

    // Shimmer
    if (rarity.effects.includes('shimmer')) {
      for (let i = 0; i < 50; i++) {
        const x = rng.range(0, size)
        const y = rng.range(0, size)
        const shimmerSize = rng.range(1, 4)
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, shimmerSize)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.fillRect(x - shimmerSize, y - shimmerSize, shimmerSize * 2, shimmerSize * 2)
      }
    }

    ctx.restore()
  }

  drawEdgeEffects(ctx, size, edge, rng) {
    if (edge.strokeStyle === 'blur') {
      // Add subtle vignette
      const gradient = ctx.createRadialGradient(
        size / 2, size / 2, size * 0.3,
        size / 2, size / 2, size * 0.7
      )
      gradient.addColorStop(0, 'transparent')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
    }
  }

  // Color utility functions
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  lightenColor(hex, percent) {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + percent)
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + percent)
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + percent)
    return `rgb(${r}, ${g}, ${b})`
  }

  darkenColor(hex, percent) {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - percent)
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - percent)
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - percent)
    return `rgb(${r}, ${g}, ${b})`
  }

  /**
   * Export canvas as blob
   */
  async toBlob(quality = 0.95) {
    return new Promise((resolve) => {
      this.canvas.toBlob(resolve, 'image/png', quality)
    })
  }

  /**
   * Export canvas as base64 data URL
   */
  toDataURL() {
    return this.canvas.toDataURL('image/png')
  }
}

/**
 * Generate NFT metadata from traits
 */
export function generateMetadata(traits) {
  const attributes = Object.entries(traits).map(([key, value]) => {
    const trait = TRAITS[key]
    const option = getTraitOption(key, value)
    return {
      trait_type: trait?.label || key,
      value: option?.label || value,
    }
  })

  return {
    name: `NovaTok Core #${generateSeed(traits) % 10000}`,
    description: 'Procedurally generated NovaTok NFT. Each piece is uniquely determined by its trait combination.',
    attributes,
  }
}

/**
 * Generate a complete NFT (image + metadata)
 */
export async function generateNFT(traits, size = 1024) {
  // Create offscreen canvas
  const canvas = document.createElement('canvas')
  const renderer = new NFTRenderer(canvas, size)
  
  // Render
  renderer.render(traits)
  
  // Get outputs
  const imageDataUrl = renderer.toDataURL()
  const metadata = generateMetadata(traits)
  
  // Add image to metadata
  metadata.image = imageDataUrl
  
  return {
    imageDataUrl,
    metadata,
    traits,
    seed: generateSeed(traits),
  }
}
