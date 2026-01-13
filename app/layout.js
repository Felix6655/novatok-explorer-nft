import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'NovaTok NFT Marketplace',
  description: 'NFT Marketplace powered by NovaTok',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
