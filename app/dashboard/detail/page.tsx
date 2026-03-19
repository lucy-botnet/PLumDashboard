'use client'

import { Suspense } from 'react'
import DetailPageContent from './DetailPageContent'

export default function DetailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }} />}>
      <DetailPageContent />
    </Suspense>
  )
}
