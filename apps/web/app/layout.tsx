import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'All My Circles - Professional Networking & B2B Sales Platform',
  description: 'Connect. Network. Convert. The modern way to manage your professional relationships with CRM integration.',
  keywords: 'professional networking, B2B sales, CRM integration, HubSpot, Salesforce, Pipedrive, business contacts, networking app',
  authors: [{ name: 'All My Circles Team' }],
  openGraph: {
    title: 'All My Circles - Professional Networking & B2B Sales Platform',
    description: 'Connect. Network. Convert. The modern way to manage your professional relationships with CRM integration.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All My Circles - Professional Networking & B2B Sales Platform',
    description: 'Connect. Network. Convert. The modern way to manage your professional relationships with CRM integration.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}