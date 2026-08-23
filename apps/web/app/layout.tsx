import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'MediSlot · Smart Healthcare Appointment & Patient Care Platform',
  description: 'MediSlot is a modern healthcare platform connecting patients, doctors, and administrators through intelligent appointment scheduling, AI insights, and clinical care workflows.',
  applicationName: 'MediSlot',
  authors: [{ name: 'Akash Singh' }],
  keywords: ['healthcare', 'appointments', 'doctor booking', 'patient care', 'telehealth', 'medication reminders', 'clinical SaaS'],
  openGraph: {
    title: 'MediSlot · Smart Healthcare Appointment & Patient Care Platform',
    description: 'Intelligent healthcare appointment scheduling, patient management, AI-assisted visit insights, and secure communication.',
    type: 'website',
  },
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#0d9488',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
