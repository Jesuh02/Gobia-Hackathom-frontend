// GobIA Auditor — Mock Data (simulates SECOP II API responses)

export type RiskLevel = 'alto' | 'medio' | 'bajo'

export interface Indicator {
  id: number
  nombre: string
  peso: number
  activo: boolean
  descripcion: string
}

export interface RedFlag {
  indicador: string
  descripcion: string
  peso: number
}

export interface Contrato {
  id: string
  numero: string
  objeto: string
  entidad: string
  proveedor: string
  nit_proveedor: string
  modalidad: string
  sector: string
  region: string
  departamento: string
  valor: number
  fecha_firma: string
  fecha_inicio: string
  fecha_fin: string
  plazo_dias: number
  score_riesgo: number
  nivel_riesgo: RiskLevel
  red_flags: RedFlag[]
  factor_llm: number
  justificacion_agente: string
  similares_coseno: number
  estado: 'activo' | 'terminado' | 'suspendido'
  adiciones: number
}

export interface Alerta {
  id: string
  timestamp: string
  tipo: 'critica' | 'advertencia' | 'info'
  titulo: string
  descripcion: string
  contrato_id: string
  contrato_objeto: string
  entidad: string
  score: number
  leida: boolean
}

export interface HeatmapCell {
  entidad: string
  sector: string
  score_promedio: number
  total_contratos: number
  valor_total: number
}

