import '../styles/globals.css';
import NetworkBadge from '../components/NetworkBadge';
import WrongNetworkBanner from '../components/WrongNetworkBanner';

export const metadata = {
  title: 'NovatoK NFT Explorer',
  description: 'Mint and explore NFTs on the blockchain',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WrongNetworkBanner />
        <header className="app-header">
          <div className="header-content">
            <h1 className="logo">NovatoK NFT</h1>
            <nav className="nav-links">
              <a href="/">Home</a>
              <a href="/mint">Mint</a>
              <a href="/generate">Generate</a>
            </nav>
            <NetworkBadge />
          </div>
        </header>
        <main className="main-content">
          {children}
        </main>
        <style jsx global>{`
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f9fafb;
            min-height: 100vh;
          }
          .app-header {
            background: white;
            border-bottom: 1px solid #e5e7eb;
            padding: 16px 24px;
          }
          .header-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
          }
          .logo {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
          }
          .nav-links {
            display: flex;
            gap: 24px;
          }
          .nav-links a {
            color: #4b5563;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
          }
          .nav-links a:hover {
            color: #111827;
          }
          .main-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 32px 24px;
          }
        `}</style>
      </body>
    </html>
  );
}
