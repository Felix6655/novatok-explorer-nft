'use client';

import { useState, useEffect } from 'react';

// Get config from environment
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1', 10);
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

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
 * Generate Page - Create metadata, upload to IPFS, and mint NFT
 * Includes chain locking and IPFS pinning UI
 */
export default function GeneratePage() {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [attributes, setAttributes] = useState([{ trait_type: '', value: '' }]);

  // IPFS state
  const [isUploading, setIsUploading] = useState(false);
  const [metadataUri, setMetadataUri] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Mint state
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState(null);
  const [mintError, setMintError] = useState('');

  // Network state
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setMintError('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletConnected(true);
    } catch (err) {
      setMintError('Failed to connect wallet');
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
        setMintError(`Please add ${getExpectedChainName()} to your wallet manually.`);
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
  };

  const removeAttribute = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index, field, value) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  const handleUploadToIPFS = async () => {
    if (!imageFile || !name) {
      setUploadError('Please provide an image and name');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const imageBase64 = imagePreview.split(',')[1];
      const validAttributes = attributes.filter(
        (attr) => attr.trait_type && attr.value
      );
      const metadata = {
        name,
        description,
        attributes: validAttributes,
      };

      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          metadata,
          fileName: imageFile.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload to IPFS');
      }

      const data = await response.json();
      setMetadataUri(data.metadataUri);
      setImageUri(data.imageUri);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload to IPFS');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMint = async () => {
    // Hard guard: Block if wrong network
    if (isWrongNetwork) {
      setMintError('Cannot mint on wrong network. Please switch to ' + getExpectedChainName());
      return;
    }

    // Hard guard: Only allow ipfs:// URIs
    if (!metadataUri || !metadataUri.startsWith('ipfs://')) {
      setMintError('Please upload to IPFS first. Token URI must start with ipfs://');
      return;
    }

    if (!CONTRACT_ADDRESS) {
      setMintError('Contract address not configured');
      return;
    }

    setIsMinting(true);
    setMintError('');
    setMintResult(null);

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        throw new Error('No wallet connected');
      }

      const tokenURI = metadataUri;
      const encoder = new TextEncoder();
      const tokenURIBytes = encoder.encode(tokenURI);
      const paddedLength = Math.ceil(tokenURIBytes.length / 32) * 32;
      
      let data = '0xd85d3d27';
      data += '0000000000000000000000000000000000000000000000000000000000000020';
      data += tokenURIBytes.length.toString(16).padStart(64, '0');
      
      let hexStr = '';
      for (let i = 0; i < tokenURIBytes.length; i++) {
        hexStr += tokenURIBytes[i].toString(16).padStart(2, '0');
      }
      data += hexStr.padEnd(paddedLength * 2, '0');

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: CONTRACT_ADDRESS,
          data: data,
        }],
      });

      setMintResult({
        success: true,
        txHash,
        message: 'NFT minted successfully!',
      });
    } catch (err) {
      setMintError(err.message || 'Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  const canUpload = imageFile && name && !isUploading;
  const canMint = metadataUri && metadataUri.startsWith('ipfs://') && !isWrongNetwork && walletConnected && !isMinting;

  return (
    <div className="generate-page">
      <h1>Generate & Mint NFT</h1>
      <p className="subtitle">Create metadata, upload to IPFS, and mint your NFT</p>

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

      <div className="section">
        <h2>1. NFT Details</h2>
        
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Awesome NFT"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your NFT..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Image *</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Attributes (Optional)</label>
          {attributes.map((attr, index) => (
            <div key={index} className="attribute-row">
              <input
                type="text"
                value={attr.trait_type}
                onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                placeholder="Trait type"
              />
              <input
                type="text"
                value={attr.value}
                onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                placeholder="Value"
              />
              <button
                type="button"
                onClick={() => removeAttribute(index)}
                className="remove-btn"
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={addAttribute} className="add-attr-btn">
            + Add Attribute
          </button>
        </div>
      </div>

      <div className="section">
        <h2>2. Upload to IPFS</h2>
        
        <button
          onClick={handleUploadToIPFS}
          disabled={!canUpload}
          className="upload-button"
        >
          {isUploading ? 'Uploading...' : 'Upload to IPFS'}
        </button>

        {uploadError && <p className="error">{uploadError}</p>}

        {metadataUri && (
          <div className="ipfs-result">
            <div className="uri-box">
              <label>Metadata URI (Token URI)</label>
              <div className="uri-display">
                <code>{metadataUri}</code>
                <button onClick={() => copyToClipboard(metadataUri)} className="copy-btn">
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
            {imageUri && (
              <div className="uri-box">
                <label>Image URI</label>
                <div className="uri-display">
                  <code>{imageUri}</code>
                  <button onClick={() => copyToClipboard(imageUri)} className="copy-btn">
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="section">
        <h2>3. Mint NFT</h2>
        
        {!metadataUri && (
          <p className="info-box">
            ℹ️ Upload your NFT to IPFS first to get the token URI.
          </p>
        )}

        {metadataUri && !metadataUri.startsWith('ipfs://') && (
          <p className="warning-box">
            ⚠️ Token URI must start with ipfs:// to mint.
          </p>
        )}

        {mintError && <p className="error">{mintError}</p>}

        {mintResult && mintResult.success && (
          <div className="success-box">
            <p>✅ {mintResult.message}</p>
            <p className="tx-hash">Transaction: {mintResult.txHash}</p>
          </div>
        )}

        <button
          onClick={handleMint}
          disabled={!canMint}
          className="mint-button"
        >
          {isMinting ? 'Minting...' : 'Mint NFT'}
        </button>
      </div>

      <style jsx>{`
        .generate-page {
          max-width: 700px;
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
        .section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .section h2 {
          font-size: 18px;
          color: #111827;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          font-size: 14px;
        }
        input[type="text"],
        textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 15px;
        }
        input:focus,
        textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .image-preview {
          margin-top: 12px;
        }
        .image-preview img {
          max-width: 200px;
          max-height: 200px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .attribute-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        .attribute-row input {
          flex: 1;
        }
        .remove-btn {
          background: #fee2e2;
          color: #991b1b;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 18px;
        }
        .add-attr-btn {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        .upload-button {
          background: #8b5cf6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
        }
        .upload-button:hover:not(:disabled) {
          background: #7c3aed;
        }
        .upload-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .error {
          background: #fef2f2;
          color: #991b1b;
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 16px;
        }
        .info-box {
          background: #eff6ff;
          color: #1e40af;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .warning-box {
          background: #fef3c7;
          color: #92400e;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .success-box {
          background: #dcfce7;
          border: 1px solid #86efac;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .success-box p {
          color: #166534;
        }
        .tx-hash {
          font-size: 12px;
          word-break: break-all;
          margin-top: 8px;
        }
        .ipfs-result {
          margin-top: 20px;
        }
        .uri-box {
          margin-bottom: 16px;
        }
        .uri-display {
          display: flex;
          gap: 12px;
          align-items: center;
          background: #f3f4f6;
          padding: 12px;
          border-radius: 8px;
        }
        .uri-display code {
          flex: 1;
          font-size: 13px;
          word-break: break-all;
          color: #374151;
        }
        .copy-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
        }
        .copy-btn:hover {
          background: #2563eb;
        }
        .mint-button {
          width: 100%;
          background: #10b981;
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        .mint-button:hover:not(:disabled) {
          background: #059669;
        }
        .mint-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
