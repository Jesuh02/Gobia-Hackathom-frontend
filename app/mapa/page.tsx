'use client'

import { useState, useEffect, useMemo } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { listContratos, toNumber, formatCOP, type ApiContractSummary } from '@/lib/api'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'

// --- Color helpers -----------------------------------------------------------

function getHeatColor(score: number): string {
  if (score <= 0) return '#f6f6f8'
  if (score < 25) return '#dcfce7'
  if (score < 40) return '#86efac'
  if (score < 55) return '#fde68a'
  if (score < 70) return '#fdba74'
  if (score < 85) return '#f87171'
  return '#b91c1c'
}

function getTextColor(score: number): string {
  if (score >= 55) return '#fff'
  return '#011821'
}

// --- Types -------------------------------------------------------------------

interface EntidadStat {
  entidad: string
  score_promedio: number
  total_contratos: number
  valor_total: number
  nivel_riesgo: string
}

interface NivelStat {
  nivel: string
  score_promedio: number
  total: number
}

// --- Cell Component ----------------------------------------------------------

function HeatmapCell({
  cell,
  onClick,
  isSelected,
}: {
  cell: EntidadStat
  onClick: () => void
  isSelected: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center rounded p-1 cursor-pointer border-2 transition-all',
        isSelected ? 'border-[#111a4a] scale-105 z-10' : 'border-transparent'
      )}
      style={{ backgroundColor: getHeatColor(cell.score_promedio), minHeight: 52 }}
      title={`${cell.entidad}\nScore: ${cell.score_promedio}\nContratos: ${cell.total_contratos}`}
    >
      <span
        className="text-[11px] font-bold font-mono leading-none"
        style={{ color: getTextColor(cell.score_promedio) }}
      >
        {cell.score_promedio}
      </span>
      <span
        className="text-[8px] mt-0.5 leading-none opacity-75"
        style={{ color: getTextColor(cell.score_promedio) }}
      >
        {cell.total_contratos}c
      </span>
    </div>
  )
}

// --- Main Page ---------------------------------------------------------------

