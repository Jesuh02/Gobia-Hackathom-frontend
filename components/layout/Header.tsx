'use client'

import { Bell, RefreshCw, Database } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { listContratos } from '@/lib/api'

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [contractsCount, setContractsCount] = useState<number | null>(null)

  useEffect(() => {
    const now = new Date()
    setLastUpdate(now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }))

    // Fetch real count from API
    listContratos({ page: 1, page_size: 1 })
      .then((res) => setContractsCount(res.total))
      .catch(() => {})

    const interval = setInterval(() => {
      const updated = new Date()
      setLastUpdate(updated.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }))
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="h-14 bg-white border-b border-[#e3e4e8] flex items-center px-6 gap-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-semibold text-[#011821] leading-none tracking-tight">{title}</h1>
        {subtitle && <p className="text-[12px] text-[#7c7f88] mt-0.5">{subtitle}</p>}
      </div>

      {/* Live stats */}
      <div className="hidden md:flex items-center gap-4 text-[12px]">
        <div className="flex items-center gap-1.5 text-[#7c7f88]">
          <Database className="w-3.5 h-3.5" />
          <span className="font-mono">{contractsCount !== null ? contractsCount.toLocaleString('es-CO') : '...'}</span>
          <span>contratos analizados</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#7c7f88]">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizado {lastUpdate}</span>
        </div>
      </div>

      {/* Alerts bell */}
      <Link
        href="/alertas"
        className="relative p-2 rounded-lg hover:bg-[#f6f6f8] transition-colors"
        aria-label="Ver alertas"
      >
        <Bell className="w-4.5 h-4.5 text-[#232730]" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-[#dc2626] rounded-full border-2 border-white" />
      </Link>

      {/* API badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f0fdf4] rounded-lg border border-[#bbf7d0]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#44b48b] animate-pulse" />
        <span className="text-[11px] font-medium text-[#16a34a]">SECOP II</span>
      </div>
    </header>
  )
}