// ─────────────────────────────────────────────
// CONTRATOS MOCK
// ─────────────────────────────────────────────
export const CONTRATOS: Contrato[] = [
  {
    id: 'CO-2024-001',
    numero: 'CONT-2024-00892',
    objeto: 'Consultoría para la implementación de sistemas de información en gestión documental',
    entidad: 'Ministerio de Hacienda y Crédito Público',
    proveedor: 'TechSoluciones SAS',
    nit_proveedor: '900.234.567-1',
    modalidad: 'Contratación Directa',
    sector: 'TI y Consultoría',
    region: 'Bogotá D.C.',
    departamento: 'Cundinamarca',
    valor: 1_850_000_000,
    fecha_firma: '2024-03-15',
    fecha_inicio: '2024-03-20',
    fecha_fin: '2024-04-10',
    plazo_dias: 21,
    score_riesgo: 82,
    nivel_riesgo: 'alto',
    red_flags: [
      { indicador: 'Proceso abreviado sin justificación', descripcion: 'Licitación convertida a contratación directa sin soporte legal', peso: 15 },
      { indicador: 'Proveedor único recurrente', descripcion: 'Mismo proveedor recibió 5 contratos en los últimos 12 meses', peso: 12 },
      { indicador: 'Plazo inusualmente corto', descripcion: 'Plazo de 21 días para consultoría compleja de sistemas', peso: 8 },
      { indicador: 'Anomalía semántica', descripcion: 'Similitud coseno 0.31 — objeto atípico respecto al cluster de TI', peso: 3 },
    ],
    factor_llm: 1.18,
    justificacion_agente: 'El contrato presenta múltiples señales de alerta que sugieren irregularidades. La conversión de licitación a contratación directa sin justificación legal clara, combinada con el historial del proveedor (5 contratos previos con la misma entidad por $4.200M en 12 meses), configura un patrón de favorecimiento. El plazo de 21 días para un sistema de gestión documental institucional es técnicamente inviable. La redacción del objeto usa términos vagos que dificultan la verificación de cumplimiento.',
    similares_coseno: 0.31,
    estado: 'activo',
    adiciones: 0,
  },
  {
    id: 'CO-2024-002',
    numero: 'CONT-2024-01203',
    objeto: 'Suministro de elementos de papelería y útiles de oficina para las dependencias del municipio',
    entidad: 'Alcaldía de Cartagena de Indias',
    proveedor: 'Distribuciones El Caribe Ltda',
    nit_proveedor: '800.112.334-5',
    modalidad: 'Mínima Cuantía',
    sector: 'Suministros',
    region: 'Caribe',
    departamento: 'Bolívar',
    valor: 87_500_000,
    fecha_firma: '2024-06-01',
    fecha_inicio: '2024-06-05',
    fecha_fin: '2024-12-31',
    plazo_dias: 209,
    score_riesgo: 31,
    nivel_riesgo: 'bajo',
    red_flags: [],
    factor_llm: 0.95,
    justificacion_agente: 'Contrato de suministro estándar con objeto claro, proveedor con trayectoria verificable y modalidad adecuada al monto. No se detectan señales de alerta significativas.',
    similares_coseno: 0.87,
    estado: 'activo',
    adiciones: 0,
  },
  {
    id: 'CO-2024-003',
    numero: 'CONT-2024-00654',
    objeto: 'Prestación de servicios de mantenimiento vial y obra pública en zona rural',
    entidad: 'Gobernación del Meta',
    proveedor: 'Constructora Llanos Unidos SAS',
    nit_proveedor: '900.876.123-8',
    modalidad: 'Licitación Pública',
    sector: 'Infraestructura',
    region: 'Orinoquía',
    departamento: 'Meta',
    valor: 12_300_000_000,
    fecha_firma: '2024-01-28',
    fecha_inicio: '2024-02-15',
    fecha_fin: '2024-08-15',
    plazo_dias: 182,
    score_riesgo: 67,
    nivel_riesgo: 'medio',
    red_flags: [
      { indicador: 'Adiciones sucesivas al valor inicial', descripcion: 'Se han registrado 2 adiciones por $3.800M (31% del valor original)', peso: 12 },
      { indicador: 'Concentración geográfica', descripcion: 'Proveedor sin historial en obras viales del Meta', peso: 8 },
      { indicador: 'Monto cercano a umbral', descripcion: 'Valor inicial $11.980M, cerca del umbral de selección pública', peso: 7 },
    ],
    factor_llm: 1.05,
    justificacion_agente: 'Las adiciones representan el 31% del valor original, configurando una señal de riesgo medio. El proveedor tiene experiencia en construcción civil pero limitada en vías rurales del Meta. Se recomienda revisión de los soportes técnicos de las adiciones.',
    similares_coseno: 0.62,
    estado: 'activo',
    adiciones: 3_800_000_000,
  },
  {
    id: 'CO-2024-004',
    numero: 'CONT-2024-00312',
    objeto: 'Contrato',
    entidad: 'INVIAS - Instituto Nacional de Vías',
    proveedor: 'Global Infraestructura Colombia SAS',
    nit_proveedor: '901.004.556-2',
    modalidad: 'Urgencia Manifiesta',
    sector: 'Infraestructura',
    region: 'Andina',
    departamento: 'Antioquia',
    valor: 4_200_000_000,
    fecha_firma: '2024-10-02',
    fecha_inicio: '2024-10-02',
    fecha_fin: '2024-11-15',
    plazo_dias: 44,
    score_riesgo: 91,
    nivel_riesgo: 'alto',
    red_flags: [
      { indicador: 'Urgencia manifiesta sin soporte', descripcion: 'No se encontró aval de superintendencia para la causal de urgencia', peso: 10 },
      { indicador: 'Objeto contractual genérico', descripcion: 'Objeto de solo 1 palabra — incumple mínimo de 50 palabras descriptivas', peso: 8 },
      { indicador: 'Proveedor registrado recientemente', descripcion: 'NIT con antigüedad de 3 meses al momento de la adjudicación', peso: 7 },
      { indicador: 'Proceso abreviado sin justificación', descripcion: 'Urgencia manifiesta aplicada sin documentación soporte', peso: 15 },
      { indicador: 'Ausencia de garantías', descripcion: 'Contrato superior a 50 SMLMV sin pólizas registradas', peso: 5 },
    ],
    factor_llm: 1.2,
    justificacion_agente: 'ALERTA CRÍTICA: Este contrato acumula el mayor número de señales de riesgo en la muestra analizada. El objeto de una sola palabra ("Contrato") viola todos los estándares de transparencia del SECOP II. La causal de urgencia manifiesta fue declarada sin soporte documental verificable. La empresa tiene 3 meses de existencia y ya recibe un contrato de $4.200M. La ausencia de garantías en un contrato de esta magnitud constituye una irregularidad grave. Se recomienda investigación inmediata por parte de la Contraloría.',
    similares_coseno: 0.12,
    estado: 'activo',
    adiciones: 0,
  },
  {
    id: 'CO-2024-005',
    numero: 'CONT-2024-02145',
    objeto: 'Servicios de alimentación escolar para instituciones educativas del municipio de Riohacha',
    entidad: 'Alcaldía de Riohacha',
    proveedor: 'Alimentos y Nutrición del Caribe SAS',
    nit_proveedor: '900.456.789-3',
    modalidad: 'Selección Abreviada',
    sector: 'Alimentación y Nutrición',
    region: 'Caribe',
    departamento: 'La Guajira',
    valor: 2_140_000_000,
    fecha_firma: '2024-04-10',
    fecha_inicio: '2024-04-15',
    fecha_fin: '2024-11-30',
    plazo_dias: 229,
    score_riesgo: 48,
    nivel_riesgo: 'medio',
    red_flags: [
      { indicador: 'Proveedor único recurrente', descripcion: 'Tercer contrato consecutivo con la misma empresa en el sector educativo', peso: 12 },
      { indicador: 'Concentración pre-electoral', descripcion: 'Contrato firmado 45 días antes de elecciones regionales', peso: 5 },
    ],
    factor_llm: 0.98,
    justificacion_agente: 'Contrato de alimentación escolar con objeto claro y valor razonable. Sin embargo, la recurrencia del proveedor y la proximidad a elecciones genera señales de riesgo medio que ameritan seguimiento.',
    similares_coseno: 0.74,
    estado: 'activo',
    adiciones: 0,
  },
  {
    id: 'CO-2024-006',
    numero: 'CONT-2024-00987',
    objeto: 'Adquisición de equipos de cómputo, servidores y licencias de software para modernización tecnológica',
    entidad: 'DNP - Departamento Nacional de Planeación',
    proveedor: 'Tecnosoluciones Avanzadas SAS',
    nit_proveedor: '900.987.654-1',
    modalidad: 'Contratación Directa',
    sector: 'TI y Consultoría',
    region: 'Bogotá D.C.',
    departamento: 'Cundinamarca',
    valor: 890_000_000,
    fecha_firma: '2024-07-22',
    fecha_inicio: '2024-07-25',
    fecha_fin: '2024-09-30',
    plazo_dias: 67,
    score_riesgo: 73,
    nivel_riesgo: 'alto',
    red_flags: [
      { indicador: 'Proceso abreviado sin justificación', descripcion: 'Compra de hardware por contratación directa sin proceso competitivo', peso: 15 },
      { indicador: 'Monto cercano a umbral', descripcion: 'Valor $890M, 4.8% por debajo del umbral de licitación obligatoria', peso: 7 },
      { indicador: 'Proveedor registrado recientemente', descripcion: 'Empresa con 4 meses de existencia al momento del contrato', peso: 7 },
    ],
    factor_llm: 1.1,
    justificacion_agente: 'El valor se sitúa deliberadamente por debajo del umbral de licitación pública, patrón conocido como "monto cercano al umbral". La empresa tiene apenas 4 meses de constituida. La compra de servidores por contratación directa requiere justificación técnica que no está visible en SECOP II.',
    similares_coseno: 0.55,
    estado: 'terminado',
    adiciones: 0,
  },
  {
    id: 'CO-2024-007',
    numero: 'CONT-2024-03312',
    objeto: 'Construcción del centro de salud nivel I en la vereda La Esperanza, municipio de Puerto Gaitán',
    entidad: 'Alcaldía de Puerto Gaitán',
    proveedor: 'Construimos Colombia SAS',
    nit_proveedor: '900.112.998-7',
    modalidad: 'Licitación Pública',
    sector: 'Salud e Infraestructura',
    region: 'Orinoquía',
    departamento: 'Meta',
    valor: 3_400_000_000,
    fecha_firma: '2024-02-14',
    fecha_inicio: '2024-03-01',
    fecha_fin: '2025-03-01',
    plazo_dias: 365,
    score_riesgo: 22,
    nivel_riesgo: 'bajo',
    red_flags: [],
    factor_llm: 0.88,
    justificacion_agente: 'Licitación pública bien documentada, con objeto descriptivo y claro, proveedor con historial en obras de infraestructura de salud. Plazo adecuado para la magnitud de la obra. Bajo riesgo de opacidad.',
    similares_coseno: 0.91,
    estado: 'activo',
    adiciones: 0,
  },
  {
    id: 'CO-2024-008',
    numero: 'CONT-2024-01789',
    objeto: 'Asesoría jurídica especializada en derecho administrativo y contratación estatal',
    entidad: 'ICBF - Instituto Colombiano de Bienestar Familiar',
    proveedor: 'Juridex Abogados Asociados',
    nit_proveedor: '900.334.112-4',
    modalidad: 'Contratación Directa',
    sector: 'Servicios Jurídicos',
    region: 'Bogotá D.C.',
    departamento: 'Cundinamarca',
    valor: 420_000_000,
    fecha_firma: '2024-09-05',
    fecha_inicio: '2024-09-10',
    fecha_fin: '2024-12-31',
    plazo_dias: 112,
    score_riesgo: 55,
    nivel_riesgo: 'medio',
    red_flags: [
      { indicador: 'Proveedor único recurrente', descripcion: 'Segundo contrato en 6 meses con la misma firma de abogados', peso: 12 },
      { indicador: 'Ausencia de garantías', descripcion: 'Contrato de servicios sin póliza de cumplimiento registrada', peso: 5 },
    ],
    factor_llm: 1.02,
    justificacion_agente: 'Servicios jurídicos con modalidad de contratación directa justificada por la naturaleza del servicio. Sin embargo, la recurrencia del mismo estudio de abogados y la ausencia de pólizas generan señales de riesgo moderado.',
    similares_coseno: 0.68,
    estado: 'activo',
    adiciones: 0,
  },
]

