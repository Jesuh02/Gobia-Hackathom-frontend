'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink, ArrowUpDown } from 'lucide-react'
import { formatCOP } from '@/lib/api'
import { listContratos, summaryToTableContract, type TableContract, type FrontendRiskLevel } from '@/lib/api'
import { cn } from '@/lib/utils'

function RiskBadge({ score, nivel }: { score: number; nivel: FrontendRiskLevel }) {
  const config = {
    alto: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Alto' },
    medio: { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'Medio' },
    bajo: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'Bajo' },
  }[nivel]

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-16 rounded-full bg-[#f6f6f8] overflow-hidden"
        title={`Score: ${score}`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            backgroundColor: config.text,
          }}
        />
      </div>
      <span
        className="text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono"
        style={{ backgroundColor: config.bg, color: config.text, border: `1px solid ${config.border}` }}
      >
        {score}
      </span>
    </div>
  )
}

export function ContractsTable({ contracts, limit = 8 }: { contracts?: TableContract[]; limit?: number }) {
  const [data, setData] = useState<TableContract[]>(contracts ?? [])
  const [loadingInternal, setLoadingInternal] = useState(!contracts)

  // Fetch own data when no contracts prop is provided (dashboard usage)
  useEffect(() => {
    if (contracts !== undefined) {
      setData(contracts)
      return
    }
    setLoadingInternal(true)
    listContratos({ page: 1, page_size: 20 })
      .then((res) => setData(res.items.map(summaryToTableContract)))
      .catch(() => setData([]))
      .finally(() => setLoadingInternal(false))
  }, [contracts])

  const displayed = data
    .sort((a, b) => b.score_riesgo - a.score_riesgo)
    .slice(0, limit)

  return (
    <div
      className="bg-white rounded-lg border border-[#e3e4e8] overflow-hidden"
      style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}
    >
      <div className="px-5 py-4 border-b border-[#e3e4e8] flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-[#011821] tracking-tight">Contratos Recientes</h3>
          <p className="text-[12px] text-[#7c7f88] mt-0.5">Ordenados por score de riesgo descendente</p>
        </div>
        <Link
          href="/contratos"
          className="text-[12px] font-medium text-[#111a4a] hover:text-[#ec652b] transition-colors flex items-center gap-1"
        >
          Ver todos <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {loadingInternal ? (
        <div className="flex items-center gap-3 px-5 py-8">
          <div className="w-3 h-3 border-2 border-[#111a4a]/30 border-t-[#111a4a] rounded-full animate-spin" />
          <p className="text-[13px] text-[#7c7f88]">Cargando contratos...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#f6f6f8] bg-[#f6f6f8]">
                {['Número', 'Objeto', 'Entidad', 'Proveedor', 'Valor', 'Modalidad', 'Score', 'Flags', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#7c7f88] uppercase tracking-wider whitespace-nowrap"
                  >
                    {h && (
                      <span className="flex items-center gap-1">
                        {h} {h !== '' && <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f6f6f8]">
              {displayed.map((c) => (
                <tr key={c.id} className="hover:bg-[#f6f6f8] transition-colors group">
                  <td className="px-4 py-3 font-mono text-[11px] text-[#7c7f88] whitespace-nowrap">{c.numero}</td>
                  <td className="px-4 py-3 max-w-[260px]">
                    <p className="text-[#011821] font-medium truncate" title={c.objeto}>
                      {c.objeto}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[#232730] whitespace-nowrap max-w-[160px]">
                    <p className="truncate">{c.entidad}</p>
                  </td>
                  <td className="px-4 py-3 text-[#232730] whitespace-nowrap max-w-[140px]">
                    <p className="truncate">{c.proveedor}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-[#011821] font-medium whitespace-nowrap">{formatCOP(c.valor)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded',
                        c.modalidad.includes('Directa')
                          ? 'bg-[#fffbeb] text-[#d97706] border border-[#fde68a]'
                          : c.modalidad.includes('Urgencia')
                          ? 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]'
                          : 'bg-[#f0f1f8] text-[#111a4a] border border-[#c7cae0]'
                      )}
                    >
                      {c.modalidad}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <RiskBadge score={c.score_riesgo} nivel={c.nivel_riesgo} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {c.red_flags.length > 0 ? (
                      <span className="text-[10px] font-mono bg-[#fef2f2] text-[#dc2626] px-1.5 py-0.5 rounded border border-[#fecaca]">
                        {c.red_flags.length} flag{c.red_flags.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#7c7f88]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/contratos/${c.id}?entidad=${encodeURIComponent(c.entidad)}&proveedor=${encodeURIComponent(c.proveedor)}`}
                      className="text-[11px] font-medium text-[#111a4a] opacity-0 group-hover:opacity-100 hover:text-[#ec652b] transition-all flex items-center gap-1 whitespace-nowrap"
                    >
                      Ver <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
