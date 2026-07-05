import { create } from 'zustand'
import type { AppSettings, DownloadJob, MovieResult, StreamResult } from '@shared/types'

type View = 'search' | 'settings'

interface SaveInput {
  torboxToken?: string
  tmdbKey?: string
  downloadDir?: string
  concurrency?: number
}

interface AppState {
  settings: AppSettings | null
  view: View
  query: string
  movies: MovieResult[]
  searching: boolean
  selectedMovie: MovieResult | null
  streams: StreamResult[]
  loadingStreams: boolean
  downloads: DownloadJob[]
  error: string | null

  setView: (view: View) => void
  setQuery: (query: string) => void
  clearError: () => void
  loadSettings: () => Promise<void>
  saveSettings: (input: SaveInput) => Promise<void>
  chooseDir: () => Promise<void>
  search: (query: string) => Promise<void>
  selectMovie: (movie: MovieResult) => Promise<void>
  backToMovies: () => void
  addDownload: (stream: StreamResult) => Promise<void>
  removeDownload: (id: string) => Promise<void>
  setDownloads: (jobs: DownloadJob[]) => void
}

function message(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: null,
  view: 'search',
  query: '',
  movies: [],
  searching: false,
  selectedMovie: null,
  streams: [],
  loadingStreams: false,
  downloads: [],
  error: null,

  setView: (view) => set({ view }),
  setQuery: (query) => set({ query }),
  clearError: () => set({ error: null }),

  loadSettings: async () => {
    try {
      const settings = await window.api.getSettings()
      set({ settings })
    } catch (err) {
      set({ error: message(err) })
    }
  },

  saveSettings: async (input) => {
    try {
      const settings = await window.api.setSettings(input)
      set({ settings, error: null })
    } catch (err) {
      set({ error: message(err) })
    }
  },

  chooseDir: async () => {
    try {
      const dir = await window.api.chooseDownloadDir()
      if (dir) await get().loadSettings()
    } catch (err) {
      set({ error: message(err) })
    }
  },

  search: async (query) => {
    if (!query.trim()) {
      set({ movies: [], searching: false })
      return
    }
    set({ searching: true, error: null })
    try {
      const movies = await window.api.searchMovies(query)
      // Ignore stale responses if the query changed while awaiting.
      if (get().query === query) set({ movies })
    } catch (err) {
      set({ error: message(err) })
    } finally {
      if (get().query === query) set({ searching: false })
    }
  },

  selectMovie: async (movie) => {
    set({ selectedMovie: movie, streams: [], loadingStreams: true, error: null })
    try {
      const streams = await window.api.getStreams(movie.id)
      if (get().selectedMovie?.id === movie.id) set({ streams })
    } catch (err) {
      set({ error: message(err) })
    } finally {
      if (get().selectedMovie?.id === movie.id) set({ loadingStreams: false })
    }
  },

  backToMovies: () => set({ selectedMovie: null, streams: [] }),

  addDownload: async (stream) => {
    try {
      await window.api.addDownload(stream)
    } catch (err) {
      set({ error: message(err) })
    }
  },

  removeDownload: async (id) => {
    try {
      await window.api.removeDownload(id)
    } catch (err) {
      set({ error: message(err) })
    }
  },

  setDownloads: (downloads) => set({ downloads })
}))
