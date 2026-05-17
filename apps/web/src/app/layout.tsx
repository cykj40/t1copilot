import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'T1Copilot',
  description: 'The open source AI copilot for Type 1 diabetes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
