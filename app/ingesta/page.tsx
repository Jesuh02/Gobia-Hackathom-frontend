'use client'

import { useState, useRef, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Play, Square, Download, CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// --- Types -------------------------------------------------------------------

interface LogLine {
  id: number
  time: string
  level: string
  message: string
}

interface IngestaStats {
  nuevos: number
  actualizados: number
  errores: number
  duracion_ms: number
}

interface HistoryEntry {
  n: number
  hora: string
  nuevos: number
  errores: number
  duracion_ms: number
  pdfs: boolean
  ok: boolean
}

type RunStatus = 'idle' | 'running' | 'ok' | 'error'

// --- Helpers -----------------------------------------------------------------

function levelClass(level: string): string {
  switch ((level ?? '').toUpperCase()) {
    case 'ERROR':
    case 'CRITICAL':
      return 'text-[#f87171]'
    case 'WARNING':
      return 'text-[#fbbf24]'
    case 'SUCCESS':
      return 'text-[#4ade80]'
    case 'INFO':
      return 'text-[#cbd5e1]'
    default:
      return 'text-[#94a3b8]'
  }
}

// --- Page --------------------------------------------------------------------

export default function IngestaPage() {
  // Config
  const [maxRecords, setMaxRecords] = useState(50)
  const [pageSize, setPageSize] = useState(50)
  const [evaluate, setEvaluate] = useState(true)
  const [extractDocs, setExtractDocs] = useState(false)

  // Runtime
  const [runStatus, setRunStatus] = useState<RunStatus>('idle')
  const [statusText, setStatusText] = useState('Listo para iniciar ingesta')
  const [stats, setStats] = useState<IngestaStats | null>(null)
  const [logs, setLogs] = useState<LogLine[]>([
    { id: 0, time: '--:--:--', level: 'SYSTEM', message: 'Listo para iniciar ingesta.' },
  ])
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const logBoxRef = useRef<HTMLDivElement>(null)
  const logIdRef = useRef(1)
  const execCountRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const addLog = useCallback((message: string, level = 'INFO', time?: string) => {
    const now = time ?? new Date().toLocaleTimeString('es-CO')
    setLogs((prev) => [
      ...prev,
      { id: logIdRef.current++, time: now, level: level.toUpperCase(), message },
    ])
    setTimeout(() => {
      if (logBoxRef.current) {
        logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight
      }
    }, 0)
  }, [])

  const startIngesta = useCallback(async () => {
    if (runStatus === 'running') return

    abortRef.current = new AbortController()
    const effectiveMax = maxRecords > 0 ? maxRecords : null

    setRunStatus('running')
    setStatusText('Ingesta en curso...')
    setStats(null)
    setLogs([{ id: logIdRef.current++, time: new Date().toLocaleTimeString('es-CO'), level: 'INFO', message: `Iniciando: ${effectiveMax ?? 'TODOS'} registros, pagina ${pageSize}${evaluate ? ', IA' : ''}${extractDocs ? ', PDF/OCR' : ''}` }])

    const t0 = Date.now()
    let finalStats: IngestaStats | null = null
    let serverError: string | null = null

    try {
      const res = await fetch(`${API_BASE}/api/v1/ingesta/secop/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({
          max_records: effectiveMax,
          page_size: pageSize,
          evaluate,
          extract_documents: extractDocs,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        let detail = ''
        try { detail = (await res.json()).detail ?? '' } catch { try { detail = await res.text() } catch { /* ignore */ } }
        throw new Error(`HTTP ${res.status}: ${detail}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let sepIdx: number
        while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, sepIdx)
          buffer = buffer.slice(sepIdx + 2)

          const dataLines = rawEvent
            .split('\n')
            .filter((l) => l.startsWith('data: '))
            .map((l) => l.slice(6))
          if (dataLines.length === 0) continue

          let parsed: Record<string, unknown>
          try { parsed = JSON.parse(dataLines.join('\n')) } catch { continue }

          if (parsed.type === 'log') {
            addLog(
              `[${parsed.name}:${parsed.line}] ${parsed.message}`,
              parsed.level as string,
              parsed.time as string,
            )
          } else if (parsed.type === 'stats') {
            finalStats = parsed as unknown as IngestaStats
          } else if (parsed.type === 'error') {
            serverError = parsed.message as string
            addLog(`${parsed.message}`, 'ERROR')
          }
        }
      }

      const elapsed = Date.now() - t0
      const data: IngestaStats = finalStats ?? { nuevos: 0, actualizados: 0, errores: 0, duracion_ms: elapsed }
      if (!data.duracion_ms) data.duracion_ms = elapsed

      setStats(data)
      setRunStatus('ok')
      setStatusText(`Completado - ${data.nuevos} nuevos, ${data.errores} errores de proceso`)
      addLog(`Completado en ${data.duracion_ms.toLocaleString('es-CO')} ms  |  nuevos: ${data.nuevos}  |  errores: ${data.errores}`, 'SUCCESS')

      execCountRef.current += 1
      const n = execCountRef.current
      setHistory((h) => [
        { n, hora: new Date().toLocaleTimeString('es-CO'), nuevos: data.nuevos, errores: data.errores, duracion_ms: data.duracion_ms, pdfs: extractDocs, ok: !serverError },
        ...h,
      ])
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setRunStatus('idle')
        setStatusText('Ingesta cancelada')
        addLog('Ingesta cancelada por el usuario', 'WARNING')
        return
      }
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setRunStatus('error')
      setStatusText(`Error: ${msg}`)
      addLog(msg, 'ERROR')
      execCountRef.current += 1
      const n = execCountRef.current
      setHistory((h) => [
        { n, hora: new Date().toLocaleTimeString('es-CO'), nuevos: 0, errores: 1, duracion_ms: Date.now() - t0, pdfs: extractDocs, ok: false },
        ...h,
      ])
    }
  }, [runStatus, maxRecords, pageSize, evaluate, extractDocs, addLog])

  const cancelIngesta = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const statusDot: Record<RunStatus, string> = {
    idle:    'bg-[#7c7f88]',
    running: 'bg-[#d97706] animate-pulse',
    ok:      'bg-[#16a34a]',
    error:   'bg-[#dc2626]',
  }

  const statusBorder: Record<RunStatus, string> = {
    idle:    'border-[#e3e4e8]',
    running: 'border-[#fde68a]',
    ok:      'border-[#bbf7d0]',
    error:   'border-[#fecaca]',
  }

  return (
    <AppShell
      title="Panel de Ingesta SECOP II"
      subtitle="Descarga, analiza y almacena contratos publicos con evaluacion de riesgo por LLM"
    >
      {/* Config card */}
      <div
        className="bg-white rounded-lg border border-[#e3e4e8] mb-4"
        style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}
      >
        <div className="px-5 py-4 border-b border-[#e3e4e8]">
          <h3 className="text-[14px] font-semibold text-[#011821]">Configuracion de ingesta</h3>
          <p className="text-[11px] text-[#7c7f88] mt-0.5">Parametros para la descarga desde SECOP II y el analisis de riesgo</p>
        </div>

        <div className="p-5">
          {/* Numeric inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[12px] font-semibold text-[#232730] mb-1.5">
                Registros a descargar
                <span className="text-[#7c7f88] font-normal ml-1.5">max_records &middot; 0 = todos</span>
              </label>
              <input
                type="number"
                value={maxRecords}
                onChange={(e) => setMaxRecords(Number(e.target.value))}
                min={0}
                max={999999}
                disabled={runStatus === 'running'}
                className="w-full px-3 py-2.5 text-[13px] bg-[#f6f6f8] border border-[#e3e4e8] rounded-lg text-[#011821] font-mono placeholder:text-[#7c7f88] focus:outline-none focus:border-[#111a4a] focus:bg-white disabled:opacity-60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#232730] mb-1.5">
                Tamano de pagina
                <span className="text-[#7c7f88] font-normal ml-1.5">page_size &middot; max 500</span>
              </label>
              <input
                type="number"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                min={1}
                max={500}
                disabled={runStatus === 'running'}
                className="w-full px-3 py-2.5 text-[13px] bg-[#f6f6f8] border border-[#e3e4e8] rounded-lg text-[#011821] font-mono placeholder:text-[#7c7f88] focus:outline-none focus:border-[#111a4a] focus:bg-white disabled:opacity-60 transition-colors"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6 mb-5 p-4 bg-[#f6f6f8] rounded-lg border border-[#e3e4e8]">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={evaluate}
                onChange={(e) => setEvaluate(e.target.checked)}
                disabled={runStatus === 'running'}
                className="w-4 h-4 accent-[#111a4a] cursor-pointer disabled:cursor-not-allowed"
              />
              <div>
                <p className="text-[13px] font-medium text-[#011821] leading-none">Evaluar riesgo</p>
                <p className="text-[11px] text-[#7c7f88] mt-0.5">LLM + scoring de 12 indicadores</p>
              </div>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={extractDocs}
                onChange={(e) => setExtractDocs(e.target.checked)}
                disabled={runStatus === 'running'}
                className="w-4 h-4 accent-[#111a4a] cursor-pointer disabled:cursor-not-allowed"
              />
              <div>
                <p className="text-[13px] font-medium text-[#011821] leading-none">
                  Extraer PDFs / OCR
                  <span className="ml-1.5 text-[11px] text-[#d97706] font-normal">(lento)</span>
                </p>
                <p className="text-[11px] text-[#7c7f88] mt-0.5">Descarga y analiza documentos adjuntos</p>
              </div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={startIngesta}
              disabled={runStatus === 'running'}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#111a4a] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1d2a6e] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {runStatus === 'running' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingesta en curso...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Iniciar ingesta
                </>
              )}
            </button>
            {runStatus === 'running' && (
              <button
                onClick={cancelIngesta}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#fef2f2] text-[#dc2626] text-[13px] font-semibold rounded-lg border border-[#fecaca] hover:bg-[#fee2e2] transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status + stats + log */}
      <div
        className={cn('bg-white rounded-lg border mb-4 transition-colors', statusBorder[runStatus])}
        style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}
      >
        {/* Status bar */}
        <div className="px-5 py-4 border-b border-[#e3e4e8] flex items-center gap-3">
          <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', statusDot[runStatus])} />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-[#011821]">{statusText}</p>
          </div>
          {runStatus === 'ok' && <CheckCircle className="w-4 h-4 text-[#16a34a]" />}
          {runStatus === 'error' && <XCircle className="w-4 h-4 text-[#dc2626]" />}
          {runStatus === 'running' && <Clock className="w-4 h-4 text-[#d97706] animate-pulse" />}
        </div>

        <div className="p-5">
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {([
              { label: 'Nuevos',            value: stats?.nuevos,                            color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Actualizados',      value: stats?.actualizados,                      color: '#111a4a', bg: '#f0f1f8' },
              { label: 'Errores de proceso',value: stats?.errores,                            color: '#dc2626', bg: '#fef2f2' },
              { label: 'Duracion (ms)',     value: stats?.duracion_ms?.toLocaleString('es-CO'), color: '#d97706', bg: '#fffbeb' },
            ] as const).map((s) => (
              <div
                key={s.label}
                className="rounded-lg p-4 border border-[#e3e4e8]"
                style={{ backgroundColor: s.bg }}
              >
                <p
                  className="text-[22px] font-bold font-mono leading-none"
                  style={{ color: s.color }}
                >
                  {s.value ?? '-'}
                </p>
                <p className="text-[11px] text-[#7c7f88] mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Log terminal */}
          <div className="rounded-lg overflow-hidden border border-[#1e293b]">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0f172a] border-b border-[#1e293b]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
              </div>
              <p className="text-[11px] font-mono text-[#64748b] ml-2">logs del servidor</p>
              <Download className="w-3 h-3 text-[#64748b] ml-auto" />
            </div>
            <div
              ref={logBoxRef}
              className="bg-[#020b14] px-4 py-3 h-80 overflow-y-auto font-mono text-[11px] leading-relaxed"
            >
              {logs.map((line) => (
                <div key={line.id} className={cn('py-0.5', levelClass(line.level))}>
                  <span className="text-[#334155] select-none">[{line.time}]</span>
                  {' '}
                  <span className="text-[#475569] text-[10px] uppercase w-8 inline-block">{line.level.slice(0, 4)}</span>
                  {' '}
                  <span>{line.message}</span>
                </div>
              ))}
              {runStatus === 'running' && (
                <div className="py-0.5 text-[#64748b] flex items-center gap-1">
                  <span className="inline-block w-2 h-3 bg-[#64748b] animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Execution history */}
      <div
        className="bg-white rounded-lg border border-[#e3e4e8]"
        style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 4px 0px' }}
      >
        <div className="px-5 py-4 border-b border-[#e3e4e8]">
          <h3 className="text-[14px] font-semibold text-[#011821]">Historial de ejecuciones</h3>
          <p className="text-[11px] text-[#7c7f88] mt-0.5">Registro de esta sesion</p>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 gap-1">
            <p className="text-[13px] text-[#7c7f88]">Sin ejecuciones en esta sesion</p>
            <p className="text-[11px] text-[#7c7f88]">Inicia una ingesta para ver el historial</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e3e4e8]">
                  {['#', 'Hora', 'Nuevos', 'Errores', 'Duracion', 'PDFs', 'Estado'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[11px] font-semibold text-[#7c7f88] uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr
                    key={row.n}
                    className="border-b border-[#f6f6f8] hover:bg-[#f6f6f8] transition-colors last:border-0"
                  >
                    <td className="px-4 py-3 text-[12px] font-mono text-[#7c7f88]">{row.n}</td>
                    <td className="px-4 py-3 text-[12px] text-[#232730]">{row.hora}</td>
                    <td className="px-4 py-3 text-[12px] font-mono font-semibold text-[#16a34a]">{row.nuevos}</td>
                    <td className="px-4 py-3 text-[12px] font-mono font-semibold text-[#dc2626]">{row.errores}</td>
                    <td className="px-4 py-3 text-[12px] font-mono text-[#232730]">
                      {row.duracion_ms.toLocaleString('es-CO')} ms
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#7c7f88]">{row.pdfs ? 'Si' : '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                          row.ok
                            ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]'
                            : 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]'
                        )}
                      >
                        {row.ok ? 'OK' : 'Error'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
