'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  Map,
  BellRing,
  FileText,
  ShieldAlert,
  ChevronRight,
  Activity,
  DatabaseZap,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Visión general y KPIs',
  },
  {
    label: 'Búsqueda Semántica',
    href: '/busqueda',
    icon: Search,
    description: 'Búsqueda con IA y filtros',
  },
  {
    label: 'Mapa de Riesgo',
    href: '/mapa',
    icon: Map,
    description: 'Calor por entidad/región',
  },
  {
    label: 'Alertas',
    href: '/alertas',
    icon: BellRing,
    description: 'Tiempo real via WebSocket',
    badge: 3,
  },
  {
    label: 'Contratos',
    href: '/contratos',
    icon: FileText,
    description: 'Detalle y reportes PDF',
  },
  {
    label: 'Ingesta SECOP II',
    href: '/ingesta',
    icon: DatabaseZap,
    description: 'Descarga y analisis de contratos',
  },
]

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen w-64 bg-white border-r border-[#e3e4e8] flex flex-col z-40',
        'transition-transform duration-300 ease-in-out',
        // Mobile: hidden by default, visible when open
        open ? 'translate-x-0' : '-translate-x-full',
        // Desktop: always visible
        'md:translate-x-0',
      )}
    >
      {/* Logo + close button (mobile) */}
      <div className="px-6 py-5 border-b border-[#e3e4e8]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#111a4a] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#011821] tracking-tight leading-none">GobIA Auditor</p>
            <p className="text-[10px] text-[#7c7f88] mt-0.5 font-mono">SECOP II · v1.0</p>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-[#f6f6f8] transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4 text-[#7c7f88]" />
          </button>
        </div>
      </div>

      {/* Live status */}
      <div className="px-4 py-3 border-b border-[#e3e4e8]">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#f0fdf4] rounded-lg border border-[#bbf7d0]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#44b48b] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#44b48b]" />
          </span>
          <span className="text-[11px] font-medium text-[#16a34a]">Sistema activo</span>
          <Activity className="w-3 h-3 text-[#44b48b] ml-auto" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-semibold text-[#7c7f88] uppercase tracking-widest px-3 mb-3">Módulos</p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group',
                    isActive
                      ? 'bg-[#111a4a] text-white'
                      : 'text-[#232730] hover:bg-[#f6f6f8] hover:text-[#011821]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0',
                      isActive ? 'text-white' : 'text-[#7c7f88] group-hover:text-[#111a4a]'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[13px] font-medium leading-none', isActive ? 'text-white' : 'text-[#011821]')}>
                      {item.label}
                    </p>
                    <p className={cn('text-[10px] mt-0.5 truncate', isActive ? 'text-white/60' : 'text-[#7c7f88]')}>
                      {item.description}
                    </p>
                  </div>
                  {item.badge && (
                    <span className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                      isActive ? 'bg-white/20 text-white' : 'bg-[#dc2626] text-white'
                    )}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3 h-3 text-white/60" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 12 Indicadores quick reference */}
      <div className="px-4 pb-4">
        <div className="p-3 bg-[#f6f6f8] rounded-lg border border-[#e3e4e8]">
          <p className="text-[10px] font-semibold text-[#7c7f88] uppercase tracking-widest mb-2">Motor de Scoring</p>
          <p className="text-[11px] text-[#232730] leading-relaxed">12 indicadores ponderados + factor LLM ajustable ±20%</p>
          <div className="flex gap-1 mt-2">
            <span className="text-[10px] px-1.5 py-0.5 bg-[#fef2f2] text-[#dc2626] rounded border border-[#fecaca] font-mono">≥70 Alto</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-[#fffbeb] text-[#d97706] rounded border border-[#fde68a] font-mono">40-69 Medio</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-[#f0fdf4] text-[#16a34a] rounded border border-[#bbf7d0] font-mono">&lt;40 Bajo</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
