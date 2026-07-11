// Cinemeta (Stremio) metadata client. Requires no API key and returns IMDb ids
// directly — which is exactly what Torrentio consumes — so it replaces the
// old TMDB search + id-lookup with a single keyless request.
import type { MovieResult } from '../../shared/types'

const BASE = 'https://v3-cinemeta.strem.io'

interface CinemetaMeta {
  id?: string
  type?: string
  name?: string
  year?: string
  releaseInfo?: string
  poster?: string
  description?: string
}

/** Pure mapper (unit-tested) from Cinemeta `metas` to our MovieResult shape. */
export function toMovieResults(metas: CinemetaMeta[] | undefined): MovieResult[] {
  return (metas ?? [])
    // Only IMDb-id entries (`tt…`) work with Torrentio; skip anime/kitsu ids etc.
    .filter((m): m is CinemetaMeta & { id: string } => typeof m.id === 'string' && m.id.startsWith('tt'))
    .map((m) => ({
      id: m.id,
      title: m.name ?? 'Untitled',
      year: (m.year ?? m.releaseInfo ?? '').slice(0, 4) || null,
      posterPath: m.poster ?? null,
      overview: m.description ?? ''
    }))
}

export async function searchMovies(query: string): Promise<MovieResult[]> {
  const url = `${BASE}/catalog/movie/top/search=${encodeURIComponent(query)}.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Cinemeta search failed (${res.status})`)
  const json = (await res.json()) as { metas?: CinemetaMeta[] }
  return toMovieResults(json.metas)
}
