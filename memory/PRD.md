# NovatoK NFT Marketplace - Product Requirements Document

## Original Problem Statement
The user had a broken Next.js + TypeScript NFT marketplace repository (`novatok-nft-marketplace`) that needed fixes and new features:
1. Make `yarn build` pass with zero TypeScript errors
2. Fix Radix Dialog usage to use compound components
3. Keep wagmi/RainbowKit wallet logic intact
4. Implement "My NFTs" page showing real on-chain NFTs from Sepolia
5. Enable basic minting flow with image upload (no external IPFS service)

## Tech Stack
- **Frontend**: Next.js (Pages Router), React 18, TypeScript
- **Styling**: Stitches, Radix UI
- **Web3**: wagmi 2.12, viem 2.17, RainbowKit 2.1.7
- **Chain**: Sepolia Testnet (configurable via env vars)

## Core Requirements

### Environment Variables
The app is driven by these env vars:
- `NEXT_PUBLIC_CHAIN_ID` - Expected chain (default: 11155111 for Sepolia)
- `NEXT_PUBLIC_RPC_URL` - RPC endpoint for blockchain calls
- `NEXT_PUBLIC_CONTRACT_ADDRESS` - Deployed ERC721 contract
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - Optional, works without (MetaMask fallback)

### MVP Features Implemented

#### 1. My NFTs Page (`/my-nfts`)
- **Status**: ✅ IMPLEMENTED
- Displays connected wallet's NFTs from the configured contract
- "Scan Blockchain" button triggers on-chain scan using viem/wagmi
- Uses `balanceOf`, `tokenOfOwnerByIndex`, `tokenURI` contract calls
- Handles IPFS and base64 data URLs for metadata
- Shows config errors if env vars missing
- Network badge shows current chain status

#### 2. Mint Page (`/mint`)
- **Status**: ✅ IMPLEMENTED (Enhanced)
- Image file picker (PNG, JPG, GIF, WebP up to 10MB) with click-to-upload
- Uploads via `POST /api/ipfs/upload` using multipart/form-data
- API returns base64 data URL (works on Vercel Node runtime)
- **NEW: Mint Readiness Panel** - Auto-analyzes file type, size, resolution, aspect ratio, metadata
- **NEW: Marketplace Preview Simulator** - Toggle between Marketplace/Mobile/Dark views
- **NEW: NovaTok Suggestions** - Collapsible panel with context-aware tips
- **NEW: Attributes Editor** - Add up to 5 trait/value pairs
- Wrong network detection with "Switch Network" button
- Upload progress indicator and clear error messages
- Transaction hash displayed on success
- All warnings are non-blocking (mint always possible)

### Navigation
- Desktop: "Creator Hub", "My NFTs", and "Mint" links in navbar
- Mobile: Links added to hamburger menu

## Architecture

```
/app/
├── pages/
│   ├── my-nfts.tsx       # ✅ NEW - On-chain NFT scanner
│   ├── mint.tsx          # ✅ UPDATED - Image upload + minting
│   ├── portfolio/        # Original Reservoir-based portfolio
│   └── _app.tsx          # App entry with wagmi/RainbowKit
├── components/
│   ├── navbar/
│   │   ├── index.tsx     # ✅ UPDATED - Added nav links
│   │   └── HamburgerMenu.tsx # ✅ UPDATED - Mobile nav
│   └── common/
│       ├── NetworkBadge.tsx
│       └── WrongNetworkBanner.tsx
├── lib/
│   └── config.js         # Chain/contract configuration
└── .env.local            # Local environment config
```

## What's Been Implemented (Dec 2025)

1. **Build fixes** - All TypeScript errors resolved, yarn build passes
2. **My NFTs page** - Complete with blockchain scanning
3. **Mint page** - Complete with image upload and base64 tokenURI generation
4. **Navigation** - Links added to desktop and mobile nav

## Prioritized Backlog

### P0 (Critical) - Done
- [x] My NFTs page with blockchain scan
- [x] Mint page with image upload

### P1 (High) - Next
- [ ] Set `NEXT_PUBLIC_CONTRACT_ADDRESS` in production env
- [ ] Set `NEXT_PUBLIC_RPC_URL` in production env
- [ ] Deploy to Vercel via GitHub push

### P2 (Medium)
- [ ] ERC-2981 royalties display on NFT cards
- [ ] Transaction confirmation polling after mint
- [ ] Error retry logic for RPC failures

### P3 (Low/Future)
- [ ] IPFS upload option via Pinata
- [ ] Batch minting support
- [ ] NFT transfer functionality

## Testing Notes
- Build passes: `yarn build` ✅
- Manual testing needed with MetaMask on Sepolia
- Contract must support `mint(string tokenURI)` function
- Contract should implement ERC721Enumerable for `tokenOfOwnerByIndex`
