'use client';

import { useState, useEffect } from 'react';

// Get chain config from environment
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1', 10);

const CHAIN_NAMES = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon Mainnet',
  80001: 'Polygon Mumbai',
  42161: 'Arbitrum One',
  421614: 'Arbitrum Sepolia',
  10: 'Optimism',
  8453: 'Base',
  84532: 'Base Sepolia',
};

function isExpectedChain(chainId) {
  const numericChainId = typeof chainId === 'string' 
    ? parseInt(chainId, chainId.startsWith('0x') ? 16 : 10) 
    : chainId;
  return numericChainId === CHAIN_ID;
}

function getChainName(chainId) {
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
}

function getExpectedChainName() {
  return getChainName(CHAIN_ID);
}

/**
 * Network Badge Component
 * Shows the current network status and whether user is on the expected chain
 */
export default function NetworkBadge() {
  const [currentChainId, setCurrentChainId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          const chainId = parseInt(chainIdHex, 16);
          setCurrentChainId(chainId);
          setIsCorrectNetwork(isExpectedChain(chainId));
        } catch (err) {
          setCurrentChainId(null);
          setIsCorrectNetwork(false);
        }
      }
    };

    checkNetwork();

    if (typeof window !== 'undefined' && window.ethereum) {
      const handleChainChanged = (chainIdHex) => {
        const chainId = parseInt(chainIdHex, 16);
        setCurrentChainId(chainId);
        setIsCorrectNetwork(isExpectedChain(chainId));
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  if (currentChainId === null) {
    return (
      <div className="network-badge not-connected">
        <span className="dot gray"></span>
        <span>Wallet Not Connected</span>
        <style jsx>{`
          .network-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
          }
          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }
          .dot.gray { background: #9ca3af; }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`network-badge ${isCorrectNetwork ? 'correct' : 'wrong'}`}>
      <span className={`dot ${isCorrectNetwork ? 'green' : 'red'}`}></span>
      <span>{getChainName(currentChainId)}</span>
      {!isCorrectNetwork && (
        <span className="expected">(Expected: {getExpectedChainName()})</span>
      )}
      <style jsx>{`
        .network-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }
        .network-badge.correct {
          background: #dcfce7;
          border: 1px solid #86efac;
          color: #166534;
        }
        .network-badge.wrong {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #991b1b;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .dot.green { background: #22c55e; }
        .dot.red { background: #ef4444; }
        .expected {
          font-size: 11px;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
