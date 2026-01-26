import { useRouter } from "next/router";
import Link from "next/link";

const SUPPORTED_CHAINS = [
  "ethereum",
  "polygon",
  "arbitrum",
  "optimism",
  "base",
];

export default function ChainMarketplace() {
  const router = useRouter();
  const chainRaw = router.query.chain;
  const chain =
    typeof chainRaw === "string" ? chainRaw.toLowerCase() : undefined;

  if (!chain) return null;

  const isSupported = SUPPORTED_CHAINS.includes(chain);

  if (!isSupported) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>
          Unsupported chain: {chain}
        </h1>
        <p style={{ marginTop: 8 }}>Choose a supported chain to continue.</p>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {SUPPORTED_CHAINS.map((c) => (
            <Link key={c} href={`/chain/${c}`}>
              Go to {c}
            </Link>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>{chain} Marketplace</h1>
      <p style={{ marginTop: 8 }}>
        Route is working. Next we’ll plug in the real collections for this chain.
      </p>
    </main>
  );
}
