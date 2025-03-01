import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import BottomCompareBar from '@/components/BottomCompareBar'
import { Toaster } from 'react-hot-toast'
import { CompareProvider } from '@/lib/context/CompareContext'
import { SavedProductsProvider } from '@/lib/context/SavedProductsContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PriceWise - Track Product Prices',
  description: 'Track product prices across multiple e-commerce sites and get notified of price drops.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CompareProvider>
          <SavedProductsProvider>
            <Toaster position="top-center" />
            <Navbar />
            <main className="pt-24 pb-20 max-w-[1440px] mx-auto min-h-screen">
              {children}
            </main>
            <BottomCompareBar />
          </SavedProductsProvider>
        </CompareProvider>
      </body>
    </html>
  )
}
