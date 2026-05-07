import type { Metadata } from 'next'
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
//
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GobIA Auditor — Detección de Opacidad en Contratos Públicos',
  description:
    'Plataforma de inteligencia artificial para la detección automática de riesgo de corrupción en contratos públicos del SECOP II de Colombia.',
  keywords: ['contratos públicos', 'SECOP II', 'auditoría', 'corrupción', 'Colombia', 'transparencia'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${ibmPlexMono.variable} bg-[#f6f6f8]`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
