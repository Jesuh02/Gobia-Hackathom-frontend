'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { formatCOP } from '@/lib/api'
import { getContrato, mapNivelRiesgo, toNumber, computePlazo, type FrontendRiskLevel, type ApiIndicatorResult } from '@/lib/api'
import {
  ArrowLeft,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  Building,
  User,
  DollarSign,
  Clock,
  FileText,
  Cpu,
  Share2,
} from 'lucide-react'
import Link from 'next/link'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts'
import { cn } from '@/lib/utils'

function getRiskConfig(nivel: FrontendRiskLevel) {
  return {
    alto: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', label: 'ALTO RIESGO', icon: AlertTriangle },
    medio: { bg: '#fffbeb', border: '#fde68a', text: '#d97706', label: 'RIESGO MEDIO', icon: Info },
    bajo: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', label: 'BAJO RIESGO', icon: CheckCircle },
  }[nivel]
}

const INDICATOR_WEIGHTS = [
  { id: 1, nombre: 'Proceso abreviado sin justificacion', peso: 15 },
  { id: 2, nombre: 'Proveedor unico recurrente', peso: 12 },
  { id: 3, nombre: 'Adiciones sucesivas al valor inicial', peso: 12 },
  { id: 4, nombre: 'Urgencia manifiesta sin soporte', peso: 10 },
  { id: 5, nombre: 'Concentracion geografica o sectorial', peso: 8 },
  { id: 6, nombre: 'Plazo contractual inusualmente corto', peso: 8 },
  { id: 7, nombre: 'Objeto contractual generico o ambiguo', peso: 8 },
  { id: 8, nombre: 'Monto cercano a umbral de seleccion', peso: 7 },
  { id: 9, nombre: 'Proveedor registrado recientemente', peso: 7 },
  { id: 10, nombre: 'Ausencia de garantias contractuales', peso: 5 },
  { id: 11, nombre: 'Concentracion de contratos pre-electoral', peso: 5 },
  { id: 12, nombre: 'Anomalia semantica vs contratos similares', peso: 3 },
]

function ScoreGauge({ score, nivel }: { score: number; nivel: FrontendRiskLevel }) {
  const color = nivel === 'alto' ? '#dc2626' : nivel === 'medio' ? '#f59e0b' : '#44b48b'
  const data = [{ name: 'score', value: score, fill: color }, { name: 'rest', value: 100 - score, fill: '#f6f6f8' }]

  return (
    <div className="relative flex items-center justify-center" style={{ height: 160 }}>
      <ResponsiveContainer width="100%" height={160}>
        <RadialBarChart
          cx="50%" cy="78%"
          innerRadius="55%" outerRadius="80%"
          startAngle={180} endAngle={0}
          data={data}
        >
          <RadialBar dataKey="value" cornerRadius={6} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ paddingTop: 28, zIndex: 10 }}
      >
        <span
          className="text-[40px] font-extrabold leading-none tabular-nums"
          style={{
            color,
            textShadow: `0 0 16px ${color}44`,
            letterSpacing: '-1px',
          }}
        >
          {score}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest mt-1" style={{ color: '#a0a3ad' }}>
          / 100
        </span>
      </div>
    </div>
  )
}

