import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center py-16 px-8">
        <h1 className="text-5xl font-bold mb-6 text-center text-black dark:text-zinc-50">
          Welcome to Novatok NFT Explorer
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-12 text-center max-w-2xl">
          Create, explore, and collect unique digital assets on the blockchain
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link
            href="/marketplace"
            className="flex h-12 w-full items-center justify-center rounded-full bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors"
          >
            Explore Marketplace
          </Link>
          <Link
            href="/generate"
            className="flex h-12 w-full items-center justify-center rounded-full border-2 border-violet-600 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950 font-medium transition-colors"
          >
            Create Art
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="text-center">
            <div className="text-3xl mb-2">🎨</div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              AI-Powered Creation
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Generate unique art with advanced AI models
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🏪</div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              NFT Marketplace
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Buy, sell, and trade digital collectibles
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">⛓️</div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Blockchain Verified
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Secure ownership on Ethereum blockchain
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