// ─────────────────────────────────────────────
// ALERTAS MOCK
// ─────────────────────────────────────────────
export const ALERTAS: Alerta[] = [
  {
    id: 'ALT-001',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    tipo: 'critica',
    titulo: 'Contrato con objeto de 1 palabra detectado',
    descripcion: 'INVIAS adjudicó contrato por $4.200M con objeto "Contrato". Score: 91/100.',
    contrato_id: 'CO-2024-004',
    contrato_objeto: 'Contrato',
    entidad: 'INVIAS',
    score: 91,
    leida: false,
  },
  {
    id: 'ALT-002',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    tipo: 'critica',
    titulo: 'Proveedor recurrente — posible favorecimiento',
    descripcion: 'TechSoluciones SAS recibió 5 contratos del Ministerio de Hacienda en 12 meses ($4.200M acumulados).',
    contrato_id: 'CO-2024-001',
    contrato_objeto: 'Consultoría para implementación de sistemas de información',
    entidad: 'Ministerio de Hacienda',
    score: 82,
    leida: false,
  },
  {
    id: 'ALT-003',
    timestamp: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
    tipo: 'advertencia',
    titulo: 'Adiciones superan 30% del valor original',
    descripcion: 'Gobernación del Meta: adiciones por $3.800M representan el 31% del valor inicial del contrato vial.',
    contrato_id: 'CO-2024-003',
    contrato_objeto: 'Mantenimiento vial y obra pública en zona rural',
    entidad: 'Gobernación del Meta',
    score: 67,
    leida: false,
  },
  {
    id: 'ALT-004',
    timestamp: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
    tipo: 'advertencia',
    titulo: 'Monto sospechosamente cercano al umbral',
    descripcion: 'DNP: contrato de $890M evita licitación pública al quedar 4.8% por debajo del umbral obligatorio.',
    contrato_id: 'CO-2024-006',
    contrato_objeto: 'Adquisición de equipos de cómputo',
    entidad: 'DNP',
    score: 73,
    leida: true,
  },
  {
    id: 'ALT-005',
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    tipo: 'info',
    titulo: 'Nuevo lote de contratos ingresado al sistema',
    descripcion: '234 contratos nuevos del SECOP II procesados. 3 con score alto, 12 con score medio.',
    contrato_id: '',
    contrato_objeto: '',
    entidad: 'Sistema',
    score: 0,
    leida: true,
  },
  {
    id: 'ALT-006',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    tipo: 'critica',
    titulo: 'Urgencia manifiesta sin soporte documental',
    descripcion: 'INVIAS declaró urgencia manifiesta sin aval de superintendencia verificado en SECOP II.',
    contrato_id: 'CO-2024-004',
    contrato_objeto: 'Contrato',
    entidad: 'INVIAS',
    score: 91,
    leida: true,
  },
]

