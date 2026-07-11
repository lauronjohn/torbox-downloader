import { create } from 'zustand'
import type { AppSettings, DownloadJob, MovieResult, StreamResult } from '@shared/types'

type View = 'search' | 'settings'

interface SaveInput {
  torboxToken?: string
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
  cancelDownload: (id: string) => Promise<void>
  retryDownload: (id: string) => Promise<void>
  revealDownload: (id: string) => Promise<void>
  openDownload: (id: string) => Promise<void>
  clearCompleted: () => Promise<void>
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
  // Typing a new query always means "search again" — drop back out of a
  // selected movie's streams view so the (soon-to-arrive) results are visible.
  setQuery: (query) => set({ query, selectedMovie: null, streams: [] }),
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

  cancelDownload: async (id) => {
    try {
      await window.api.cancelDownload(id)
    } catch (err) {
      set({ error: message(err) })
    }
  },

  retryDownload: async (id) => {
    try {
      await window.api.retryDownload(id)
    } catch (err) {
      set({ error: message(err) })
    }
  },

  revealDownload: async (id) => {
    try {
      await window.api.revealDownload(id)
    } catch (err) {
      set({ error: message(err) })
    }
  },

  openDownload: async (id) => {
    try {
      await window.api.openDownload(id)
    } catch (err) {
      set({ error: message(err) })
    }
  },

  clearCompleted: async () => {
    try {
      await window.api.clearCompleted()
    } catch (err) {
      set({ error: message(err) })
    }
  },

  setDownloads: (downloads) => set({ downloads })
}))
