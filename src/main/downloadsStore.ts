// Persists the download queue/history across app restarts. Stores the
// originating StreamResult alongside each job so a failed/canceled download
// can be retried after a relaunch.
import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { DownloadJob, StreamResult } from '../shared/types'

export interface PersistedDownloads {
  jobs: DownloadJob[]
  streams: Record<string, StreamResult>
}

function file(): string {
  return join(app.getPath('userData'), 'downloads.json')
}

export function load(): PersistedDownloads {
  try {
    if (!existsSync(file())) return { jobs: [], streams: {} }
    const data = JSON.parse(readFileSync(file(), 'utf-8')) as Partial<PersistedDownloads>
    return { jobs: data.jobs ?? [], streams: data.streams ?? {} }
  } catch {
    return { jobs: [], streams: {} }
  }
}

let timer: ReturnType<typeof setTimeout> | null = null

/** Debounced write — coalesces the frequent progress updates into one flush. */
export function saveDebounced(data: PersistedDownloads): void {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    try {
      const dir = dirname(file())
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
      writeFileSync(file(), JSON.stringify(data, null, 2), 'utf-8')
    } catch {
      // best-effort persistence; never crash the app over a failed write
    }
  }, 500)
}
