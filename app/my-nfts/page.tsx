"use client";

import { useState } from "react";

export default function MyNFTsPage() {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Mock NFT data
  const myNFTs = [
    { id: 1, name: "NFT #1", collection: "My Collection", image: null },
    { id: 2, name: "NFT #2", collection: "My Collection", image: null },
    { id: 3, name: "NFT #3", collection: "My Collection", image: null },
  ];

  const handleDropdownAction = (action: string, nftId: number) => {
    console.log(`Action: ${action} on NFT ${nftId}`);
    setOpenDropdown(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-black dark:text-zinc-50">
          My NFTs
        </h1>

        {myNFTs.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-12 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
              You don't have any NFTs yet
            </p>
            <a
              href="/marketplace"
              className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Browse Marketplace
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myNFTs.map((nft) => (
              <div
                key={nft.id}
                className="bg-white dark:bg-zinc-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                  <span className="text-zinc-400">{nft.name}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                        {nft.name}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {nft.collection}
                      </p>
                    </div>
                    
                    {/* Dropdown menu */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenDropdown(openDropdown === nft.id ? null : nft.id)
                        }
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                      >
                        <svg
                          className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                          />
                        </svg>
                      </button>

                      {openDropdown === nft.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-md shadow-lg z-10 border border-zinc-200 dark:border-zinc-700">
                          <div className="py-1">
                            <button
                              onClick={() => handleDropdownAction("view", nft.id)}
                              className="block w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleDropdownAction("transfer", nft.id)}
                              className="block w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                            >
                              Transfer
                            </button>
                            <button
                              onClick={() => handleDropdownAction("list", nft.id)}
                              className="block w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                            >
                              List for Sale
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {openDropdown !== null && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  );
}
