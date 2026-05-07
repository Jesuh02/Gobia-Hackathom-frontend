import { AppShell } from '@/components/layout/AppShell'
import { KPICards } from '@/components/dashboard/KPICards'
import {
  RiskDistributionChart,
  RiskTrendChart,
  IndicatorRadarChart,
  TopEntidadesChart,
} from '@/components/dashboard/RiskCharts'
import { ContractsTable } from '@/components/dashboard/ContractsTable'

export default function DashboardPage() {
  return (
    <AppShell
      title="Dashboard — Visión General"
      subtitle="Análisis de riesgo en contratos públicos SECOP II · Colombia 2024"
    >
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-lg bg-[#111a4a] px-6 py-5 mb-6">
        {/* Dotted grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #88deeb 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#88deeb] uppercase tracking-widest mb-1">GobIA Auditor · Hackathon 2025</p>
            <h2 className="text-[22px] font-semibold text-white tracking-tight leading-tight">
              Detección de Opacidad en Contratos Públicos
            </h2>
            <p className="text-[13px] text-white/60 mt-1">
              12 indicadores de riesgo · embeddings semánticos · agente LLM ReAct
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-6 text-center">
            <div>
              <p className="text-[28px] font-bold font-mono text-white leading-none">94.3%</p>
              <p className="text-[11px] text-white/50 mt-1">Precisión</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-[28px] font-bold font-mono text-[#ec652b] leading-none">2.8s</p>
              <p className="text-[11px] text-white/50 mt-1">Por contrato</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-[28px] font-bold font-mono text-[#88deeb] leading-none">12</p>
              <p className="text-[11px] text-white/50 mt-1">Indicadores</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <KPICards />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        <RiskDistributionChart />
        <RiskTrendChart />
        <IndicatorRadarChart />
        <TopEntidadesChart />
      </div>

      {/* Contracts table */}
      <div className="mt-6">
        <ContractsTable />
      </div>

      {/* Footer note */}
      <div className="mt-6 flex items-center gap-2 text-[11px] text-[#7c7f88]">
        <span className="font-mono">Fuente: SECOP II · datos.gov.co</span>
        <span>·</span>
        <span>Análisis generado por agente LLM (Qwen3.6 Plus via OpenRouter)</span>
        <span>·</span>
        <span>Score final = Σ(indicador × peso) × factor_LLM</span>
      </div>
    </AppShell>
  )
}