// ─────────────────────────────────────────────
// HEATMAP DATA
// ─────────────────────────────────────────────
export const DEPARTAMENTOS = [
  'Cundinamarca', 'Antioquia', 'Valle del Cauca', 'Bolívar', 'Atlántico',
  'Santander', 'Córdoba', 'Nariño', 'Tolima', 'Cauca', 'Meta', 'La Guajira',
  'Magdalena', 'Cesar', 'Risaralda',
]

export const SECTORES = [
  'TI y Consultoría', 'Infraestructura', 'Suministros', 'Salud', 'Educación',
  'Servicios Jurídicos', 'Alimentación', 'Seguridad',
]

export function generateHeatmapData(): HeatmapCell[] {
  const data: HeatmapCell[] = []
  const scores: Record<string, number> = {
    'Cundinamarca-TI y Consultoría': 78,
    'Cundinamarca-Infraestructura': 45,
    'Cundinamarca-Suministros': 32,
    'Cundinamarca-Salud': 28,
    'Cundinamarca-Educación': 21,
    'Antioquia-TI y Consultoría': 65,
    'Antioquia-Infraestructura': 71,
    'Antioquia-Suministros': 38,
    'Antioquia-Salud': 55,
    'Antioquia-Educación': 44,
    'Bolívar-TI y Consultoría': 52,
    'Bolívar-Infraestructura': 48,
    'Bolívar-Suministros': 29,
    'Bolívar-Salud': 67,
    'Bolívar-Alimentación': 42,
    'Meta-Infraestructura': 69,
    'Meta-Salud': 38,
    'Meta-TI y Consultoría': 44,
    'La Guajira-Alimentación': 53,
    'La Guajira-Educación': 46,
    'La Guajira-Salud': 72,
    'Atlántico-TI y Consultoría': 61,
    'Atlántico-Infraestructura': 55,
  }

  for (const dep of DEPARTAMENTOS) {
    for (const sec of SECTORES) {
      const key = `${dep}-${sec}`
      const score = scores[key] ?? Math.floor(Math.random() * 70) + 10
      data.push({
        entidad: dep,
        sector: sec,
        score_promedio: score,
        total_contratos: Math.floor(Math.random() * 40) + 2,
        valor_total: Math.floor(Math.random() * 15_000_000_000) + 500_000_000,
      })
    }
  }
  return data
}

