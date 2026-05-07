'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { listContratos, listAlertas } from '@/lib/api'

interface KPIData {
  totalContratos: number | null
  contratosAltoRiesgo: number | null
  valorTotalAltoRiesgo: number | null
  totalAlertas: number | null
}

export function KPICards() {
  const [data, setData] = useState<KPIData>({
    totalContratos: null,
    contratosAltoRiesgo: null,
    valorTotalAltoRiesgo: null,
    totalAlertas: null,
  })

  useEffect(() => {
    async function load() {
      try {
        const [all, altos, alertas] = await Promise.all([
          listContratos({ page: 1, page_size: 1 }),
          listContratos({ nivel_riesgo: 'ALTO', page: 1, page_size: 100 }),
          listAlertas({ page: 1, page_size: 1 }),
        ])

        const valorTotal = altos.items.reduce((acc, c) => {
          const v = typeof c.monto_total === 'string' ? parseFloat(c.monto_total) : Number(c.monto_total ?? 0)
          return acc + (isNaN(v) ? 0 : v)
        }, 0)

        setData({
          totalContratos: all.total,
          contratosAltoRiesgo: altos.total,
          valorTotalAltoRiesgo: valorTotal,
          totalAlertas: alertas.total,
        })
      } catch (e) {
        console.error('KPICards error', e)
      }
    }
    load()
  }, [])

  const fmt = (n: number | null) => n === null ? '...' : n.toLocaleString('es-CO')
  const fmtCOP = (n: number | null) =>
    n === null
      ? '...'
      : n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{fmt(data.totalContratos)}</div>
          <p className="text-xs text-muted-foreground">En base de datos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alto Riesgo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{fmt(data.contratosAltoRiesgo)}</div>
          <p className="text-xs text-muted-foreground">Contratos ALTO nivel de riesgo</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor en Riesgo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{fmtCOP(data.valorTotalAltoRiesgo)}</div>
          <p className="text-xs text-muted-foreground">Contratos ALTO riesgo</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">{fmt(data.totalAlertas)}</div>
          <p className="text-xs text-muted-foreground">Total en sistema</p>
        </CardContent>
      </Card>
    </div>
  )
}
