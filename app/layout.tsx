import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ordinary Gentlemen - FPL League',
  description: 'Fantasy Premier League management and Score & Strike game platform',
  keywords: 'FPL, Fantasy Premier League, Score & Strike, Football, Premier League',
  authors: [{ name: 'Ordinary Gentlemen' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Ordinary Gentlemen - FPL League',
    description: 'Fantasy Premier League management and Score & Strike game platform',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ordinary Gentlemen - FPL League',
    description: 'Fantasy Premier League management and Score & Strike game platform',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#38003C',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Google Fonts - FPL Design System */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
        
        {/* iOS Safari Fixes */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ordinary Gentlemen" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Ordinary Gentlemen" />
        <meta name="msapplication-TileColor" content="#38003C" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`${inter.className} h-full bg-[var(--color-bg)] text-[var(--color-text-primary)]`}>
        {children}
      </body>
    </html>
  )
} 