# NovaTok NFT Marketplace

A production-ready NFT marketplace and explorer built on Ethereum Sepolia testnet.

![NovaTok](https://img.shields.io/badge/NovaTok-NFT%20Marketplace-purple)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-blue)

## Current Status

### What Works Today

| Feature | Status | Notes |
|---------|--------|-------|
| **Marketplace UI** | ✅ Live | Browse collections and items |
| **Collection Pages** | ✅ Live | View collection details and items |
| **Item Detail Pages** | ✅ Live | View NFT metadata and attributes |
| **Wallet Connection** | ✅ Live | MetaMask + WalletConnect |
| **Network Detection** | ✅ Live | Sepolia network switching |
| **Responsive Design** | ✅ Live | Mobile and desktop support |
| **Loading States** | ✅ Live | Skeleton loaders throughout |
| **Empty States** | ✅ Live | Friendly empty/error states |

### What is Mocked

- **Collections** - 4 sample collections with realistic data
- **NFT Items** - 8 sample items with metadata and attributes
- **Statistics** - Volume, user count, item count
- **Prices** - Floor prices and item prices

### What Requires On-Chain Deployment

| Feature | Gated By |
|---------|----------|
| Mint NFT | `ONCHAIN_ENABLED=true` + Contract deployed |
| Buy NFT | `ONCHAIN_ENABLED=true` + Contract deployed |
| List NFT for Sale | `ONCHAIN_ENABLED=true` + Contract deployed |
| View Real Owned NFTs | Contract deployed |
| Transfer Events Indexing | Contract deployed |

## Feature Flag: ONCHAIN_ENABLED

The app operates in two modes:

### Preview Mode (`ONCHAIN_ENABLED=false`)
- Uses mock data for collections and items
- Buy/List buttons show "Coming Soon"
- "Preview Mode" banner displayed
- No blockchain transactions possible
- **Safe for deployment without secrets**

### Live Mode (`ONCHAIN_ENABLED=true`)
- Requires deployed smart contract
- Requires `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS`
- Enables real minting and trading
- Reads from actual blockchain state

## Quick Start

### Run Locally

```bash
# Clone the repo
git clone <repo-url>
cd novatok-explorer-nft

# Install dependencies
yarn install

# Run development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env` file:

```env
# Feature Flags
NEXT_PUBLIC_ONCHAIN_ENABLED=false

# Network (Sepolia)
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.org

# Contract (optional - only if deploying on-chain)
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=

# WalletConnect (optional - for WalletConnect support)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables (see above)
4. Deploy

**No secrets required for preview mode deployment!**

## Project Structure

```
/app
├── app/
│   ├── page.js                    # Homepage
│   ├── mint/page.js               # Mint NFT page
│   ├── my-nfts/page.js            # User's NFT collection
│   ├── nft/[tokenId]/page.js      # NFT detail (on-chain)
│   └── marketplace/
│       ├── page.js                # Marketplace home
│       ├── collections/
│       │   ├── page.js            # All collections
│       │   └── [slug]/page.js     # Collection detail
│       └── items/
│           ├── page.js            # All items
│           └── [id]/page.js       # Item detail
├── components/
│   ├── marketplace/
│   │   ├── CollectionCard.js      # Collection card + skeleton
│   │   ├── ItemCard.js            # Item card + skeleton
│   │   ├── EmptyState.js          # Empty state component
│   │   └── ComingSoonBanner.js    # Feature gating UI
│   ├── Header.js                  # Navigation header
│   ├── NetworkBanner.js           # Wrong network warning
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── config.js                  # Feature flags
│   ├── marketplace/
│   │   └── mock/
│   │       ├── collections.js     # Mock collection data
│   │       ├── items.js           # Mock item data
│   │       └── index.js           # Exports
│   ├── nftClient.js               # Contract interactions
│   └── contractConfig.js          # ABI + addresses
└── contracts/                     # Hardhat project
    ├── contracts/NovaTokNFT.sol
    └── scripts/deploy.js
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Wallet**: wagmi v2 + viem
- **Smart Contract**: OpenZeppelin ERC721URIStorage
- **Network**: Ethereum Sepolia Testnet

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, stats, and CTAs |
| `/marketplace` | Marketplace home with featured items and collections |
| `/marketplace/collections` | Browse all collections |
| `/marketplace/collections/[slug]` | Collection detail with items grid |
| `/marketplace/items` | Browse all items with filters |
| `/marketplace/items/[id]` | Item detail with buy/list actions |
| `/mint` | Mint new NFT (requires on-chain) |
| `/my-nfts` | User's owned NFTs (requires on-chain) |

## Enabling On-Chain Features

1. **Deploy the smart contract:**
   ```bash
   cd contracts
   npm install
   echo "DEPLOYER_PRIVATE_KEY=<your-key>" > .env
   npm run deploy:sepolia
   ```

2. **Update environment:**
   ```env
   NEXT_PUBLIC_ONCHAIN_ENABLED=true
   NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
   ```

3. **Get Sepolia ETH:**
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Run `yarn build` to verify
5. Submit pull request

## License

MIT
