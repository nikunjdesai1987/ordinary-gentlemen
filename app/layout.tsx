import React from 'react'
import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Ordinary Gentlemen - FPL League',
  description: 'Where Football Knowledge Meets Fantasy Glory - Join the ultimate Fantasy Premier League experience',
  keywords: ['Fantasy Premier League', 'FPL', 'Football', 'Fantasy Sports', 'Premier League'],
  authors: [{ name: 'Ordinary Gentlemen' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Ordinary Gentlemen - FPL League',
    description: 'Where Football Knowledge Meets Fantasy Glory',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ordinary Gentlemen - FPL League',
    description: 'Where Football Knowledge Meets Fantasy Glory',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#667eea',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ordinary Gentlemen" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${poppins.variable} ${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 