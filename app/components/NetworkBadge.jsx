'use client';

import { useState, useEffect } from 'react';
import { CHAIN_ID, isExpectedChain, getChainName, getExpectedChainName } from '../lib/config';

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
          // Wallet not connected or error
          setCurrentChainId(null);
          setIsCorrectNetwork(false);
        }
      }
    };

    checkNetwork();

    // Listen for chain changes
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
