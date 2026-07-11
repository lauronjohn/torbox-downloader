import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'

/** Debounces the query (350ms) so we're not searching on every keystroke. */
export function useSearch(): void {
  const query = useAppStore((s) => s.query)
  const search = useAppStore((s) => s.search)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (!query.trim()) return
    timer.current = setTimeout(() => {
      void search(query)
    }, 350)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [query, search])
}
