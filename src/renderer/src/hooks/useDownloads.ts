import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'

/** Loads the current queue and subscribes to live progress updates from main. */
export function useDownloads(): void {
  const setDownloads = useAppStore((s) => s.setDownloads)

  useEffect(() => {
    void window.api.listDownloads().then(setDownloads)
    const off = window.api.onDownloadsUpdate(setDownloads)
    return off
  }, [setDownloads])
}
