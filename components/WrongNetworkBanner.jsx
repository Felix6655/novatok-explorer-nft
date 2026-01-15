'use client';

import { useState, useEffect } from 'react';
import { CHAIN_ID, isExpectedChain, getExpectedChainName } from '../lib/config';

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
      // Try to switch to the expected chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError) {
      // If the chain is not added, we might need to add it first
      // Error code 4902 means the chain hasn't been added
      if (switchError.code === 4902) {
        // Chain not added - user needs to add it manually or we can try wallet_addEthereumChain
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
