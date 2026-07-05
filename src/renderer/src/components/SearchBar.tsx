import { useAppStore } from '../store/appStore'
import { useSearch } from '../hooks/useSearch'

export function SearchBar() {
  const query = useAppStore((s) => s.query)
  const setQuery = useAppStore((s) => s.setQuery)
  const searching = useAppStore((s) => s.searching)
  const selectedMovie = useAppStore((s) => s.selectedMovie)
  const backToMovies = useAppStore((s) => s.backToMovies)

  useSearch()

  return (
    <div className="mb-4">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies…"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-10 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-neutral-600 border-t-brand" />
        )}
      </div>
      {selectedMovie && (
        <button
          onClick={backToMovies}
          className="mt-3 inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-100"
        >
          ← Back to results
        </button>
      )}
    </div>
  )
}
