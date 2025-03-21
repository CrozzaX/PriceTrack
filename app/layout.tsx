import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import BottomCompareBar from '@/components/BottomCompareBar'
import { Toaster } from 'react-hot-toast'
import { CompareProvider } from '@/lib/context/CompareContext'
import { SavedProductsProvider } from '@/lib/context/SavedProductsContext'
import { AuthProvider } from '@/lib/context/AuthContext'
import PageTransition from '@/components/PageTransition'

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
        <AuthProvider>
          <CompareProvider>
            <SavedProductsProvider>
              <Toaster position="top-center" />
              <Navbar />
              <main className="pt-20 pb-20 px-1 md:px-15 max-w-[1440px] mx-auto min-h-screen">
                <PageTransition>
                  {children}
                </PageTransition>
              </main>
              <BottomCompareBar />
            </SavedProductsProvider>
          </CompareProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
