'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ContractsTable } from '@/components/dashboard/ContractsTable'
import { listContratos, summaryToTableContract, type TableContract } from '@/lib/api'

export default function ContratosPage() {
  const [contracts, setContracts] = useState<TableContract[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listContratos({ page: 1, page_size: 100 })
      .then((res) => {
        setContracts(res.items.map(summaryToTableContract))
        setTotal(res.total)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar contratos'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell
      title="Contratos Analizados"
      subtitle={`Listado completo de contratos con score de riesgo · Haz clic en una fila para ver el informe del agente${total > 0 ? ` · ${total.toLocaleString('es-CO')} contratos en total` : ''}`}
    >
      {loading && (
        <div className="flex items-center gap-3 px-5 py-4 bg-white rounded-lg border border-[#e3e4e8] mb-4">
          <div className="w-3 h-3 border-2 border-[#111a4a]/30 border-t-[#111a4a] rounded-full animate-spin" />
          <p className="text-[13px] text-[#7c7f88]">Cargando contratos desde el servidor...</p>
        </div>
      )}
      {error && (
        <div className="mb-4 px-5 py-4 bg-[#fef2f2] rounded-lg border border-[#fecaca]">
          <p className="text-[12px] font-semibold text-[#dc2626]">Error de conexión con el backend</p>
          <p className="text-[11px] text-[#7c7f88] mt-0.5">{error}</p>
        </div>
      )}
      {!loading && <ContractsTable contracts={contracts} limit={contracts.length} />}
    </AppShell>
  )
}
