# NovaTok NFT Marketplace

A minimal NFT marketplace MVP on Ethereum Sepolia testnet.

## Features

- **Mint NFTs** - Create NFTs with custom name, description, and image URL
- **View Collection** - Browse NFTs owned by your wallet
- **NFT Details** - View full metadata for any token
- **Wallet Connection** - MetaMask + WalletConnect support
- **Network Detection** - Automatic Sepolia network switching

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Wallet**: wagmi v2 + viem
- **Smart Contract**: OpenZeppelin ERC721URIStorage (Solidity 0.8.20)
- **Network**: Ethereum Sepolia Testnet

## Setup

### 1. Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Required for WalletConnect (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Set after deploying contract
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=your_contract_address

# Optional: Custom RPC (default: public Sepolia RPC)
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.org
```

### 2. Deploy Smart Contract

```bash
cd contracts
npm install

# Create contracts/.env with your deployer key
echo "DEPLOYER_PRIVATE_KEY=your_private_key" > .env
echo "SEPOLIA_RPC_URL=https://rpc.sepolia.org" >> .env

# Deploy
npm run deploy:sepolia
```

The deploy script outputs the contract address. Add it to your root `.env`:
```env
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
```

### 3. Run Locally

```bash
# From root directory
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_RPC_URL` (optional)
4. Deploy

## Getting Sepolia ETH

You need Sepolia ETH to deploy contracts and mint NFTs:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucets.chain.link/sepolia

## Smart Contract

**NovaTokNFT** (`contracts/contracts/NovaTokNFT.sol`)

- Standard: ERC721URIStorage
- Name: "NovaTok NFT"
- Symbol: "NOVA"
- Public mint function (anyone can mint)
- Metadata stored as data: URIs on-chain

### Contract Functions

| Function | Description |
|----------|-------------|
| `mint(tokenURI)` | Mint NFT to caller |
| `tokenURI(tokenId)` | Get metadata URI |
| `ownerOf(tokenId)` | Get token owner |
| `balanceOf(owner)` | Get balance |
| `totalMinted()` | Total tokens minted |

## Project Structure

```
/
├── app/
│   ├── page.js              # Homepage
│   ├── mint/page.js         # Mint NFT form
│   ├── my-nfts/page.js      # User's NFT collection
│   ├── nft/[tokenId]/page.js # NFT detail page
│   ├── providers.js         # Wagmi + React Query setup
│   └── layout.js            # Root layout
├── components/
│   ├── Header.js            # Navigation header
│   ├── ConnectWalletButton.js
│   ├── NetworkBanner.js     # Wrong network warning
│   ├── NftCard.js           # NFT display card
│   ├── LoadingState.js
│   └── ErrorBanner.js
├── lib/
│   ├── nftClient.js         # Contract read/write helpers
│   └── contractConfig.js    # ABI + addresses
├── contracts/               # Hardhat project
│   ├── contracts/NovaTokNFT.sol
│   ├── scripts/deploy.js
│   └── hardhat.config.js
└── .env.example
```

## How It Works

### Metadata Storage

NFT metadata is stored as base64-encoded JSON data URIs directly on-chain:
```
data:application/json;base64,eyJuYW1lIjoiTXkgTkZUIiwiZGVzY3...
```

This avoids IPFS complexity while keeping metadata fully on-chain.

### Finding Owned NFTs

Instead of using gas-heavy ERC721Enumerable, the app indexes Transfer events to determine token ownership. This is efficient and works with any ERC721.

## Quality Checklist

- ✅ Sepolia-only (chainId 11155111)
- ✅ Network switching banner
- ✅ MetaMask + WalletConnect working
- ✅ Proper loading/error/success states
- ✅ Transaction links to Etherscan
- ✅ No fake data or mocks
- ✅ Vercel-compatible build

## License

MIT