// ─────────────────────────────────────────────
// KPI STATS
// ─────────────────────────────────────────────
export const KPI_STATS = {
  total_contratos: 12_847,
  contratos_alto_riesgo: 342,
  contratos_medio_riesgo: 1_203,
  contratos_bajo_riesgo: 11_302,
  valor_total_analizado: 4_823_100_000_000,
  valor_alto_riesgo: 387_200_000_000,
  alertas_hoy: 23,
  tiempo_analisis_promedio: 2.8,
  precision_modelo: 94.3,
  contratos_nuevos_24h: 234,
}

// ─────────────────────────────────────────────
// RISK DISTRIBUTION FOR CHARTS
// ─────────────────────────────────────────────
export const RISK_DISTRIBUTION = [
  { score_range: '0-20', cantidad: 4230, label: 'Muy bajo' },
  { score_range: '21-40', cantidad: 7072, label: 'Bajo' },
  { score_range: '41-60', cantidad: 892, label: 'Medio' },
  { score_range: '61-80', cantidad: 311, label: 'Alto' },
  { score_range: '81-100', cantidad: 342, label: 'Crítico' },
]

export const RISK_TREND = [
  { mes: 'Ene', alto: 28, medio: 98, bajo: 874 },
  { mes: 'Feb', alto: 34, medio: 112, bajo: 901 },
  { mes: 'Mar', alto: 41, medio: 134, bajo: 987 },
  { mes: 'Abr', alto: 29, medio: 89, bajo: 1023 },
  { mes: 'May', alto: 55, medio: 178, bajo: 1102 },
  { mes: 'Jun', alto: 38, medio: 102, bajo: 934 },
  { mes: 'Jul', alto: 47, medio: 145, bajo: 1044 },
  { mes: 'Ago', alto: 62, medio: 189, bajo: 1203 },
  { mes: 'Sep', alto: 33, medio: 98, bajo: 978 },
  { mes: 'Oct', alto: 71, medio: 213, bajo: 1312 },
  { mes: 'Nov', alto: 58, medio: 167, bajo: 1098 },
  { mes: 'Dic', alto: 44, medio: 122, bajo: 876 },
]

