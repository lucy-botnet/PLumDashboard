'use client'

import { create } from 'zustand'
import type { FilterState } from '@/types'

interface AppStore extends FilterState {
  _refreshKey: number
  setFilter: (key: keyof FilterState, value: unknown) => void
  clearFilter: (key: keyof FilterState) => void
  clearAllFilters: () => void
  setPage: (page: number) => void
  initFromUrl: () => void
}

const defaultFilters: FilterState = {
  priority: null,
  status: null,
  channel: null,
  tier: null,
  owner: null,
  scoreRange: null,
  sortBy: 'score_desc',
  search: '',
  page: 1,
}

function syncToUrl(state: FilterState) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams()
  if (state.priority) params.set('priority', state.priority)
  if (state.status) params.set('status', state.status)
  if (state.channel) params.set('channel', state.channel)
  if (state.tier) params.set('tier', state.tier)
  if (state.owner) params.set('owner', state.owner)
  if (state.scoreRange) params.set('scoreRange', state.scoreRange.join(','))
  if (state.sortBy !== 'score_desc') params.set('sortBy', state.sortBy)
  if (state.search) params.set('search', state.search)
  if (state.page > 1) params.set('page', String(state.page))
  const qs = params.toString()
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
  window.history.replaceState(null, '', newUrl)
}

function readFromUrl(): Partial<FilterState> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const result: Partial<FilterState> = {}
  const priority = params.get('priority')
  if (priority) result.priority = priority
  const status = params.get('status')
  if (status) result.status = status
  const channel = params.get('channel')
  if (channel) result.channel = channel
  const tier = params.get('tier')
  if (tier) result.tier = tier
  const owner = params.get('owner')
  if (owner) result.owner = owner
  const scoreRange = params.get('scoreRange')
  if (scoreRange) {
    const [min, max] = scoreRange.split(',').map(Number)
    result.scoreRange = [min, max]
  }
  const sortBy = params.get('sortBy') as FilterState['sortBy']
  if (sortBy) result.sortBy = sortBy
  const search = params.get('search')
  if (search) result.search = search
  const page = params.get('page')
  if (page) result.page = Number(page)
  return result
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...defaultFilters,
  _refreshKey: 0,
  setFilter: (key, value) => {
    const newState = { ...get(), [key]: value, page: key === 'page' ? (value as number) : 1 }
    set(newState)
    syncToUrl(newState)
  },
  clearFilter: (key) => {
    const defaultVal = defaultFilters[key]
    const newState = { ...get(), [key]: defaultVal, page: 1 }
    set(newState)
    syncToUrl(newState)
  },
  clearAllFilters: () => {
    const newState = { ...defaultFilters, _refreshKey: get()._refreshKey + 1 }
    set(newState)
    syncToUrl(defaultFilters)
  },
  setPage: (page) => {
    const newState = { ...get(), page }
    set(newState)
    syncToUrl(newState)
  },
  initFromUrl: () => {
    const urlState = readFromUrl()
    set({ ...get(), ...urlState })
  },
}))