// PDF export using jsPDF + html2canvas
async function exportPDF(numero: string) {
  const { default: jsPDF } = await import('jspdf')
  const { default: html2canvas } = await import('html2canvas')

  const element = document.getElementById('pdf-content')
  if (!element) return

  const canvas = await html2canvas(element, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgHeight = (canvas.height * pageWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(`GobIA_Reporte_${numero}.pdf`)
}

export default function ContratoDetailPage() {
  const pathname = usePathname()
  const id = pathname?.split('/').filter(Boolean).pop() ?? ''
  const searchParams = useSearchParams()
  const [exporting, setExporting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  // Fields derived from API
  const [numero, setNumero] = useState('')
  const [objeto, setObjeto] = useState('')
  const [entidad, setEntidad] = useState(searchParams.get('entidad') ?? '—')
  const [proveedor, setProveedor] = useState(searchParams.get('proveedor') ?? '—')
  const [valor, setValor] = useState(0)
  const [fechaFirma, setFechaFirma] = useState('')
  const [plazoDias, setPlazoDias] = useState(0)
  const [estado, setEstado] = useState('activo')
  const [adicionesValor, setAdicionesValor] = useState(0)
  const [scoreRiesgo, setScoreRiesgo] = useState(0)
  const [nivelRiesgo, setNivelRiesgo] = useState<FrontendRiskLevel>('bajo')
  const [factorLlm, setFactorLlm] = useState(1.0)
  const [scoreBase, setScoreBase] = useState(0)
  const [redFlags, setRedFlags] = useState<{ indicador: string; descripcion: string; peso: number }[]>([])
  const [justificacion, setJustificacion] = useState('')
  const [indicators, setIndicators] = useState<ApiIndicatorResult[]>([])

  useEffect(() => {
    setLoading(true)
    getContrato(id)
      .then((detail) => {
        const c = detail.contrato
        const ev = detail.evaluacion

        setNumero(c.numero_contrato ?? c.secop_id)
        setObjeto(c.objeto)
        setValor(toNumber(c.valor_inicial))
        setFechaFirma(c.fecha_firma)
        setPlazoDias(computePlazo(c.fecha_inicio, c.fecha_fin))
        setEstado(c.estado_id === 1 ? 'activo' : 'terminado')
        setAdicionesValor(
          detail.adiciones.reduce((sum, a) => sum + toNumber(a.valor_adicion), 0)
        )

        if (ev) {
          setScoreRiesgo(Math.round(ev.score_final))
          setNivelRiesgo(mapNivelRiesgo(ev.nivel_riesgo))
          setFactorLlm(ev.factor_ajuste_llm ?? 1.0)
          setScoreBase(Math.round(ev.score_reglas))
          setJustificacion(ev.justification ?? 'Sin análisis de agente disponible para este contrato.')
          setIndicators(ev.indicators)
          setRedFlags(
            ev.indicators
              .filter((ind) => ind.triggered)
              .map((ind) => ({
                indicador: ind.name,
                descripcion: ind.detail,
                peso: Math.round(ind.weight),
              }))
          )
        }
      })
      .catch((err) => setApiError(err instanceof Error ? err.message : 'Error al cargar contrato'))
      .finally(() => setLoading(false))
  }, [id])

  const cfg = getRiskConfig(nivelRiesgo)
  const RiskIcon = cfg.icon

  const indicatorChartData = indicators.length > 0
    ? indicators.map((ind, i) => ({ nombre: `I${i + 1}`, peso: ind.weight, activo: ind.triggered }))
    : INDICATOR_WEIGHTS.map((ind) => ({ nombre: `I${ind.id}`, peso: ind.peso, activo: false }))

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportPDF(numero)
    } finally {
      setExporting(false)
    }
  }

  return (
    <AppShell
      title="Detalle del Contrato"
      subtitle={`${numero} · Informe del Agente LLM`}
    >
      {/* Loading / error */}
      {loading && (
        <div className="flex items-center gap-3 mb-4 px-5 py-4 bg-white rounded-lg border border-[#e3e4e8]">
          <div className="w-3 h-3 border-2 border-[#111a4a]/30 border-t-[#111a4a] rounded-full animate-spin" />
          <p className="text-[13px] text-[#7c7f88]">Cargando contrato desde el servidor...</p>
        </div>
      )}
      {apiError && (
        <div className="mb-4 px-5 py-4 bg-[#fef2f2] rounded-lg border border-[#fecaca]">
          <p className="text-[12px] font-semibold text-[#dc2626]">Error de conexión con el backend</p>
          <p className="text-[11px] text-[#7c7f88] mt-0.5">{apiError}</p>
        </div>
      )}
      {/* Top actions */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/contratos"
          className="flex items-center gap-2 text-[13px] font-medium text-[#7c7f88] hover:text-[#011821] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a contratos
        </Link>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-[#232730] bg-white border border-[#e3e4e8] rounded-lg hover:bg-[#f6f6f8] transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartir
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold text-white bg-[#ec652b] rounded-lg hover:bg-[#d44f1a] disabled:opacity-60 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Exportando PDF...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* PDF export target */}
      <div id="pdf-content">
        {/* Header card */}
        <div
          className="bg-white rounded-lg border p-6 mb-4"
          style={{
            borderColor: cfg.border,
            boxShadow: `rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px`,
          }}
        >
          <div className="flex items-start gap-6">
            {/* Score gauge */}
            <div className="shrink-0 w-48">
              <ScoreGauge score={scoreRiesgo} nivel={nivelRiesgo} />
              <div
                className="flex items-center justify-center gap-2 mt-2 px-4 py-2 rounded-lg"
                style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <RiskIcon className="w-4 h-4" style={{ color: cfg.text }} />
                <span className="text-[12px] font-bold" style={{ color: cfg.text }}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-[10px] text-center text-[#7c7f88] mt-2">
                factor LLM: ×{factorLlm.toFixed(2)}
              </p>
            </div>

            {/* Contract info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono text-[#7c7f88] bg-[#f6f6f8] px-2 py-0.5 rounded border border-[#e3e4e8]">
                  {numero}
                </span>
              </div>

              <h2 className="text-[18px] font-bold text-[#011821] leading-snug mb-4 tracking-tight">
                {objeto}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-[12px]">
                {[
                  { icon: Building, label: 'Entidad contratante', value: entidad },
                  { icon: User, label: 'Proveedor / Contratista', value: proveedor },
                  { icon: DollarSign, label: 'Valor del contrato', value: formatCOP(valor), mono: true, highlight: true },
                  { icon: Calendar, label: 'Fecha de firma', value: fechaFirma },
                  { icon: Clock, label: 'Plazo', value: plazoDias > 0 ? `${plazoDias} días` : '—', warn: plazoDias > 0 && plazoDias < 30 },
                  { icon: Info, label: 'Estado', value: estado.charAt(0).toUpperCase() + estado.slice(1) },
                  { icon: DollarSign, label: 'Adiciones', value: adicionesValor > 0 ? formatCOP(adicionesValor) : 'Ninguna', warn: adicionesValor > 0 },
                ].map(({ icon: Icon, label, value, mono, highlight, warn }) => (
                  <div key={label}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon className="w-3 h-3 text-[#7c7f88]" />
                      <span className="text-[#7c7f88] text-[10px]">{label}</span>
                    </div>
                    <p
                      className={cn(
                        'font-medium leading-tight',
                        mono && 'font-mono',
                        highlight ? 'text-[#011821] text-[14px]' : 'text-[#232730]',
                        warn && 'text-[#dc2626]'
                      )}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main content: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Agent report */}
          <div className="lg:col-span-2 space-y-4">
            {/* Agent justification */}
            <div
              className="bg-white rounded-lg border border-[#e3e4e8] p-5"
              style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#111a4a] flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#011821]">Análisis del Agente LLM</p>
                  <p className="text-[10px] text-[#7c7f88]">Qwen3.6 Plus via OpenRouter · ReAct Agent · LangGraph</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-[#f0fdf4] rounded border border-[#bbf7d0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#44b48b]" />
                  <span className="text-[10px] font-medium text-[#16a34a]">Análisis completado</span>
                </div>
              </div>

              {/* Prompt simulation */}
              <div className="bg-[#f6f6f8] rounded-lg p-3 mb-4 border border-[#e3e4e8]">
                <p className="text-[9px] font-semibold text-[#7c7f88] uppercase tracking-wider mb-1">Prompt del agente (system)</p>
                <p className="text-[10px] font-mono text-[#232730] leading-relaxed">
                  {`Eres un auditor experto en contratación pública colombiana. Analiza el contrato y devuelve SOLO JSON con este schema: {score_llm: 0-100, factor_ajuste: 0.8-1.2, red_flags: [str], justificacion: str}`}
                </p>
              </div>

              <div className="bg-[#011821] rounded-lg p-4 mb-4">
                <p className="text-[9px] font-semibold text-[#88deeb] uppercase tracking-wider mb-2 font-mono">
                  RESPUESTA DEL AGENTE · JSON ESTRUCTURADO
                </p>
                <pre className="text-[10px] font-mono text-white/80 leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`{
  "score_llm": ${factorLlm > 0 ? Math.round(scoreRiesgo / factorLlm) : scoreBase},
  "factor_ajuste": ${factorLlm.toFixed(2)},
  "score_final": ${scoreRiesgo},
  "red_flags": ${JSON.stringify(redFlags.map(f => f.indicador), null, 2)},
  "nivel_riesgo": "${nivelRiesgo}"
}`}
                </pre>
              </div>

              <div className="prose-sm">
                <p className="text-[11px] font-semibold text-[#7c7f88] uppercase tracking-wider mb-2">Justificación en lenguaje natural</p>
                <p className="text-[13px] text-[#232730] leading-relaxed">{justificacion}</p>
              </div>
            </div>

            {/* Red flags detail */}
            {redFlags.length > 0 && (
              <div
                className="bg-white rounded-lg border border-[#e3e4e8] p-5"
                style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-semibold text-[#011821]">
                    Red Flags Detectadas ({redFlags.length})
                  </h3>
                  <span className="text-[10px] font-mono text-[#7c7f88]">
                    Contribución al score base: {redFlags.reduce((s, f) => s + f.peso, 0)}pts
                  </span>
                </div>
                <div className="space-y-3">
                  {redFlags.map((flag, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-[#fef9f8] rounded-lg border border-[#fecaca]"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-3 h-3 text-[#dc2626]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-[12px] font-semibold text-[#dc2626]">{flag.indicador}</p>
                          <span className="text-[10px] font-mono bg-[#fef2f2] text-[#dc2626] px-1.5 py-0.5 rounded border border-[#fecaca] shrink-0">
                            +{flag.peso}%
                          </span>
                        </div>
                        <p className="text-[12px] text-[#232730]">{flag.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Indicators + score breakdown */}
          <div className="space-y-4">
            {/* Score breakdown chart */}
            <div
              className="bg-white rounded-lg border border-[#e3e4e8] p-5"
              style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}
            >
              <h3 className="text-[13px] font-semibold text-[#011821] mb-3">Pesos por Indicador</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={indicatorChartData} layout="vertical" margin={{ left: 24, right: 10, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#7c7f88' }} axisLine={false} tickLine={false} domain={[0, 15]} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 9, fill: '#7c7f88' }} axisLine={false} tickLine={false} width={22} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f6f6f8" horizontal={false} />
                  <Tooltip
                    formatter={(v: number, _: string, props: any) => {
                      const ind = INDICATOR_WEIGHTS.find(i => `I${i.id}` === props.payload.nombre)
                      return [`Peso: ${v}% · ${props.payload.activo ? 'ACTIVO' : 'inactivo'}`, ind?.nombre ?? '']
                    }}
                    contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #e3e4e8' }}
                  />
                  <Bar dataKey="peso" radius={[0, 3, 3, 0]}>
                    {indicatorChartData.map((entry) => (
                      <Cell key={entry.nombre} fill={entry.activo ? '#dc2626' : '#e3e4e8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-[#7c7f88]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#dc2626]" /> Activo</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#e3e4e8]" /> Inactivo</span>
              </div>
            </div>

            {/* Score formula */}
            <div
              className="bg-white rounded-lg border border-[#e3e4e8] p-4"
              style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}
            >
              <p className="text-[11px] font-semibold text-[#7c7f88] uppercase tracking-wider mb-3">Cálculo del Score</p>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#7c7f88]">Score por reglas</span>
                  <span className="font-mono font-semibold text-[#011821]">
                    {scoreBase}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7c7f88]">Factor LLM</span>
                  <span className={cn(
                    'font-mono font-semibold',
                    factorLlm > 1 ? 'text-[#dc2626]' : 'text-[#16a34a]'
                  )}>
                    ×{factorLlm.toFixed(2)}
                  </span>
                </div>
                <div className="h-px bg-[#e3e4e8]" />
                <div className="flex justify-between font-bold">
                  <span className="text-[#011821]">Score Final</span>
                  <span className="font-mono text-[14px]" style={{ color: cfg.text }}>
                    {scoreRiesgo}
                  </span>
                </div>
                <div className="mt-2 p-2 bg-[#f6f6f8] rounded text-[9px] font-mono text-[#7c7f88]">
                  score_final = Σ(indicador_i × peso_i) × factor_LLM
                </div>
              </div>
            </div>

            {/* All indicators */}
            <div
              className="bg-white rounded-lg border border-[#e3e4e8] p-4"
              style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}
            >
              <p className="text-[11px] font-semibold text-[#7c7f88] uppercase tracking-wider mb-3">Indicadores Evaluados</p>
              <div className="space-y-1.5">
                {indicators.length > 0
                  ? indicators.map((ind, i) => (
                    <div key={ind.code} className={cn('flex items-center gap-2 p-1.5 rounded', ind.triggered && 'bg-[#fef2f2]')}>
                      <span
                        className={cn(
                          'w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold',
                          ind.triggered ? 'bg-[#dc2626] text-white' : 'bg-[#f6f6f8] text-[#7c7f88]'
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className={cn('text-[10px] leading-tight flex-1', ind.triggered ? 'text-[#dc2626] font-medium' : 'text-[#7c7f88]')}>
                        {ind.name}
                      </span>
                      <span className={cn('text-[9px] font-mono shrink-0', ind.triggered ? 'text-[#dc2626] font-bold' : 'text-[#e3e4e8]')}>
                        {Math.round(ind.weight)}%
                      </span>
                    </div>
                  ))
                  : INDICATOR_WEIGHTS.map((ind) => (
                    <div key={ind.id} className="flex items-center gap-2 p-1.5 rounded">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold bg-[#f6f6f8] text-[#7c7f88]">
                        {ind.id}
                      </span>
                      <span className="text-[10px] leading-tight flex-1 text-[#7c7f88]">{ind.nombre}</span>
                      <span className="text-[9px] font-mono shrink-0 text-[#e3e4e8]">{ind.peso}%</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>

        {/* PDF footer */}
        <div className="mt-6 p-4 bg-[#f6f6f8] rounded-lg border border-[#e3e4e8] flex items-center justify-between">
          <div className="text-[10px] text-[#7c7f88] font-mono">
            <p>Generado por GobIA Auditor · Hackathon 2025</p>
            <p>Fuente: SECOP II · datos.gov.co · {new Date().toLocaleDateString('es-CO')}</p>
          </div>
          <div className="text-[10px] text-right text-[#7c7f88]">
            <p>Este reporte fue generado automáticamente por IA.</p>
            <p>Requiere validación por auditor humano antes de uso oficial.</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
