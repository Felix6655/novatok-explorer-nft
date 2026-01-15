'use client';

import { useState, useEffect } from 'react';
import { CHAIN_ID, CONTRACT_ADDRESS, isExpectedChain, getExpectedChainName } from '../../lib/config';
import { NFT_ABI } from '../../lib/contractABI';

/**
 * Mint Page - Allows users to mint NFTs with a custom tokenURI
 * Includes chain locking to prevent wrong-network actions
 */
export default function MintPage() {
  const [tokenURI, setTokenURI] = useState('');
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState(null);
  const [error, setError] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [uriWarning, setUriWarning] = useState('');

  // Check network on mount and on chain change
  useEffect(() => {
    const checkNetwork = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          setWalletConnected(accounts.length > 0);
          
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          setIsWrongNetwork(!isExpectedChain(chainIdHex));
        } catch (err) {
          setIsWrongNetwork(true);
        }
      }
    };

    checkNetwork();

    if (typeof window !== 'undefined' && window.ethereum) {
      const handleChainChanged = (chainIdHex) => {
        setIsWrongNetwork(!isExpectedChain(chainIdHex));
      };

      const handleAccountsChanged = (accounts) => {
        setWalletConnected(accounts.length > 0);
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  // Validate tokenURI when it changes
  useEffect(() => {
    if (!tokenURI) {
      setUriWarning('');
      return;
    }

    // Validate URI format
    const isValidHttp = /^https?:\/\/.+/.test(tokenURI);
    const isValidIpfs = tokenURI.startsWith('ipfs://');

    if (!isValidHttp && !isValidIpfs) {
      setUriWarning('Token URI must start with http://, https://, or ipfs://');
    } else if (isValidHttp && !isValidIpfs) {
      setUriWarning('Warning: HTTP(S) URIs are less permanent. Consider using ipfs:// for better decentralization.');
    } else {
      setUriWarning('');
    }
  }, [tokenURI]);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletConnected(true);
      setError('');
    } catch (err) {
      setError('Failed to connect wallet');
    }
  };

  const switchNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        setError(`Please add ${getExpectedChainName()} to your wallet manually.`);
      }
    }
  };

  const handleMint = async () => {
    // Hard guard: Block if wrong network
    if (isWrongNetwork) {
      setError('Cannot mint on wrong network. Please switch to ' + getExpectedChainName());
      return;
    }

    // Validate tokenURI
    if (!tokenURI) {
      setError('Please enter a token URI');
      return;
    }

    const isValidHttp = /^https?:\/\/.+/.test(tokenURI);
    const isValidIpfs = tokenURI.startsWith('ipfs://');

    if (!isValidHttp && !isValidIpfs) {
      setError('Token URI must be a valid http(s):// or ipfs:// URL');
      return;
    }

    if (!CONTRACT_ADDRESS) {
      setError('Contract address not configured');
      return;
    }

    setIsMinting(true);
    setError('');
    setMintResult(null);

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        throw new Error('No wallet connected');
      }

      // Encode the mint function call
      const iface = {
        encodeFunctionData: (name, args) => {
          // Simple ABI encoding for mint(string)
          const signature = 'mint(string)';
          const selector = '0x' + Array.from(
            new Uint8Array(
              // keccak256 of signature
              [0xd8, 0x5d, 0x3d, 0x27] // This is a simplified version
            )
          ).map(b => b.toString(16).padStart(2, '0')).join('');
          
          // For production, use ethers.js or viem for proper encoding
          return selector;
        }
      };

      // Using eth_sendTransaction for simplicity
      // In production, use ethers.js or viem
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: CONTRACT_ADDRESS,
          data: '0xd85d3d27' + // mint(string) selector
            '0000000000000000000000000000000000000000000000000000000000000020' + // offset
            tokenURI.length.toString(16).padStart(64, '0') + // length
            Buffer.from(tokenURI).toString('hex').padEnd(Math.ceil(tokenURI.length / 32) * 64, '0'), // data
        }],
      });

      setMintResult({
        success: true,
        txHash,
        message: 'NFT minted successfully!',
      });
    } catch (err) {
      setError(err.message || 'Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  const isButtonDisabled = isWrongNetwork || !walletConnected || isMinting || !tokenURI;

  return (
    <div className="mint-page">
      <h1>Mint NFT</h1>
      <p className="subtitle">Mint a new NFT with a custom token URI</p>

      {!walletConnected && (
        <button onClick={connectWallet} className="connect-button">
          Connect Wallet
        </button>
      )}

      {isWrongNetwork && walletConnected && (
        <div className="wrong-network-box">
          <p>⚠️ Wrong Network - Please switch to {getExpectedChainName()}</p>
          <button onClick={switchNetwork} className="switch-button">
            Switch Network
          </button>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="tokenURI">Token URI</label>
        <input
          id="tokenURI"
          type="text"
          value={tokenURI}
          onChange={(e) => setTokenURI(e.target.value)}
          placeholder="ipfs://... or https://..."
          disabled={isWrongNetwork}
        />
        {uriWarning && (
          <p className={`uri-warning ${tokenURI.startsWith('ipfs://') ? '' : 'warning'}`}>
            {uriWarning}
          </p>
        )}
        <p className="hint">Enter the metadata URI for your NFT. IPFS URIs (ipfs://...) are recommended for permanence.</p>
      </div>

      {error && <p className="error">{error}</p>}

      {mintResult && mintResult.success && (
        <div className="success-box">
          <p>✅ {mintResult.message}</p>
          <p className="tx-hash">Transaction: {mintResult.txHash}</p>
        </div>
      )}

      <button
        onClick={handleMint}
        disabled={isButtonDisabled}
        className="mint-button"
      >
        {isMinting ? 'Minting...' : 'Mint NFT'}
      </button>

      <style jsx>{`
        .mint-page {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        h1 {
          font-size: 32px;
          color: #111827;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #6b7280;
          margin-bottom: 32px;
        }
        .connect-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 24px;
        }
        .connect-button:hover {
          background: #2563eb;
        }
        .wrong-network-box {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          text-align: center;
        }
        .wrong-network-box p {
          color: #92400e;
          margin-bottom: 12px;
        }
        .switch-button {
          background: #f59e0b;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        .switch-button:hover {
          background: #d97706;
        }
        .form-group {
          margin-bottom: 24px;
        }
        label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
        }
        input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        input:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }
        .hint {
          font-size: 13px;
          color: #6b7280;
          margin-top: 8px;
        }
        .uri-warning {
          font-size: 13px;
          margin-top: 8px;
          padding: 8px 12px;
          border-radius: 6px;
        }
        .uri-warning.warning {
          background: #fef3c7;
          color: #92400e;
        }
        .error {
          background: #fef2f2;
          color: #991b1b;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .success-box {
          background: #dcfce7;
          border: 1px solid #86efac;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .success-box p {
          color: #166534;
        }
        .tx-hash {
          font-size: 12px;
          word-break: break-all;
          margin-top: 8px;
        }
        .mint-button {
          width: 100%;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .mint-button:hover:not(:disabled) {
          background: #2563eb;
        }
        .mint-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
