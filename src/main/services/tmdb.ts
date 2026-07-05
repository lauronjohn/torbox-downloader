// TMDB client. `search` -> movie list; `getImdbId` -> IMDB id via the movie
// details endpoint (its response already contains `imdb_id`, so no separate
// external_ids call is needed).
import type { MovieResult } from '../../shared/types'

const BASE = 'https://api.themoviedb.org/3'

interface TmdbSearchResult {
  id: number
  title?: string
  original_title?: string
  release_date?: string
  poster_path?: string | null
  overview?: string
}

export async function searchMovies(query: string, apiKey: string): Promise<MovieResult[]> {
  const url =
    `${BASE}/search/movie?query=${encodeURIComponent(query)}` +
    `&include_adult=false&api_key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url)
  if (res.status === 401) throw new Error('Invalid TMDB API key')
  if (!res.ok) throw new Error(`TMDB search failed (${res.status})`)
  const json = (await res.json()) as { results?: TmdbSearchResult[] }
  return (json.results ?? []).map((r) => ({
    id: r.id,
    title: r.title ?? r.original_title ?? 'Untitled',
    year: r.release_date ? String(r.release_date).slice(0, 4) : null,
    posterPath: r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : null,
    overview: r.overview ?? ''
  }))
}

export async function getImdbId(tmdbId: number, apiKey: string): Promise<string> {
  const url = `${BASE}/movie/${tmdbId}?api_key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url)
  if (res.status === 401) throw new Error('Invalid TMDB API key')
  if (!res.ok) throw new Error(`TMDB details failed (${res.status})`)
  const json = (await res.json()) as { imdb_id?: string | null }
  if (!json.imdb_id) throw new Error('No IMDB id available for this title')
  return json.imdb_id
}
