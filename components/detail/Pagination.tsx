'use client'

import { useAppStore } from '@/lib/store'

interface Props {
  totalPages: number
}

export default function Pagination({ totalPages }: Props) {
  const { page, setPage } = useAppStore()

  if (totalPages <= 1) return null

  return (
    <div className="flex justify-between items-center px-6 py-4">
      <span style={{ fontWeight: 400, fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          style={{
            fontWeight: 400,
            fontSize: 12,
            padding: '6px 12px',
            border: '1px solid #E5E7EB',
            color: '#6B7280',
            borderRadius: 8,
            backgroundColor: 'transparent',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            opacity: page <= 1 ? 0.4 : 1,
            fontFamily: 'Inter, sans-serif',
            transition: 'background-color 150ms',
          }}
          onMouseEnter={e => {
            if (page > 1) (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
          }}
        >
          Prev
        </button>

        <span
          style={{
            fontWeight: 500,
            fontSize: 12,
            padding: '6px 12px',
            backgroundColor: '#111827',
            color: 'white',
            borderRadius: 8,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {page}
        </span>

        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          style={{
            fontWeight: 400,
            fontSize: 12,
            padding: '6px 12px',
            border: '1px solid #E5E7EB',
            color: '#6B7280',
            borderRadius: 8,
            backgroundColor: 'transparent',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            opacity: page >= totalPages ? 0.4 : 1,
            fontFamily: 'Inter, sans-serif',
            transition: 'background-color 150ms',
          }}
          onMouseEnter={e => {
            if (page < totalPages) (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}