export default function MapaPage() {
  const [items, setItems] = useState<ApiContractSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [selectedCell, setSelectedCell] = useState<EntidadStat | null>(null)
  const [nivelFilter, setNivelFilter] = useState<string>('')

  useEffect(() => {
    listContratos({ page: 1, page_size: 100 })
      .then((res) => setItems(res.items))
      .catch((err) => setApiError(err instanceof Error ? err.message : 'Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [])

  // Group by entidad_nombre
  const entidadStats = useMemo<EntidadStat[]>(() => {
    const map: Record<string, { scores: number[]; valor: number; nivel_counts: Record<string, number> }> = {}
    for (const c of items) {
      const name = c.entidad_nombre ?? 'Desconocida'
      if (!map[name]) map[name] = { scores: [], valor: 0, nivel_counts: {} }
      const score = toNumber(c.score_final)
      map[name].scores.push(score)
      map[name].valor += toNumber(c.valor_inicial)
      const nivel = (c.nivel_riesgo ?? 'BAJO').toUpperCase()
      map[name].nivel_counts[nivel] = (map[name].nivel_counts[nivel] ?? 0) + 1
    }
    return Object.entries(map)
      .map(([entidad, { scores, valor, nivel_counts }]) => {
        const dominant = Object.entries(nivel_counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'BAJO'
        return {
          entidad,
          score_promedio: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          total_contratos: scores.length,
          valor_total: valor,
          nivel_riesgo: dominant,
        }
      })
      .sort((a, b) => b.score_promedio - a.score_promedio)
  }, [items])

  // Group by nivel_riesgo
  const nivelStats = useMemo<NivelStat[]>(() => {
    const map: Record<string, number[]> = {}
    for (const c of items) {
      const nivel = (c.nivel_riesgo ?? 'BAJO').toUpperCase()
      if (!map[nivel]) map[nivel] = []
      map[nivel].push(toNumber(c.score_final))
    }
    return Object.entries(map).map(([nivel, scores]) => ({
      nivel,
      score_promedio: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      total: scores.length,
    })).sort((a, b) => b.score_promedio - a.score_promedio)
  }, [items])

  const niveles = useMemo(() => [...new Set(entidadStats.map((e) => e.nivel_riesgo))].sort(), [entidadStats])

  const filtered = nivelFilter
    ? entidadStats.filter((e) => e.nivel_riesgo === nivelFilter)
    : entidadStats

  // Grid: up to 8 columns
  const COLS = Math.min(8, filtered.length)

  return (
    <AppShell
      title="Mapa de Calor de Riesgo"
      subtitle="Score promedio por entidad contratante - datos reales de la base de datos"
    >
      {loading && (
        <div className="flex items-center gap-3 mb-4 px-5 py-4 bg-white rounded-lg border border-[#e3e4e8]">
          <div className="w-3 h-3 border-2 border-[#111a4a]/30 border-t-[#111a4a] rounded-full animate-spin" />
          <p className="text-[13px] text-[#7c7f88]">Cargando contratos desde el servidor...</p>
        </div>
      )}
      {apiError && (
        <div className="mb-4 px-5 py-4 bg-[#fef2f2] rounded-lg border border-[#fecaca]">
          <p className="text-[12px] font-semibold text-[#dc2626]">Error de conexion</p>
          <p className="text-[11px] text-[#7c7f88] mt-0.5">{apiError}</p>
        </div>
      )}

      {/* Legend + controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="bg-white rounded-lg border border-[#e3e4e8] px-5 py-4 flex items-center gap-4">
          <p className="text-[11px] font-semibold text-[#7c7f88] uppercase tracking-wider">Escala de riesgo</p>
          <div className="flex items-center gap-1">
            {[0, 20, 35, 50, 65, 80, 100].map((v) => (
              <div key={v} className="w-8 h-5 rounded-sm" style={{ backgroundColor: getHeatColor(v) }} title={`Score ~${v}`} />
            ))}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[#7c7f88]">
            <span>Bajo</span>
            <span>-&gt;</span>
            <span className="text-[#dc2626] font-semibold">Critico</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e3e4e8] px-4 py-3 flex items-center gap-3 flex-1">
          <p className="text-[11px] font-semibold text-[#7c7f88] whitespace-nowrap">Filtrar nivel:</p>
          <select
            value={nivelFilter}
            onChange={(e) => setNivelFilter(e.target.value)}
            className="flex-1 text-[12px] bg-[#f6f6f8] border border-[#e3e4e8] rounded-lg px-3 py-1.5 text-[#232730] focus:outline-none focus:border-[#111a4a]"
          >
            <option value="">Todos los niveles</option>
            {niveles.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* HEATMAP GRID */}
        <div className="xl:col-span-3 bg-white rounded-lg border border-[#e3e4e8] overflow-hidden" style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}>
          <div className="px-5 py-4 border-b border-[#e3e4e8] flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-[#011821]">Score por Entidad Contratante</h3>
              <p className="text-[11px] text-[#7c7f88] mt-0.5">
                {filtered.length} entidades. Score promedio (0-100). Cada celda: score y cantidad de contratos.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#7c7f88]">
              <Info className="w-3.5 h-3.5" />
              <span>Haz clic para detalle</span>
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            {!loading && filtered.length === 0 ? (
              <p className="text-[13px] text-[#7c7f88] text-center py-8">Sin contratos</p>
            ) : (
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${COLS}, minmax(64px, 1fr))` }}
              >
                {filtered.map((cell) => {
                  const isSelected = selectedCell?.entidad === cell.entidad
                  return (
                    <div key={cell.entidad}>
                      <div className="text-center text-[8px] font-semibold text-[#7c7f88] px-1 mb-0.5 truncate" title={cell.entidad}>
                        {cell.entidad.split(' ')[0]}
                      </div>
                      <HeatmapCell
                        cell={cell}
                        onClick={() => setSelectedCell(isSelected ? null : cell)}
                        isSelected={isSelected}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col gap-4">
          {/* Cell detail */}
          {selectedCell ? (
            <div className="bg-white rounded-lg border border-[#111a4a] p-4" style={{ boxShadow: 'rgba(17, 26, 74, 0.12) 0px 0px 0px 2px' }}>
              <p className="text-[10px] font-semibold text-[#7c7f88] uppercase tracking-wider mb-2">Entidad seleccionada</p>
              <p className="text-[13px] font-bold text-[#011821] leading-tight">{selectedCell.entidad}</p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#7c7f88]">Score promedio</span>
                  <span
                    className="text-[13px] font-bold font-mono"
                    style={{ color: selectedCell.score_promedio >= 70 ? '#dc2626' : selectedCell.score_promedio >= 40 ? '#d97706' : '#16a34a' }}
                  >
                    {selectedCell.score_promedio}
                  </span>
                </div>
                <div className="h-2 bg-[#f6f6f8] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${selectedCell.score_promedio}%`, backgroundColor: getHeatColor(selectedCell.score_promedio) }}
                  />
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#7c7f88]">Contratos</span>
                  <span className="font-mono font-semibold text-[#011821]">{selectedCell.total_contratos}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#7c7f88]">Valor total</span>
                  <span className="font-mono font-semibold text-[#011821]">{formatCOP(selectedCell.valor_total)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#7c7f88]">Nivel dominante</span>
                  <span
                    className="font-semibold text-[11px]"
                    style={{ color: selectedCell.nivel_riesgo === 'ALTO' ? '#dc2626' : selectedCell.nivel_riesgo === 'MEDIO' ? '#d97706' : '#16a34a' }}
                  >
                    {selectedCell.nivel_riesgo}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#e3e4e8] p-4">
              <p className="text-[11px] text-[#7c7f88]">Selecciona una celda del mapa para ver su detalle</p>
            </div>
          )}

          {/* Top entities by risk */}
          <div className="bg-white rounded-lg border border-[#e3e4e8] p-4" style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}>
            <p className="text-[13px] font-semibold text-[#011821] mb-3">Top Entidades por Score</p>
            {loading ? (
              <p className="text-[12px] text-[#7c7f88]">Cargando...</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={entidadStats.slice(0, 8)} layout="vertical" margin={{ left: 60, right: 10, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#7c7f88' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="entidad" tick={{ fontSize: 8, fill: '#7c7f88' }} axisLine={false} tickLine={false} width={58}
                    tickFormatter={(v: string) => v.split(' ')[0]} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f6f6f8" horizontal={false} />
                  <Tooltip
                    formatter={(v: number) => [`Score: ${v}`, '']}
                    contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e3e4e8' }}
                  />
                  <Bar dataKey="score_promedio" radius={[0, 4, 4, 0]}>
                    {entidadStats.slice(0, 8).map((d) => (
                      <Cell key={d.entidad} fill={getHeatColor(d.score_promedio)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Risk level distribution */}
          <div className="bg-white rounded-lg border border-[#e3e4e8] p-4" style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}>
            <p className="text-[13px] font-semibold text-[#011821] mb-3">Por nivel de riesgo</p>
            <div className="space-y-2">
              {nivelStats.map((s) => (
                <div key={s.nivel} className="flex items-center gap-2">
                  <span className="text-[10px] text-[#7c7f88] w-12 truncate">{s.nivel}</span>
                  <div className="flex-1 h-2 bg-[#f6f6f8] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.score_promedio}%`, backgroundColor: getHeatColor(s.score_promedio) }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-semibold w-8 text-right" style={{ color: s.score_promedio >= 70 ? '#dc2626' : s.score_promedio >= 40 ? '#d97706' : '#16a34a' }}>
                    {s.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
