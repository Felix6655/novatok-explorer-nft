"use client";

import { useState } from "react";

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-black dark:text-zinc-50">
          Marketplace
        </h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder NFT cards - no pricing shown */}
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="bg-white dark:bg-zinc-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                <span className="text-zinc-400">NFT #{item}</span>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  NFT Item #{item}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Collection Name
                </p>
                <button className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        <div className="mt-12 text-center text-zinc-500 dark:text-zinc-400">
          <p>Connect your wallet to see available NFTs</p>
        </div>
      </div>
    </div>
  );
}
