# NovaTok Smart Contracts

## Setup

```bash
cd contracts
npm install
```

## Configure

1. Copy `.env.example` to `.env`
2. Add your deployer wallet private key (with Sepolia ETH)
3. Optionally add Etherscan API key for verification

## Deploy to Sepolia

```bash
# Compile first
npm run compile

# Deploy
npm run deploy:sepolia
```

The deploy script will output:
- Contract address
- Instructions to add to your main `.env` file

## Verify on Etherscan (Optional)

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## Contract Details

- **Name**: NovaTok NFT
- **Symbol**: NOVA
- **Standard**: ERC721URIStorage (OpenZeppelin v5)
- **Features**:
  - Public `mint(tokenURI)` - anyone can mint
  - Owner-only `mintTo(to, tokenURI)` - mint to specific address
  - `nextTokenId()` - get next token ID
  - `totalMinted()` - get total minted count

## Get Sepolia ETH

- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
