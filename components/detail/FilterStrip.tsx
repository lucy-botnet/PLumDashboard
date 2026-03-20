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
  { value: 'account_asc', label: 'A→Z' },
] as const

const selectStyle: React.CSSProperties = {
  fontWeight: 400,
  fontSize: 12,
  padding: '7px 10px',
  border: '1px solid #2D3561',
  borderRadius: 8,
  backgroundColor: '#1A1F3A',
  color: '#F1F5F9',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  cursor: 'pointer',
  transition: 'border-color 150ms',
}

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 9,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontFamily: 'Inter, sans-serif',
  display: 'block',
  marginBottom: 5,
}

export default function FilterStrip({ totalAccounts, totalEscalations, owners }: Props) {
  const store = useAppStore()
  const [searchInput, setSearchInput] = useState(store.search || '')

  useEffect(() => {
    setSearchInput(store.search || '')
  }, [store.search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== store.search) {
        store.setFilter('search', searchInput)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback((key: Parameters<typeof store.setFilter>[0], value: string) => {
    store.setFilter(key, value === 'All' ? null : value)
  }, [store])

  return (
    <>
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
          flexWrap: 'wrap',
          padding: '12px 20px',
          borderBottom: '1px solid #2D3561',
          backgroundColor: '#1A1F3A',
        }}
      >
        {/* Priority */}
        <div>
          <label style={labelStyle}>Priority</label>
          <select
            style={selectStyle}
            value={store.priority || 'All'}
            onChange={e => handleSelect('priority', e.target.value)}
          >
            {['All', 'High', 'Medium', 'Low'].map(v => <option key={v}>{v}</option>)}
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
            {['All', 'Blocked', 'Open', 'In Progress', 'Closed'].map(v => <option key={v}>{v}</option>)}
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
            {['All', 'WhatsApp', 'Slack', 'Email'].map(v => <option key={v}>{v}</option>)}
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
            {['All', 'Enterprise', 'Mid-Market', 'SMB'].map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        {/* Type (B2B / B2C) */}
        <div>
          <label style={labelStyle}>Type</label>
          <select
            style={selectStyle}
            value={store.b2bOrB2c || 'All'}
            onChange={e => handleSelect('b2bOrB2c', e.target.value)}
          >
            {['All', 'B2B', 'B2C'].map(v => <option key={v}>{v}</option>)}
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
        <div style={{ flex: 1, minWidth: 180 }}>
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
            onFocus={e => ((e.target as HTMLInputElement).style.borderColor = '#4F46E5')}
            onBlur={e => ((e.target as HTMLInputElement).style.borderColor = '#2D3561')}
          />
        </div>

        {/* Sort */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'flex-end', paddingBottom: 1 }}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => store.setFilter('sortBy', opt.value)}
              style={{
                fontWeight: store.sortBy === opt.value ? 600 : 400,
                fontSize: 11,
                padding: '5px 12px',
                borderRadius: 20,
                border: store.sortBy === opt.value ? '1.5px solid #4F46E5' : '1px solid #2D3561',
                backgroundColor: store.sortBy === opt.value ? '#4F46E5' : '#1A1F3A',
                color: store.sortBy === opt.value ? 'white' : '#94A3B8',
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

      {/* Results count */}
      <div
        style={{
          padding: '7px 20px',
          borderBottom: '1px solid #2D3561',
          backgroundColor: '#0F1128',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4F46E5' }} />
        <span style={{ fontWeight: 400, fontSize: 12, color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
          <strong style={{ color: '#F1F5F9', fontWeight: 600 }}>{totalAccounts.toLocaleString()}</strong> accounts
          {' · '}
          <strong style={{ color: '#F1F5F9', fontWeight: 600 }}>{totalEscalations.toLocaleString()}</strong> escalations
        </span>
      </div>
    </>
  )
}