export const INDICATOR_RADAR = [
  { indicador: 'Proceso abreviado', valor: 68 },
  { indicador: 'Proveedor único', valor: 54 },
  { indicador: 'Adiciones sucesivas', valor: 41 },
  { indicador: 'Urgencia manifiesta', valor: 29 },
  { indicador: 'Concentración geo', valor: 37 },
  { indicador: 'Plazo corto', valor: 45 },
  { indicador: 'Objeto ambiguo', valor: 61 },
  { indicador: 'Monto umbral', valor: 52 },
  { indicador: 'Proveedor nuevo', valor: 38 },
  { indicador: 'Sin garantías', valor: 23 },
  { indicador: 'Pre-electoral', valor: 31 },
  { indicador: 'Anomalía semántica', valor: 47 },
]

export const TOP_ENTIDADES_RIESGO = [
  { entidad: 'INVIAS', contratos: 48, score_promedio: 72, valor: 89_000_000_000 },
  { entidad: 'Min. Hacienda', contratos: 31, score_promedio: 68, valor: 45_000_000_000 },
  { entidad: 'DNP', contratos: 24, score_promedio: 65, valor: 28_000_000_000 },
  { entidad: 'Gob. Antioquia', contratos: 67, score_promedio: 61, valor: 123_000_000_000 },
  { entidad: 'Alcaldía Bogotá', contratos: 112, score_promedio: 58, valor: 234_000_000_000 },
]

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
export function formatCOP(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`
  return `$${value.toLocaleString('es-CO')}`
}

export function getRiskColor(score: number): string {
  if (score >= 70) return '#dc2626'
  if (score >= 40) return '#f59e0b'
  return '#44b48b'
}

export function getRiskBgColor(score: number): string {
  if (score >= 70) return '#fef2f2'
  if (score >= 40) return '#fffbeb'
  return '#f0fdf4'
}

export function getRiskLabel(score: number): string {
  if (score >= 70) return 'Alto'
  if (score >= 40) return 'Medio'
  return 'Bajo'
}

export function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  return `Hace ${Math.floor(hours / 24)}d`
}
