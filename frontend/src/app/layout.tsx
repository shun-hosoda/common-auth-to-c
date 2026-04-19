import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'common-auth-to-c',
  description: 'toC向けSaaS認証基盤',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
