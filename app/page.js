export default function HomePage() {
  return (
    <div className="home-page">
      <h1>Welcome to NovatoK NFT Explorer</h1>
      <p>Mint and manage your NFTs on the blockchain.</p>
      
      <div className="cards">
        <a href="/mint" className="card">
          <h2>Mint NFT</h2>
          <p>Mint a new NFT with a custom token URI</p>
        </a>
        <a href="/generate" className="card">
          <h2>Generate & Mint</h2>
          <p>Generate metadata, upload to IPFS, and mint</p>
        </a>
      </div>

      <style jsx>{`
        .home-page {
          text-align: center;
          padding: 40px 0;
        }
        h1 {
          font-size: 36px;
          margin-bottom: 16px;
          color: #111827;
        }
        p {
          color: #6b7280;
          font-size: 18px;
          margin-bottom: 40px;
        }
        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          max-width: 800px;
          margin: 0 auto;
        }
        .card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 32px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
        .card h2 {
          color: #111827;
          font-size: 20px;
          margin-bottom: 8px;
        }
        .card p {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
