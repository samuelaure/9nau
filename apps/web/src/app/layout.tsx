import type { Metadata, Viewport } from 'next'
import { Inter as FontSans } from 'next/font/google'
import { cn } from '@9nau/ui/lib/utils'
import { AppProvider } from '@/providers/app-provider'
import './globals.css'
import React from 'react'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: '9naŭ',
  description: 'Life & business growth',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#030712' } // gray-950
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('bg-background font-sans antialiased', fontSans.variable)}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
