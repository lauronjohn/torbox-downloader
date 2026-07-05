// Types shared across the main, preload, and renderer processes.

export interface MovieResult {
  id: number
  title: string
  year: string | null
  posterPath: string | null
  overview: string
}

export type Quality = '4K' | '1080p' | '720p' | '480p' | 'SD'

export interface StreamResult {
  /** Stable id: `${infoHash}:${fileIdx}` */
  id: string
  infoHash: string
  /** Index of the wanted file inside a multi-file torrent (season packs). */
  fileIdx: number | null
  /** First line of the Torrentio title = the torrent name. */
  title: string
  filename: string | null
  quality: Quality
  sizeBytes: number | null
  sizeLabel: string | null
  seeders: number | null
  provider: string | null
  trackers: string[]
  magnet: string
  /** Set by a TorBox `checkcached` lookup — instant download when true. */
  cached: boolean
}

export type DownloadStatus =
  | 'queued'
  | 'adding'
  | 'processing'
  | 'downloading'
  | 'completed'
  | 'failed'

export interface DownloadJob {
  id: string
  title: string
  quality: Quality
  status: DownloadStatus
  /** 0..1 */
  progress: number
  /** bytes per second */
  speedBytes: number
  etaSeconds: number | null
  sizeBytes: number | null
  receivedBytes: number
  filePath: string | null
  error: string | null
  torrentId: number | null
}

export interface AppSettings {
  hasTorboxToken: boolean
  hasTmdbKey: boolean
  downloadDir: string
  concurrency: number
}

export interface SettingsUpdate {
  torboxToken?: string
  tmdbKey?: string
  downloadDir?: string
  concurrency?: number
}

/** The typed surface exposed to the renderer via contextBridge as `window.api`. */
export interface Api {
  getSettings(): Promise<AppSettings>
  setSettings(update: SettingsUpdate): Promise<AppSettings>
  chooseDownloadDir(): Promise<string | null>
  searchMovies(query: string): Promise<MovieResult[]>
  getStreams(tmdbId: number): Promise<StreamResult[]>
  addDownload(stream: StreamResult): Promise<DownloadJob>
  listDownloads(): Promise<DownloadJob[]>
  removeDownload(id: string): Promise<void>
  onDownloadsUpdate(cb: (jobs: DownloadJob[]) => void): () => void
}
