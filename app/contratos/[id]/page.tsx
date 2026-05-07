import { Suspense } from 'react'
import ContratoDetailClient from './ContratoDetailClient'

export function generateStaticParams() {
  return [{ id: '_' }]
}

export default function ContratoDetailPage() {
  return (
    <Suspense>
      <ContratoDetailClient />
    </Suspense>
  )
}
