'use client'

import { useAppStore } from '@/lib/store'

export default function EmptyState() {
  const { clearAllFilters } = useAppStore()

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ marginTop: 64, textAlign: 'center' }}
    >
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" rx="40" fill="#EEF2FF" />
        <path
          d="M20 28C20 25.8 21.8 24 24 24H56C58.2 24 60 25.8 60 28V48C60 50.2 58.2 52 56 52H44L40 56L36 52H24C21.8 52 20 50.2 20 48V28Z"
          fill="white"
          stroke="#C7D2FE"
          strokeWidth="1.5"
        />
        <path d="M40 35V42" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
        <circle cx="40" cy="46" r="1.5" fill="#4F46E5" />
        <circle cx="31" cy="38" r="2" fill="#E5E7EB" />
        <circle cx="49" cy="38" r="2" fill="#E5E7EB" />
      </svg>

      <h3
        style={{
          fontWeight: 500,
          fontSize: 16,
          color: '#111827',
          fontFamily: 'Inter, sans-serif',
          marginTop: 16,
          marginBottom: 6,
        }}
      >
        No escalations match your filters
      </h3>
      <p
        style={{
          fontWeight: 400,
          fontSize: 14,
          color: '#6B7280',
          fontFamily: 'Inter, sans-serif',
          marginBottom: 20,
        }}
      >
        Try adjusting or clearing your filters
      </p>
      <button
        onClick={clearAllFilters}
        style={{
          fontWeight: 500,
          fontSize: 14,
          padding: '8px 20px',
          backgroundColor: '#4F46E5',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Clear filters
      </button>
    </div>
  )
}
