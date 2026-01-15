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

function getExpectedChainName() {
  return CHAIN_NAMES[CHAIN_ID] || `Chain ${CHAIN_ID}`;
}

/**
 * Wrong Network Banner Component
 * Shows a warning banner when user is on the wrong network
 * Includes a "Switch Network" button
 */
export default function WrongNetworkBanner() {
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          setIsWrongNetwork(!isExpectedChain(chainIdHex));
        } catch (err) {
          setIsWrongNetwork(false);
        }
      }
    };

    checkNetwork();

    if (typeof window !== 'undefined' && window.ethereum) {
      const handleChainChanged = (chainIdHex) => {
        setIsWrongNetwork(!isExpectedChain(chainIdHex));
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const handleSwitchNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    setIsSwitching(true);
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        alert(`Please add ${getExpectedChainName()} to your wallet manually.`);
      }
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isWrongNetwork) return null;

  return (
    <div className="wrong-network-banner">
      <div className="banner-content">
        <span className="warning-icon">⚠️</span>
        <span className="message">
          <strong>Wrong Network</strong> - Please switch to {getExpectedChainName()} to continue.
        </span>
        <button 
          onClick={handleSwitchNetwork} 
          disabled={isSwitching}
          className="switch-button"
        >
          {isSwitching ? 'Switching...' : 'Switch Network'}
        </button>
      </div>
      <style jsx>{`
        .wrong-network-banner {
          background: linear-gradient(90deg, #fef3c7 0%, #fde68a 100%);
          border-bottom: 2px solid #f59e0b;
          padding: 12px 20px;
        }
        .banner-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .warning-icon {
          font-size: 20px;
        }
        .message {
          color: #92400e;
          font-size: 14px;
        }
        .switch-button {
          background: #f59e0b;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .switch-button:hover:not(:disabled) {
          background: #d97706;
        }
        .switch-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
