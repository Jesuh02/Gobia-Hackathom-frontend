'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Search, SlidersHorizontal, X, Sparkles, ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { formatCOP, listContratos, searchContratos, mapNivelRiesgo, toNumber, type ApiSearchHit } from '@/lib/api'
import { cn } from '@/lib/utils'

const SUGGESTED_QUERIES = [
  'contratos de consultoría adjudicados directamente en 2024',
  'obras de infraestructura con urgencia manifiesta',
  'proveedores con múltiples contratos en Bogotá',
  'contratos con objeto ambiguo o genérico',
  'adquisición de tecnología por contratación directa',
]

function RiskBadge({ nivel, score }: { nivel: string; score: number }) {
  const mapped = mapNivelRiesgo(nivel)
  const config = {
    alto: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    medio: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    bajo: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  }[mapped]
  return (
    <span
      className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: config.bg, color: config.text, border: `1px solid ${config.border}` }}
    >
      {score > 0 ? `${score} · ` : ''}{mapped.charAt(0).toUpperCase() + mapped.slice(1)}
    </span>
  )
}

function ContractCard({ hit }: { hit: ApiSearchHit }) {
  const c = hit.contrato
  const nivel = mapNivelRiesgo(c.nivel_riesgo)
  const score = Math.round(toNumber(c.score_final))

  return (
    <div
      className="bg-white rounded-lg border border-[#e3e4e8] p-4 hover:border-[#111a4a] transition-all group"
      style={{ boxShadow: 'rgba(17, 26, 74, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.05) 0px 1px 3px 0px' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-[#7c7f88]">{c.secop_id}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-[#f0f1f8] text-[#111a4a] rounded font-mono border border-[#c7cae0]">
              cos: {hit.similarity.toFixed(3)}
            </span>
          </div>
          <h3 className="text-[13px] font-semibold text-[#011821] leading-snug line-clamp-2">{c.objeto}</h3>
        </div>
        <RiskBadge nivel={c.nivel_riesgo ?? ''} score={score} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] mb-3">
        <div>
          <span className="text-[#7c7f88]">Entidad:</span>{' '}
          <span className="text-[#232730] font-medium">{c.entidad_nombre}</span>
        </div>
        <div>
          <span className="text-[#7c7f88]">Proveedor:</span>{' '}
          <span className="text-[#232730] font-medium">{c.proveedor_nombre}</span>
        </div>
        <div>
          <span className="text-[#7c7f88]">Valor:</span>{' '}
          <span className="text-[#011821] font-mono font-semibold">{formatCOP(toNumber(c.valor_inicial))}</span>
        </div>
        <div>
          <span className="text-[#7c7f88]">Fecha firma:</span>{' '}
          <span className="text-[#232730]">{c.fecha_firma}</span>
        </div>
      </div>

      <Link
        href={`/contratos/${c.id}?entidad=${encodeURIComponent(c.entidad_nombre)}&proveedor=${encodeURIComponent(c.proveedor_nombre)}`}
        className="flex items-center gap-1 text-[11px] font-semibold text-[#111a4a] opacity-0 group-hover:opacity-100 hover:text-[#ec652b] transition-all"
      >
        Ver análisis completo <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}

export default function BusquedaPage() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [results, setResults] = useState<ApiSearchHit[]>([])
  const [totalContratos, setTotalContratos] = useState<number | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    listContratos({ page: 1, page_size: 1 })
      .then((res) => setTotalContratos(res.total))
      .catch(() => {})
  }, [])

  const [showFilters, setShowFilters] = useState(false)
  const [riesgoFilter, setRiesgoFilter] = useState<'Todos' | 'alto' | 'medio' | 'bajo'>('Todos')
  const inputRef = useRef<HTMLInputElement>(null)

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) return
      setSearching(true)
      setHasSearched(true)
      setSearchError(null)
      try {
        const res = await searchContratos(q, 20)
        setResults(res.hits)
      } catch (e) {
        setSearchError(e instanceof Error ? e.message : 'Error al buscar')
        setResults([])
      } finally {
        setSearching(false)
      }
    },
    []
  )

  const handleSuggest = (q: string) => {
    setQuery(q)
    runSearch(q)
  }

  const filteredResults = riesgoFilter === 'Todos'
    ? results
    : results.filter(r => mapNivelRiesgo(r.contrato.nivel_riesgo) === riesgoFilter)

  return (
    <AppShell
      title="Búsqueda Semántica"
      subtitle="Busca contratos con lenguaje natural — embeddings 384d + búsqueda vectorial ANN"
    >
      {/* Search bar */}
      <div className="bg-white rounded-xl border border-[#e3e4e8] p-6 mb-4" style={{ boxShadow: 'rgba(17, 26, 74, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.08) 0px 2px 8px 0px' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#111a4a] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#011821]">Búsqueda con IA</p>
            <p className="text-[11px] text-[#7c7f88]">
              Tu consulta se convierte en embedding vectorial y se compara con {' '}
              <span className="font-mono">{totalContratos !== null ? totalContratos.toLocaleString('es-CO') : '...'}</span> contratos analizados
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c7f88]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch(query)}
            placeholder="Ej: contratos de consultoría adjudicados directamente sin licitación en Bogotá..."
            className="w-full pl-11 pr-24 py-3.5 bg-[#f6f6f8] border border-[#e3e4e8] rounded-lg text-[13px] text-[#011821] placeholder:text-[#7c7f88] focus:outline-none focus:border-[#111a4a] focus:ring-2 focus:ring-[#111a4a]/10 transition-all"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setHasSearched(false) }}
              className="absolute right-20 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#e3e4e8] transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[#7c7f88]" />
            </button>
          )}
          <button
            onClick={() => runSearch(query)}
            disabled={searching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#111a4a] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1d2a6e] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {searching ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Buscando
              </span>
            ) : (
              'Buscar'
            )}
          </button>
        </div>

        {/* Suggested queries */}
        {!hasSearched && (
          <div className="mt-4">
            <p className="text-[11px] text-[#7c7f88] mb-2 font-medium">Consultas sugeridas:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggest(q)}
                  className="text-[11px] px-3 py-1.5 bg-[#f6f6f8] text-[#232730] rounded-full border border-[#e3e4e8] hover:border-[#111a4a] hover:text-[#111a4a] transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-[#e3e4e8] mb-4 overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#f6f6f8] transition-colors"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#7c7f88]" />
            <span className="text-[13px] font-semibold text-[#011821]">Filtrar por riesgo</span>
          </div>
          <ChevronDown className={cn('w-4 h-4 text-[#7c7f88] transition-transform', showFilters && 'rotate-180')} />
        </button>

        {showFilters && (
          <div className="px-5 pb-5 border-t border-[#f6f6f8]">
            <div className="flex gap-3 mt-4">
              {(['Todos', 'alto', 'medio', 'bajo'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setRiesgoFilter(opt)}
                  className={cn(
                    'px-4 py-2 text-[12px] font-semibold rounded-lg border transition-colors',
                    riesgoFilter === opt
                      ? 'bg-[#111a4a] text-white border-[#111a4a]'
                      : 'bg-[#f6f6f8] text-[#232730] border-[#e3e4e8] hover:bg-[#e3e4e8]'
                  )}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {hasSearched && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[14px] font-semibold text-[#011821]">
                {searching ? 'Buscando...' : `${filteredResults.length} contratos encontrados`}
              </p>
              {!searching && query && (
                <p className="text-[11px] text-[#7c7f88] mt-0.5">
                  Ordenados por similitud coseno vectorial · embedding paraphrase-multilingual-MiniLM-L12-v2
                </p>
              )}
            </div>
            {!searching && results.length > 0 && (
              <div className="flex gap-2 text-[11px]">
                <span className="px-2 py-1 bg-[#fef2f2] text-[#dc2626] rounded border border-[#fecaca] font-mono">
                  {results.filter(r => mapNivelRiesgo(r.contrato.nivel_riesgo) === 'alto').length} alto
                </span>
                <span className="px-2 py-1 bg-[#fffbeb] text-[#d97706] rounded border border-[#fde68a] font-mono">
                  {results.filter(r => mapNivelRiesgo(r.contrato.nivel_riesgo) === 'medio').length} medio
                </span>
                <span className="px-2 py-1 bg-[#f0fdf4] text-[#16a34a] rounded border border-[#bbf7d0] font-mono">
                  {results.filter(r => mapNivelRiesgo(r.contrato.nivel_riesgo) === 'bajo').length} bajo
                </span>
              </div>
            )}
          </div>

          {searchError && (
            <div className="mb-3 p-3 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-[12px] text-[#dc2626]">
              {searchError}
            </div>
          )}

          {searching ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-[#e3e4e8] border-t-[#111a4a] rounded-full animate-spin" />
                <p className="text-[12px] text-[#7c7f88]">Calculando similitud vectorial...</p>
              </div>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredResults.map((hit) => (
                <ContractCard key={hit.contrato.id} hit={hit} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 bg-white rounded-lg border border-[#e3e4e8]">
              <Search className="w-8 h-8 text-[#e3e4e8] mb-2" />
              <p className="text-[14px] font-medium text-[#232730]">Sin resultados</p>
              <p className="text-[12px] text-[#7c7f88] mt-1">Intenta con otros términos o ajusta los filtros</p>
            </div>
          )}
        </div>
      )}

      {!hasSearched && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Búsqueda vectorial', desc: 'Tu query se convierte en embedding 384d y se compara con todos los contratos por similitud coseno', color: '#111a4a' },
            { label: 'Filtros semánticos', desc: 'Combina búsqueda natural con filtros estructurados: modalidad, sector, región, rango de valor', color: '#ec652b' },
            { label: 'Score en tiempo real', desc: 'Cada resultado muestra el score de riesgo (0-100) calculado por el agente LLM + 12 indicadores', color: '#44b48b' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-lg border border-[#e3e4e8] p-5">
              <div className="w-2 h-2 rounded-full mb-3" style={{ backgroundColor: item.color }} />
              <p className="text-[13px] font-semibold text-[#011821] mb-1.5">{item.label}</p>
              <p className="text-[12px] text-[#7c7f88] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
