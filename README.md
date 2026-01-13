# NovaTok NFT Marketplace

A Next.js NFT Marketplace with wallet connection powered by wagmi + WalletConnect.

## Phase 1: Wallet Connection

This phase implements:
- Wallet connection using wagmi v2
- WalletConnect integration
- Support for MetaMask, Coinbase Wallet, and WalletConnect-compatible wallets
- Multi-chain support (Ethereum Mainnet, Sepolia, Polygon)

## Setup

### 1. Get a WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in
3. Create a new project
4. Copy the **Project ID**

### 2. Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd novatok-explorer-nft

# Copy environment variables
cp .env.example .env

# Edit .env and add your WalletConnect Project ID
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id

# Install dependencies
yarn install

# Run development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 3. Vercel Deployment

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add the environment variable in Vercel:
   - Go to **Project Settings** → **Environment Variables**
   - Add: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` = `your_project_id`
4. Redeploy the project

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | WalletConnect Cloud Project ID |
| `MONGO_URL` | For DB features | MongoDB connection string |
| `DB_NAME` | For DB features | MongoDB database name |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Wallet**: wagmi v2 + viem + WalletConnect
- **State**: TanStack React Query

## Supported Wallets

- MetaMask (browser extension)
- Coinbase Wallet
- WalletConnect (mobile wallets)
- Any injected wallet

## Supported Networks

- Ethereum Mainnet
- Sepolia Testnet
- Polygon

## Project Structure

```
app/
├── app/
│   ├── layout.js      # Root layout with providers
│   ├── page.js        # Home page with wallet UI
│   ├── providers.js   # Wagmi + React Query setup
│   └── globals.css    # Global styles
├── components/
│   ├── ui/            # shadcn/ui components
│   └── ConnectWalletButton.js
├── .env.example       # Environment template
└── README.md
```

## Next Phases (Planned)

- Phase 2: NFT Display & Gallery
- Phase 3: Marketplace Features
- Phase 4: Minting Capabilities

---

Built with ❤️ using Next.js and wagmi
