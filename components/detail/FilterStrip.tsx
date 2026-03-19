'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'

interface Props {
  totalAccounts: number
  totalEscalations: number
  owners: string[]
}

const SORT_OPTIONS = [
  { value: 'score_desc', label: 'Score ↓' },
  { value: 'age_desc', label: 'Age ↓' },
  { value: 'age_asc', label: 'Age ↑' },
  { value: 'account_asc', label: 'Account A→Z' },
] as const

const selectStyle = {
  fontWeight: 400,
  fontSize: 12,
  padding: '6px 10px',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  backgroundColor: 'white',
  color: '#111827',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  cursor: 'pointer',
}

const labelStyle = {
  fontWeight: 500,
  fontSize: 10,
  color: '#9CA3AF',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  fontFamily: 'Inter, sans-serif',
  display: 'block',
  marginBottom: 4,
}

export default function FilterStrip({ totalAccounts, totalEscalations, owners }: Props) {
  const store = useAppStore()
  const [searchInput, setSearchInput] = useState(store.search || '')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      store.setFilter('search', searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback((key: Parameters<typeof store.setFilter>[0], value: string) => {
    store.setFilter(key, value === 'All' ? null : value)
  }, [store])

  return (
    <>
      <div
        className="w-full flex items-end gap-3 flex-wrap px-6 py-3 border-b"
        style={{ backgroundColor: '#F9FAFB', borderBottomColor: '#E5E7EB' }}
      >
        {/* Priority */}
        <div>
          <label style={labelStyle}>Priority</label>
          <select
            style={selectStyle}
            value={store.priority || 'All'}
            onChange={e => handleSelect('priority', e.target.value)}
          >
            {['All', 'High', 'Medium', 'Low'].map(v => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label style={labelStyle}>Status</label>
          <select
            style={selectStyle}
            value={store.status || 'All'}
            onChange={e => handleSelect('status', e.target.value)}
          >
            {['All', 'Blocked', 'Open', 'In Progress', 'Closed'].map(v => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Channel */}
        <div>
          <label style={labelStyle}>Channel</label>
          <select
            style={selectStyle}
            value={store.channel || 'All'}
            onChange={e => handleSelect('channel', e.target.value)}
          >
            {['All', 'WhatsApp', 'Slack', 'Email'].map(v => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Tier */}
        <div>
          <label style={labelStyle}>Account Tier</label>
          <select
            style={selectStyle}
            value={store.tier || 'All'}
            onChange={e => handleSelect('tier', e.target.value)}
          >
            {['All', 'Enterprise', 'Mid-Market', 'SMB'].map(v => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Owner */}
        <div>
          <label style={labelStyle}>Owner</label>
          <select
            style={selectStyle}
            value={store.owner || 'All'}
            onChange={e => handleSelect('owner', e.target.value)}
          >
            <option>All</option>
            {owners.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 176 }}>
          <label style={labelStyle}>Search</label>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Account, summary, issue type..."
            style={{
              ...selectStyle,
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Sort tabs */}
        <div className="ml-auto flex gap-1 items-end pb-0.5">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => store.setFilter('sortBy', opt.value)}
              style={{
                fontWeight: store.sortBy === opt.value ? 500 : 400,
                fontSize: 12,
                padding: '4px 12px',
                borderRadius: 20,
                border: store.sortBy === opt.value ? 'none' : '1px solid #E5E7EB',
                backgroundColor: store.sortBy === opt.value ? '#111827' : 'transparent',
                color: store.sortBy === opt.value ? 'white' : '#6B7280',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results row */}
      <div
        className="px-6 py-2 border-b"
        style={{ backgroundColor: 'white', borderBottomColor: '#E5E7EB' }}
      >
        <span style={{ fontWeight: 400, fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
          {totalAccounts.toLocaleString()} accounts · {totalEscalations.toLocaleString()} escalations
        </span>
      </div>
    </>
  )
}
