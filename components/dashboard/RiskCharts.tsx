'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell,
} from 'recharts'
import { listContratos, toNumber, formatCOP, type ApiContractSummary } from '@/lib/api'

// --- Shared tooltip -----------------------------------------------------------

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#e3e4e8] rounded-lg p-3 shadow-lg text-[12px]">
        <p className="font-semibold text-[#011821] mb-1">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[#7c7f88]">{entry.name}:</span>
            <span className="font-mono font-medium text-[#011821]">{String(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// --- Helpers ------------------------------------------------------------------

function bucketScore(score: number): '0-20' | '21-40' | '41-60' | '61-80' | '81-100' {
  if (score <= 20) return '0-20'
  if (score <= 40) return '21-40'
  if (score <= 60) return '41-60'
  if (score <= 80) return '61-80'
  return '81-100'
}

function monthKey(fechaFirma: string): string {
  const d = new Date(fechaFirma)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const MES_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
}

// --- Hook: loads all contract summaries once ----------------------------------

function useContratos() {
  const [items, setItems] = useState<ApiContractSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listContratos({ page: 1, page_size: 100 })
      .then((res) => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  return { items, loading }
}

// --- RiskDistributionChart ----------------------------------------------------

const DIST_COLORS = ['#44b48b', '#86efac', '#f59e0b', '#f97316', '#dc2626']
const DIST_BUCKETS = ['0-20', '21-40', '41-60', '61-80', '81-100'] as const
const DIST_LABELS = ['Muy bajo', 'Bajo', 'Medio', 'Alto', 'Critico']

export function RiskDistributionChart() {
  const { items, loading } = useContratos()

  const data = DIST_BUCKETS.map((range, i) => ({
    score_range: range,
    cantidad: items.filter((c) => bucketScore(toNumber(c.score_final)) === range).length,
    label: DIST_LABELS[i],
  }))

  return (
    <div className="bg-white rounded-lg border border-[#e3e4e8] p-5" style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}>
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold text-[#011821] tracking-tight">Distribucion de Score de Riesgo</h3>
        <p className="text-[12px] text-[#7c7f88] mt-0.5">Contratos por rango de score (0-100)</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-[200px] text-[12px] text-[#7c7f88]">Cargando...</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f6f6f8" vertical={false} />
            <XAxis dataKey="score_range" tick={{ fontSize: 11, fill: '#7c7f88', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#7c7f88', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={DIST_COLORS[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// --- RiskTrendChart -----------------------------------------------------------

export function RiskTrendChart() {
  const { items, loading } = useContratos()

  const monthMap: Record<string, { alto: number; medio: number; bajo: number }> = {}
  for (const c of items) {
    const key = monthKey(c.fecha_firma)
    if (!key) continue
    if (!monthMap[key]) monthMap[key] = { alto: 0, medio: 0, bajo: 0 }
    const nivel = (c.nivel_riesgo ?? '').toUpperCase()
    if (nivel === 'ALTO') monthMap[key].alto++
    else if (nivel === 'MEDIO') monthMap[key].medio++
    else monthMap[key].bajo++
  }

  const data = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const [, mm] = key.split('-')
      return { mes: MES_LABELS[mm] ?? mm, ...v }
    })

  return (
    <div className="bg-white rounded-lg border border-[#e3e4e8] p-5" style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}>
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold text-[#011821] tracking-tight">Tendencia de Riesgo por Mes</h3>
        <p className="text-[12px] text-[#7c7f88] mt-0.5">Contratos por nivel de riesgo agrupados por mes de firma</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-[200px] text-[12px] text-[#7c7f88]">Cargando...</div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-[12px] text-[#7c7f88]">Sin datos</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f6f6f8" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#7c7f88' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#7c7f88', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#7c7f88' }} />
            <Line type="monotone" dataKey="alto" stroke="#dc2626" strokeWidth={2} dot={false} name="Alto" />
            <Line type="monotone" dataKey="medio" stroke="#f59e0b" strokeWidth={2} dot={false} name="Medio" />
            <Line type="monotone" dataKey="bajo" stroke="#44b48b" strokeWidth={1.5} dot={false} name="Bajo" strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// --- IndicatorRadarChart ------------------------------------------------------

export function IndicatorRadarChart() {
  const { items, loading } = useContratos()

  const total = items.length || 1
  const alto = items.filter((c) => (c.nivel_riesgo ?? '').toUpperCase() === 'ALTO').length
  const medio = items.filter((c) => (c.nivel_riesgo ?? '').toUpperCase() === 'MEDIO').length
  const bajo = items.filter((c) => (c.nivel_riesgo ?? '').toUpperCase() === 'BAJO').length

  const data = [
    { indicador: 'Alto riesgo', valor: Math.round((alto / total) * 100) },
    { indicador: 'Medio riesgo', valor: Math.round((medio / total) * 100) },
    { indicador: 'Bajo riesgo', valor: Math.round((bajo / total) * 100) },
    { indicador: 'Score > 80', valor: Math.round((items.filter((c) => toNumber(c.score_final) > 80).length / total) * 100) },
    { indicador: 'Score > 60', valor: Math.round((items.filter((c) => toNumber(c.score_final) > 60).length / total) * 100) },
    { indicador: 'Score > 40', valor: Math.round((items.filter((c) => toNumber(c.score_final) > 40).length / total) * 100) },
  ]

  return (
    <div className="bg-white rounded-lg border border-[#e3e4e8] p-5" style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}>
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold text-[#011821] tracking-tight">Distribucion por Nivel (%)</h3>
        <p className="text-[12px] text-[#7c7f88] mt-0.5">Porcentaje de contratos por nivel de riesgo</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-[240px] text-[12px] text-[#7c7f88]">Cargando...</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="#e3e4e8" />
            <PolarAngleAxis dataKey="indicador" tick={{ fontSize: 9.5, fill: '#7c7f88' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#7c7f88' }} />
            <Radar name="%" dataKey="valor" stroke="#111a4a" fill="#111a4a" fillOpacity={0.12} strokeWidth={1.5} />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// --- TopEntidadesChart --------------------------------------------------------

interface EntidadStat {
  entidad: string
  contratos: number
  score_promedio: number
  valor: number
}

export function TopEntidadesChart() {
  const { items, loading } = useContratos()

  const byEntidad: Record<string, { scores: number[]; valor: number }> = {}
  for (const c of items) {
    const name = c.entidad_nombre ?? 'Desconocida'
    if (!byEntidad[name]) byEntidad[name] = { scores: [], valor: 0 }
    byEntidad[name].scores.push(toNumber(c.score_final))
    byEntidad[name].valor += toNumber(c.valor_inicial)
  }

  const top: EntidadStat[] = Object.entries(byEntidad)
    .map(([entidad, { scores, valor }]) => ({
      entidad,
      contratos: scores.length,
      score_promedio: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      valor,
    }))
    .sort((a, b) => b.score_promedio - a.score_promedio)
    .slice(0, 5)

  return (
    <div className="bg-white rounded-lg border border-[#e3e4e8] p-5" style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}>
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold text-[#011821] tracking-tight">Top Entidades por Riesgo</h3>
        <p className="text-[12px] text-[#7c7f88] mt-0.5">Score promedio y valor total contratado</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-[180px] text-[12px] text-[#7c7f88]">Cargando...</div>
      ) : top.length === 0 ? (
        <div className="flex items-center justify-center h-[180px] text-[12px] text-[#7c7f88]">Sin datos</div>
      ) : (
        <div className="space-y-3">
          {top.map((e, i) => (
            <div key={e.entidad} className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#7c7f88] w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-[#011821] truncate">{e.entidad}</span>
                  <span className="text-[11px] font-mono font-semibold" style={{ color: e.score_promedio >= 70 ? '#dc2626' : e.score_promedio >= 40 ? '#d97706' : '#16a34a' }}>
                    {e.score_promedio}
                  </span>
                </div>
                <div className="h-1.5 bg-[#f6f6f8] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${e.score_promedio}%`,
                      backgroundColor: e.score_promedio >= 70 ? '#dc2626' : e.score_promedio >= 40 ? '#f59e0b' : '#44b48b',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-[#7c7f88]">{e.contratos} contrato{e.contratos !== 1 ? 's' : ''}</span>
                  <span className="text-[10px] font-mono text-[#7c7f88]">{formatCOP(e.valor)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
