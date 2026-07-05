// Torrentio client + metadata parser + magnet builder.
// Streams are cached for 1h to respect the 5000 req/IP/day limit.
import type { Quality, StreamResult } from '../../shared/types'
import { TtlCache } from '../cache'

const BASE = 'https://torrentio.strem.fun'
const cache = new TtlCache<RawStream[]>(60 * 60 * 1000)

interface RawStream {
  name?: string
  title?: string
  infoHash?: string
  fileIdx?: number
  behaviorHints?: { filename?: string; bingeGroup?: string }
  sources?: string[]
}

export async function getRawStreams(imdbId: string): Promise<RawStream[]> {
  const cached = cache.get(imdbId)
  if (cached) return cached
  const res = await fetch(`${BASE}/stream/movie/${imdbId}.json`)
  if (!res.ok) throw new Error(`Torrentio failed (${res.status})`)
  const json = (await res.json()) as { streams?: RawStream[] }
  const streams = json.streams ?? []
  cache.set(imdbId, streams)
  return streams
}

function parseQuality(text: string): Quality {
  const t = text.toLowerCase()
  if (/(2160p|4k|uhd)/.test(t)) return '4K'
  if (/1080p/.test(t)) return '1080p'
  if (/720p/.test(t)) return '720p'
  if (/480p/.test(t)) return '480p'
  return 'SD'
}

function parseSize(text: string): { bytes: number | null; label: string | null } {
  const m = text.match(/💾\s*([\d.]+)\s*(TB|GB|MB|KB)/i)
  if (!m) return { bytes: null, label: null }
  const value = parseFloat(m[1])
  const unit = m[2].toUpperCase()
  const mult = unit === 'TB' ? 1e12 : unit === 'GB' ? 1e9 : unit === 'MB' ? 1e6 : 1e3
  return { bytes: Math.round(value * mult), label: `${m[1]} ${unit}` }
}

function parseSeeders(text: string): number | null {
  const m = text.match(/👤\s*(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

function parseProvider(text: string): string | null {
  const m = text.match(/⚙️\s*([^\n]+)/)
  return m ? m[1].trim() : null
}

function buildMagnet(infoHash: string, name: string | null, trackers: string[]): string {
  const parts = [`magnet:?xt=urn:btih:${infoHash}`]
  if (name) parts.push(`dn=${encodeURIComponent(name)}`)
  for (const tr of trackers) parts.push(`tr=${encodeURIComponent(tr)}`)
  return parts.join('&')
}

export function toStreamResults(raw: RawStream[]): StreamResult[] {
  return raw
    .filter((s) => !!s.infoHash)
    .map((s) => {
      const infoHash = s.infoHash!.toLowerCase()
      const rawTitle = s.title ?? ''
      const firstLine = rawTitle.split('\n')[0] || s.behaviorHints?.filename || 'Unknown'
      const meta = `${s.name ?? ''} ${rawTitle}`
      const trackers = (s.sources ?? [])
        .filter((x) => x.startsWith('tracker:'))
        .map((x) => x.slice('tracker:'.length))
      const filename = s.behaviorHints?.filename ?? null
      const size = parseSize(rawTitle)
      return {
        id: `${infoHash}:${s.fileIdx ?? 0}`,
        infoHash,
        fileIdx: typeof s.fileIdx === 'number' ? s.fileIdx : null,
        title: firstLine,
        filename,
        quality: parseQuality(meta),
        sizeBytes: size.bytes,
        sizeLabel: size.label,
        seeders: parseSeeders(rawTitle),
        provider: parseProvider(rawTitle),
        trackers,
        magnet: buildMagnet(infoHash, filename ?? firstLine, trackers),
        cached: false
      } satisfies StreamResult
    })
}
