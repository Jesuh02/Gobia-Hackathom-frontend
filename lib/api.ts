/**
 * GobIA Auditor — Typed API client
 * Connects the Next.js frontend to the FastAPI backend.
 * All types mirror the Pydantic schemas defined in the backend.
 */

// En producción (Vercel) usamos ruta relativa para que el proxy rewrite de next.config.mjs
// envíe el request al backend server-side, evitando CORS.
// En desarrollo local apunta directo al backend.
const BASE_URL = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
  ? ''
  : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')
const PREFIX = '/api/v1'

// ─── Raw backend schemas ──────────────────────────────────────────────────────

export interface ApiContractSummary {
  id: string
  secop_id: string
  entidad_nombre: string
  proveedor_nombre: string
  objeto: string
  valor_inicial: string | number
  fecha_firma: string
  score_final: number | null
  nivel_riesgo: string | null
}

export interface ApiContractSchema {
  id: string
  secop_id: string
  entidad_id: string | null
  proveedor_id: string | null
  modalidad_id: number
  estado_id: number
  objeto: string
  numero_contrato: string | null
  valor_inicial: string | number
  fecha_firma: string
  fecha_inicio: string | null
  fecha_fin: string | null
  categoria_unspsc_id: number | null
  municipio_ejecucion_id: number | null
  json_raw: Record<string, unknown>
}

export interface ApiFieldAlert {
  code: string
  name: string
  severity: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  field: string
  detail: string
  score: number
}

export interface ApiIndicatorResult {
  code: string
  name: string
  weight: number
  score: number
  triggered: boolean
  detail: string
}

export interface ApiEvaluation {
  id: string | null
  contrato_id: string
  score_reglas: number
  score_llm: number | null
  factor_ajuste_llm: number | null
  score_final: number
  nivel_riesgo: string
  version_modelo: string
  fecha_evaluacion: string
  red_flags: string[]
  indicators: ApiIndicatorResult[]
  justification: string | null
}

export interface ApiAdicion {
  contrato_id: string
  numero_adicion: number
  valor_adicion: string | number
  fecha_adicion: string
  descripcion: string | null
}

export interface ApiGarantia {
  contrato_id: string
  tipo_garantia: string
  aseguradora: string | null
  valor_asegurado: string | number | null
  fecha_inicio: string | null
  fecha_fin: string | null
}

export interface ApiContractDetail {
  contrato: ApiContractSchema
  evaluacion: ApiEvaluation | null
  adiciones: ApiAdicion[]
  garantias: ApiGarantia[]
  field_alerts: ApiFieldAlert[]
  url_proceso_info: Record<string, unknown> | null
}

export interface ApiContractListResponse {
  items: ApiContractSummary[]
  total: number
  page: number
  page_size: number
}

export interface ApiAlert {
  id: string
  contrato_id: string
  evaluacion_id: string | null
  tipo_alerta: string
  titulo: string
  descripcion: string
  nivel_riesgo: string
  resuelta: boolean
  fecha_creacion: string | null
}

export interface ApiAlertsListResponse {
  items: ApiAlert[]
  total: number
  page: number
  page_size: number
}

export interface ApiSearchHit {
  contrato: ApiContractSummary
  similarity: number
}

export interface ApiSearchResponse {
  query: string
  hits: ApiSearchHit[]
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${PREFIX}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function listContratos(params?: {
  nivel_riesgo?: 'ALTO' | 'MEDIO' | 'BAJO'
  page?: number
  page_size?: number
}): Promise<ApiContractListResponse> {
  const q = new URLSearchParams()
  if (params?.nivel_riesgo) q.set('nivel_riesgo', params.nivel_riesgo)
  if (params?.page) q.set('page', String(params.page))
  if (params?.page_size) q.set('page_size', String(params.page_size))
  const qs = q.toString() ? `?${q}` : ''
  return apiFetch<ApiContractListResponse>(`/contratos${qs}`)
}

export async function getContrato(id: string): Promise<ApiContractDetail> {
  return apiFetch<ApiContractDetail>(`/contratos/${id}`)
}

export async function evaluarContrato(
  id: string,
  modalidad_codigo?: string,
  use_llm = true,
): Promise<{ evaluation_id: string }> {
  return apiFetch(`/contratos/${id}/evaluar`, {
    method: 'POST',
    body: JSON.stringify({ modalidad_codigo: modalidad_codigo ?? null, use_llm }),
  })
}

export async function listAlertas(params?: {
  page?: number
  page_size?: number
}): Promise<ApiAlertsListResponse> {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.page_size) q.set('page_size', String(params.page_size))
  const qs = q.toString() ? `?${q}` : ''
  return apiFetch<ApiAlertsListResponse>(`/alertas${qs}`)
}

export async function searchContratos(
  query: string,
  top_k = 20,
  threshold?: number,
): Promise<ApiSearchResponse> {
  return apiFetch<ApiSearchResponse>('/buscar', {
    method: 'POST',
    body: JSON.stringify({ query, top_k, ...(threshold != null ? { threshold } : {}) }),
  })
}

// ─── Shared display types ─────────────────────────────────────────────────────

export type FrontendRiskLevel = 'alto' | 'medio' | 'bajo'

/** Minimal contract shape consumed by ContractsTable and search results */
export interface TableContract {
  id: string
  numero: string
  objeto: string
  entidad: string
  proveedor: string
  valor: number
  modalidad: string
  score_riesgo: number
  nivel_riesgo: FrontendRiskLevel
  red_flags: { indicador: string; descripcion: string; peso: number }[]
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapNivelRiesgo(nivel: string | null | undefined): FrontendRiskLevel {
  const n = (nivel ?? '').trim().toUpperCase()
  if (n === 'ALTO' || n === 'CRITICA' || n === 'CRÍTICA') return 'alto'
  if (n === 'MEDIO' || n === 'MEDIA') return 'medio'
  return 'bajo'
}

export function mapAlertTipo(nivel_riesgo: string): 'critica' | 'advertencia' | 'info' {
  const n = nivel_riesgo.trim().toUpperCase()
  if (n === 'ALTO' || n === 'CRITICA' || n === 'CRÍTICA') return 'critica'
  if (n === 'MEDIO' || n === 'MEDIA') return 'advertencia'
  return 'info'
}

export function toNumber(v: string | number | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'number' ? v : parseFloat(String(v)) || 0
}

/** Map an ApiContractSummary → TableContract for list/table display */
export function summaryToTableContract(s: ApiContractSummary): TableContract {
  return {
    id: s.id,
    numero: s.secop_id,
    objeto: s.objeto,
    entidad: s.entidad_nombre,
    proveedor: s.proveedor_nombre,
    valor: toNumber(s.valor_inicial),
    modalidad: '—',
    score_riesgo: toNumber(s.score_final),
    nivel_riesgo: mapNivelRiesgo(s.nivel_riesgo),
    red_flags: [],
  }
}

/** Compute plazo in days between two ISO date strings */
export function computePlazo(inicio: string | null, fin: string | null): number {
  if (!inicio || !fin) return 0
  const ms = new Date(fin).getTime() - new Date(inicio).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

/** Format a number as abbreviated COP currency string */
export function formatCOP(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`
  return `$${value.toLocaleString('es-CO')}`
}
