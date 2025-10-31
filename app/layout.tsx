import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Among Us IRL',
  description: 'Among Us in Real Life Game Helper',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

