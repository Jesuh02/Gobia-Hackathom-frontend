'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { listAlertas, mapAlertTipo, type ApiAlert } from '@/lib/api'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ExternalLink,
  Info,
  Filter,
  RefreshCw,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Alerta {
  id: string
  timestamp: string
  tipo: 'critica' | 'advertencia' | 'info'
  titulo: string
  descripcion: string
  contrato_id: string
  nivel_riesgo: string
  leida: boolean
}

function formatTimeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'Hace unos segundos'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
  return `Hace ${Math.floor(diff / 86400)} d`
}

const ALERT_CONFIG = {
  critica: {
    icon: AlertTriangle,
    bg: '#fef2f2',
    border: '#fecaca',
    text: '#dc2626',
    badge: 'bg-[#dc2626] text-white',
    label: 'Critica',
  },
  advertencia: {
    icon: Zap,
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#d97706',
    badge: 'bg-[#f59e0b] text-white',
    label: 'Advertencia',
  },
  info: {
    icon: Info,
    bg: '#f0f8ff',
    border: '#bae6fd',
    text: '#0284c7',
    badge: 'bg-[#0284c7] text-white',
    label: 'Info',
  },
}

function AlertCard({ alerta, onRead }: { alerta: Alerta; onRead: (id: string) => void }) {
  const cfg = ALERT_CONFIG[alerta.tipo]
  const Icon = cfg.icon

  return (
    <div
      className={cn(
        'bg-white rounded-lg border p-4 transition-all',
        !alerta.leida && 'shadow-sm'
      )}
      style={{
        borderColor: !alerta.leida ? cfg.border : '#e3e4e8',
        borderLeftWidth: !alerta.leida ? 3 : 1,
        borderLeftColor: !alerta.leida ? cfg.text : '#e3e4e8',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          <Icon className="w-4 h-4" style={{ color: cfg.text }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', cfg.badge)}>
              {cfg.label}
            </span>
            {!alerta.leida && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" title="No leida" />
            )}
          </div>
          <p className="text-[13px] font-semibold text-[#011821] mb-1">{alerta.titulo}</p>
          <p className="text-[12px] text-[#7c7f88] leading-relaxed">{alerta.descripcion}</p>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3 text-[11px] text-[#7c7f88]">
              <span>{formatTimeAgo(alerta.timestamp)}</span>
            </div>
            <div className="flex items-center gap-2">
              {alerta.contrato_id && (
                <Link
                  href={`/contratos/${alerta.contrato_id}`}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#111a4a] hover:text-[#ec652b] transition-colors"
                >
                  Ver contrato <ExternalLink className="w-3 h-3" />
                </Link>
              )}
              {!alerta.leida && (
                <button
                  onClick={() => onRead(alerta.id)}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#7c7f88] hover:text-[#111a4a] transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  Marcar leida
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function mapApiAlert(a: ApiAlert): Alerta {
  return {
    id: String(a.id),
    timestamp: a.fecha_creacion ?? new Date().toISOString(),
    tipo: mapAlertTipo(a.nivel_riesgo),
    titulo: a.titulo,
    descripcion: a.descripcion,
    contrato_id: String(a.contrato_id),
    nivel_riesgo: a.nivel_riesgo,
    leida: a.resuelta,
  }
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'todas' | 'critica' | 'advertencia' | 'info' | 'no_leidas'>('todas')

  const fetchAlerts = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const res = await listAlertas({ page: 1, page_size: 200 })
      setAlerts(res.items.map(mapApiAlert))
      setApiError(null)
      setLastRefresh(new Date().toLocaleTimeString('es-CO'))
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Error al cargar alertas')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Auto-refresh every 30 seconds to pick up new DB alerts
  useEffect(() => {
    const interval = setInterval(() => fetchAlerts(), 30_000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  const markRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, leida: true } : a)))
  }

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, leida: true })))
  }

  const filtered = alerts.filter((a) => {
    if (filter === 'todas') return true
    if (filter === 'no_leidas') return !a.leida
    return a.tipo === filter
  })

  const unread = alerts.filter((a) => !a.leida).length
  const critical = alerts.filter((a) => a.tipo === 'critica').length
  const warning = alerts.filter((a) => a.tipo === 'advertencia').length

  return (
    <AppShell
      title="Panel de Alertas"
      subtitle="Monitoreo de contratos con señales de riesgo — datos en tiempo real de la base de datos"
    >
      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-3 mb-4 px-5 py-4 bg-white rounded-lg border border-[#e3e4e8]">
          <div className="w-3 h-3 border-2 border-[#111a4a]/30 border-t-[#111a4a] rounded-full animate-spin" />
          <p className="text-[13px] text-[#7c7f88]">Cargando alertas desde el servidor...</p>
        </div>
      )}

      {/* Error state */}
      {apiError && (
        <div className="mb-4 px-5 py-4 bg-[#fef2f2] rounded-lg border border-[#fecaca]">
          <p className="text-[12px] font-semibold text-[#dc2626]">Error de conexion con el backend</p>
          <p className="text-[11px] text-[#7c7f88] mt-0.5">{apiError}</p>
        </div>
      )}

      {/* Status bar */}
      <div className="rounded-lg border border-[#e3e4e8] bg-white px-5 py-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#44b48b] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#44b48b]" />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-[#16a34a]">Conectado a la base de datos</p>
            <p className="text-[11px] text-[#7c7f88]">
              Supabase · {alerts.length} alertas cargadas
              {lastRefresh && ` · Ultima actualizacion: ${lastRefresh}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchAlerts(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold bg-[#111a4a] text-white rounded-lg hover:bg-[#1d2a6e] disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total alertas', value: alerts.length, color: '#111a4a', bg: '#f0f1f8' },
          { label: 'No leídas', value: unread, color: '#ec652b', bg: '#fff7f3' },
          { label: 'Críticas', value: critical, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Advertencias', value: warning, color: '#d97706', bg: '#fffbeb' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-[#e3e4e8] p-4">
            <p className="text-[22px] font-bold font-mono" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-[11px] text-[#7c7f88] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-[#7c7f88] mr-1" />
          {[
            { key: 'todas', label: 'Todas' },
            { key: 'no_leidas', label: `No leídas (${unread})` },
            { key: 'critica', label: 'Críticas' },
            { key: 'advertencia', label: 'Advertencias' },
            { key: 'info', label: 'Info' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={cn(
                'px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all',
                filter === key
                  ? 'bg-[#111a4a] text-white'
                  : 'bg-white text-[#232730] border border-[#e3e4e8] hover:bg-[#f6f6f8]'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#111a4a] hover:text-[#ec652b] transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 bg-white rounded-lg border border-[#e3e4e8]">
            <Bell className="w-6 h-6 text-[#e3e4e8] mb-2" />
            <p className="text-[13px] text-[#7c7f88]">No hay alertas en esta categoria</p>
          </div>
        ) : (
          filtered.map((alerta) => (
            <AlertCard key={alerta.id} alerta={alerta} onRead={markRead} />
          ))
        )}
      </div>
    </AppShell>
  )
}
