import { contextBridge, ipcRenderer } from 'electron'
import type { Api, DownloadJob } from '../shared/types'

const api: Api = {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (update) => ipcRenderer.invoke('settings:set', update),
  chooseDownloadDir: () => ipcRenderer.invoke('settings:chooseDir'),
  searchMovies: (query) => ipcRenderer.invoke('movies:search', query),
  getStreams: (tmdbId) => ipcRenderer.invoke('streams:get', tmdbId),
  addDownload: (stream) => ipcRenderer.invoke('downloads:add', stream),
  listDownloads: () => ipcRenderer.invoke('downloads:list'),
  removeDownload: (id) => ipcRenderer.invoke('downloads:remove', id),
  onDownloadsUpdate: (cb: (jobs: DownloadJob[]) => void) => {
    const listener = (_e: unknown, jobs: DownloadJob[]): void => cb(jobs)
    ipcRenderer.on('downloads:update', listener)
    return () => {
      ipcRenderer.removeListener('downloads:update', listener)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
