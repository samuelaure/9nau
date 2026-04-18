import type { Metadata } from 'next'
import { Inter as FontSans } from 'next/font/google'
import './globals.css'

const fontSans = FontSans({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: '9naŭ — Sign In',
  description: 'Central identity hub for the 9naŭ platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontSans.variable}>{children}</body>
    </html>
  )
}
