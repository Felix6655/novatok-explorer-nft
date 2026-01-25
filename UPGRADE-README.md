# Create Hub & Stripe $9 Feature NFT Upgrade

## Branch
`upgrade/create-hub-stripe-9`

## Overview
This upgrade adds a creator-focused experience with:
- Create Hub page for AI-powered NFT creation tools
- Upgraded My NFTs page with scan/create dropdowns
- Real Stripe $9 "Feature NFT" payment with persistent storage

## New Routes
- `/create-hub` - AI creation tools hub with tabs (Image, Video, Character, Audio, Assets)
- Updated `/my-nfts` - Scan dropdown, Create dropdown, Feature NFT integration

## Navigation
Desktop & Mobile: `Home | Marketplace | Generate | Mint | My NFTs`

---

## Stripe Configuration

### 1. Create Stripe Product
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Products
2. Create a new product: "Feature NFT"
3. Set price: $9.00 USD (one-time)
4. Copy the **Price ID** (starts with `price_`)

### 2. Configure Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select event: `checkout.session.completed`
4. Copy the **Signing Secret** (starts with `whsec_`)

### 3. Environment Variables (Vercel)
Add these to your Vercel project:

```
STRIPE_SECRET_KEY=sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_FEATURE_NFT_PRICE_ID=price_...
```

---

## How Featured NFTs Persist

### Storage
Featured NFTs are stored in `.data/featured-nfts.json`:

```json
{
  "nfts": [
    {
      "nftId": "123",
      "walletAddress": "0x...",
      "featuredUntil": "2025-02-01T00:00:00.000Z",
      "createdAt": "2025-01-25T00:00:00.000Z"
    }
  ]
}
```

### Webhook Flow
1. User clicks "Boost visibility – $9" on NFT card
2. Frontend calls `POST /api/stripe/checkout` with `nftId` and `walletAddress`
3. User completes payment on Stripe Checkout
4. Stripe sends `checkout.session.completed` webhook
5. Webhook handler calls `addFeaturedNFT()` which persists to JSON file
6. Featured status valid for 7 days

### Checking Featured Status
```
GET /api/stripe/featured-status?nftId=123
```
Returns:
```json
{
  "ok": true,
  "is_featured": true,
  "featured_until": "2025-02-01T00:00:00.000Z"
}
```

---

## Testing Locally

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret and add to `.env.local`
5. Run: `yarn dev`
6. Test with Stripe test card: `4242 4242 4242 4242`

---

## Production Deployment

1. Push branch to GitHub
2. Vercel will create Preview Deployment automatically
3. Update Stripe webhook URL to Preview domain
4. Test end-to-end payment flow
5. Merge to main when verified

---

## Files Changed

### New Files
- `/pages/create-hub.tsx` - Create Hub page
- `/UPGRADE-README.md` - This file

### Modified Files
- `/pages/my-nfts.tsx` - Complete rewrite with dropdowns
- `/pages/api/stripe/checkout.ts` - Added persistent storage
- `/pages/api/stripe/webhook.ts` - Uses persistent storage
- `/pages/api/stripe/featured-status.ts` - Reads from persistent storage
- `/components/navbar/index.tsx` - Updated nav links
- `/components/navbar/HamburgerMenu.tsx` - Updated mobile nav

---

## Known Limitations

1. **File-based storage**: The JSON file storage works but may have race conditions under high load. For production scale, migrate to a proper database (Supabase, MongoDB, etc.)

2. **Vercel serverless**: File storage persists within the same deployment but may be reset on new deploys. For true persistence, use an external database.

3. **AI tools**: Most AI tools in Create Hub show "AI Service Not Configured" as placeholders. Only "Generate Image" links to the Mint page.
