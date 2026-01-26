# Create Hub & Stripe Feature NFT Upgrade

## Branch
`upgrade/create-hub-stripe-9`

## What Changed (Final Polish)

### Navigation Fix
- Fixed duplicate "My NFTs" entries in mobile hamburger menu
- Desktop + Mobile nav now both show exactly: `Home | Marketplace | Generate | Mint | My NFTs`

### UI Price Removal
- Removed all visible pricing ($9, $, USD) from UI components
- Price is ONLY shown inside Stripe Checkout (by Stripe, not by our code)
- Affected components:
  - NFT card "Boost visibility" button (was "Boost visibility – $9")
  - Create NFT dropdown "Feature NFT" item (removed price tag)
  - Feature NFT CTA card (removed pricing text)

### Create Hub (`/create-hub`)
- Header: "Welcome to the Create Hub"
- Subtitle: "Create, mint, and feature unique NFTs"
- Tabs: Image (active), Video, Character, Audio, Assets
- **AI Prompt Box** with:
  - Large prompt textarea ("Describe the NFT you want to generate...")
  - "Surprise me" button
  - Dropdowns: Image count, Model, Style, Size, Ratio
  - "Generate" button (shows toast "AI Service Not Configured")
- 8 Tool cards: Generate Image, Edit Image, Image Upscale, Remove Background, Erase Object, Text to Video, Motion Video, Image to Video
- Right sidebar: Recent Uploads + Feature NFT CTA
- Assets Library: 4 placeholder cards

### My NFTs (`/my-nfts`)
- Scan Blockchain dropdown: Manual/Auto Scan + Rescan Now
- Create NFT dropdown: Generate NFT, Mint NFT, Feature NFT (no price)
- NFT cards: "Boost visibility" button (no price), Featured badge
- Success banner after mint

---

## Stripe Configuration

### 1. Create Stripe Product
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Products
2. Create product: "Feature NFT"
3. Set price: $9.00 USD (one-time)
4. Copy the **Price ID** (`price_...`)

### 2. Configure Webhook
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select event: `checkout.session.completed`
4. Copy **Signing Secret** (`whsec_...`)

### 3. Environment Variables (Vercel)
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_FEATURE_NFT_PRICE_ID=price_...
```

---

## How Featured NFTs Persist

### Storage
Featured NFTs stored in `.data/featured-nfts.json`:
```json
{
  "nfts": [{
    "nftId": "123",
    "walletAddress": "0x...",
    "featuredUntil": "2025-02-01T00:00:00.000Z",
    "createdAt": "2025-01-25T00:00:00.000Z"
  }]
}
```

### Flow
1. User clicks "Boost visibility" on NFT card
2. `POST /api/stripe/checkout` creates Stripe session
3. User completes payment on Stripe Checkout (price shown there)
4. Stripe sends `checkout.session.completed` webhook
5. Webhook persists featured status for 7 days
6. NFT card shows "Featured" badge

### Limitation
File-based storage. For production scale, migrate to a database.

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/stripe/checkout` | POST | Create Stripe Checkout session |
| `/api/stripe/webhook` | POST | Handle checkout.session.completed |
| `/api/stripe/featured-status` | GET | Check if NFT is featured |

---

## Testing Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy signing secret to .env.local
# Run dev server
yarn dev

# Test with Stripe test card: 4242 4242 4242 4242
```

---

## Files Changed

### Modified
- `/pages/create-hub.tsx` - Added AI prompt box, controls
- `/pages/my-nfts.tsx` - Removed pricing from UI
- `/components/navbar/HamburgerMenu.tsx` - Fixed duplicate nav items

### Unchanged (Stripe APIs working)
- `/pages/api/stripe/checkout.ts`
- `/pages/api/stripe/webhook.ts`
- `/pages/api/stripe/featured-status.ts`
