# NovatoK NFT Marketplace - Product Requirements Document

## Original Problem Statement
Creator-first NFT marketplace that helps new users easily create NFTs and optionally monetize via a $9 Stripe "Feature NFT" boost.

## Tech Stack
- **Frontend**: Next.js (Pages Router), React 18, TypeScript
- **Styling**: Stitches, Radix UI, Cosmic/Glassmorphism theme
- **Web3**: wagmi 2.12, viem 2.17, RainbowKit 2.1.7
- **Payments**: Stripe Checkout ($9 Feature NFT)
- **Chain**: Sepolia Testnet (configurable via env vars)

## Core Requirements

### Environment Variables
```
# Blockchain
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.drpc.org
NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed_contract>
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<optional>

# Stripe ($9 Feature NFT)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_FEATURE_NFT_PRICE_ID=price_...
```

### Navigation (Exactly 5 Items)
```
Home | Marketplace | Generate | Mint | My NFTs
```

---

## Implemented Features

### 1. Create Hub (`/create-hub`)
- **Status**: ✅ IMPLEMENTED
- Welcome header: "Welcome to the Create Hub"
- Tabs: Image (active), Video, Character, Audio, Assets
- Tool cards grid (8 tools): Generate Image, Edit Image, Upscale, Remove Background, Erase Object, Text to Video, Motion Video, Image to Video
- Recent Uploads sidebar
- Assets Library section (4 placeholder cards)
- Feature NFT $9 CTA card

### 2. My NFTs (`/my-nfts`)
- **Status**: ✅ IMPLEMENTED
- **Scan Blockchain dropdown**:
  - Manual Scan / Auto Scan toggle
  - Rescan Now button
- **Create NFT dropdown**:
  - Generate NFT → /create-hub
  - Mint NFT → /mint
  - Feature NFT – $9 → Opens Stripe checkout
- NFT Grid with:
  - Artwork, name, token ID
  - "Boost visibility – $9" button (if not featured)
  - "Featured on marketplace (7 days)" badge (if featured)
- Success banner after mint

### 3. Stripe Feature NFT ($9)
- **Status**: ✅ IMPLEMENTED
- `POST /api/stripe/checkout` - Creates Stripe session
- `POST /api/stripe/webhook` - Handles checkout.session.completed
- `GET /api/stripe/featured-status` - Returns featured status
- Persistent storage in `.data/featured-nfts.json`
- Featured duration: 7 days

### 4. Mint Page (`/mint`)
- **Status**: ✅ IMPLEMENTED (unchanged)
- Image upload with readiness checks
- Marketplace preview modes
- Attributes editor
- Post-mint success with CTAs

### 5. Email Capture
- **Status**: ✅ IMPLEMENTED
- `POST /api/creator/email`
- Capture points in Creator Hub and post-mint

---

## Branch: `upgrade/create-hub-stripe-9`

### Files Added
- `/pages/create-hub.tsx`
- `/UPGRADE-README.md`

### Files Modified
- `/pages/my-nfts.tsx` - Complete rewrite
- `/pages/api/stripe/checkout.ts` - Persistent storage
- `/pages/api/stripe/webhook.ts` - Persistent storage
- `/pages/api/stripe/featured-status.ts` - Reads storage
- `/components/navbar/index.tsx` - Updated nav
- `/components/navbar/HamburgerMenu.tsx` - Updated mobile nav

---

## What This Upgrade Does NOT Include
- Persistent database (uses JSON file)
- Real AI generation services
- Listing/auction features
- Admin dashboard
- Multiple promotion tiers (only $9 Feature NFT)

---

## Deployment Checklist
- [x] `yarn build` passes
- [x] Create Hub page functional
- [x] My NFTs dropdowns work
- [x] Stripe checkout creates session
- [x] Webhook handles completion
- [x] Featured status persists
- [ ] Vercel Preview deployment tested
- [ ] Stripe webhook URL configured for preview domain
