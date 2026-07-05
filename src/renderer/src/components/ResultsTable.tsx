import type { Quality, StreamResult } from '@shared/types'
import { useAppStore } from '../store/appStore'
import { formatBytes } from '../lib/format'

const QUALITY_STYLES: Record<Quality, string> = {
  '4K': 'bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/30',
  '1080p': 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  '720p': 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  '480p': 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  SD: 'bg-neutral-500/15 text-neutral-300 ring-neutral-500/30'
}

function QualityBadge({ quality }: { quality: Quality }) {
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${QUALITY_STYLES[quality]}`}
    >
      {quality}
    </span>
  )
}

function StreamRow({ stream }: { stream: StreamResult }) {
  const addDownload = useAppStore((s) => s.addDownload)
  return (
    <tr className="border-b border-neutral-800/70 hover:bg-neutral-900/60">
      <td className="py-2 pr-2">
        <QualityBadge quality={stream.quality} />
      </td>
      <td className="max-w-0 py-2 pr-3">
        <div className="flex items-center gap-2">
          {stream.cached && (
            <span
              title="Cached on TorBox — instant download"
              className="shrink-0 rounded bg-yellow-400/15 px-1 py-0.5 text-xs font-semibold text-yellow-300 ring-1 ring-inset ring-yellow-400/30"
            >
              ⚡ Cached
            </span>
          )}
          <span className="truncate text-sm text-neutral-200" title={stream.title}>
            {stream.title}
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap py-2 pr-3 text-sm text-neutral-400">
        {stream.sizeLabel ?? formatBytes(stream.sizeBytes)}
      </td>
      <td className="whitespace-nowrap py-2 pr-3 text-sm text-neutral-400">
        {stream.seeders != null ? `👤 ${stream.seeders}` : '—'}
      </td>
      <td className="whitespace-nowrap py-2 pr-3 text-sm text-neutral-500">
        {stream.provider ?? '—'}
      </td>
      <td className="py-2 text-right">
        <button
          onClick={() => void addDownload(stream)}
          className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Download
        </button>
      </td>
    </tr>
  )
}

export function ResultsTable() {
  const movies = useAppStore((s) => s.movies)
  const selectedMovie = useAppStore((s) => s.selectedMovie)
  const selectMovie = useAppStore((s) => s.selectMovie)
  const streams = useAppStore((s) => s.streams)
  const loadingStreams = useAppStore((s) => s.loadingStreams)
  const query = useAppStore((s) => s.query)

  // Stream view for the selected movie.
  if (selectedMovie) {
    return (
      <div>
        <h2 className="mb-3 text-lg font-semibold text-neutral-100">
          {selectedMovie.title}
          {selectedMovie.year && (
            <span className="ml-2 text-sm font-normal text-neutral-500">{selectedMovie.year}</span>
          )}
        </h2>
        {loadingStreams ? (
          <Loading label="Finding torrents…" />
        ) : streams.length === 0 ? (
          <Empty label="No torrents found for this title." />
        ) : (
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="w-16 py-2 font-medium">Qual</th>
                <th className="py-2 font-medium">Title</th>
                <th className="w-20 py-2 font-medium">Size</th>
                <th className="w-20 py-2 font-medium">Seeds</th>
                <th className="w-28 py-2 font-medium">Provider</th>
                <th className="w-28 py-2" />
              </tr>
            </thead>
            <tbody>
              {streams.map((stream) => (
                <StreamRow key={stream.id} stream={stream} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  // Movie search results.
  if (movies.length === 0) {
    return (
      <Empty
        label={query.trim() ? 'No movies found.' : 'Search for a movie to get started.'}
      />
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-2">
      {movies.map((movie) => (
        <li key={movie.id}>
          <button
            onClick={() => void selectMovie(movie)}
            className="flex w-full items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-2 text-left transition-colors hover:border-neutral-700 hover:bg-neutral-900"
          >
            {movie.posterPath ? (
              <img
                src={movie.posterPath}
                alt=""
                className="h-16 w-11 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-neutral-800 text-neutral-600">
                🎬
              </div>
            )}
            <div className="min-w-0">
              <div className="font-medium text-neutral-100">
                {movie.title}
                {movie.year && (
                  <span className="ml-2 text-sm font-normal text-neutral-500">{movie.year}</span>
                )}
              </div>
              <p className="line-clamp-2 text-xs text-neutral-500">{movie.overview}</p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-neutral-500">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-700 border-t-brand" />
      {label}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return <div className="py-10 text-center text-sm text-neutral-600">{label}</div>
}
