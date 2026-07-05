// TorBox client: check cached, create torrent, poll status, request download URL,
// and select the correct file id for multi-file torrents.
const BASE = 'https://api.torbox.app'

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

export interface TorboxFile {
  id: number
  name: string
  size: number
}

export interface TorboxTorrent {
  id: number
  hash: string
  download_finished: boolean
  download_present: boolean
  progress: number // 0..1
  download_speed: number // bytes/s
  eta: number // seconds
  size: number
  files: TorboxFile[]
  download_state?: string
  active?: boolean
}

/** Returns the set of infoHashes (lowercased) that TorBox has cached. */
export async function checkCached(hashes: string[], token: string): Promise<Set<string>> {
  const cached = new Set<string>()
  if (hashes.length === 0) return cached
  const chunkSize = 50
  for (let i = 0; i < hashes.length; i += chunkSize) {
    const chunk = hashes.slice(i, i + chunkSize)
    const qs = chunk.map((h) => `hash=${encodeURIComponent(h)}`).join('&')
    const url = `${BASE}/v1/api/torrents/checkcached?${qs}&format=list&list_files=false`
    try {
      const res = await fetch(url, { headers: authHeaders(token) })
      if (!res.ok) continue
      const json = (await res.json()) as {
        data?: Array<{ hash?: string }> | Record<string, unknown> | null
      }
      const data = json.data
      if (Array.isArray(data)) {
        for (const item of data) if (item.hash) cached.add(item.hash.toLowerCase())
      } else if (data && typeof data === 'object') {
        for (const key of Object.keys(data)) cached.add(key.toLowerCase())
      }
    } catch {
      // best-effort badge; treat failures as "not cached"
    }
  }
  return cached
}

export async function createTorrent(
  magnet: string,
  token: string
): Promise<{ torrentId: number; hash: string }> {
  const form = new FormData()
  form.append('magnet', magnet)
  const res = await fetch(`${BASE}/v1/api/torrents/createtorrent`, {
    method: 'POST',
    headers: authHeaders(token),
    body: form
  })
  const json = (await res.json().catch(() => ({}))) as {
    detail?: string
    data?: { torrent_id?: number; hash?: string }
  }
  if (!res.ok || !json.data?.torrent_id) {
    throw new Error(json.detail || `TorBox add failed (${res.status})`)
  }
  return { torrentId: json.data.torrent_id, hash: (json.data.hash ?? '').toLowerCase() }
}

export async function getTorrent(torrentId: number, token: string): Promise<TorboxTorrent | null> {
  const url = `${BASE}/v1/api/torrents/mylist?id=${torrentId}&bypass_cache=true`
  const res = await fetch(url, { headers: authHeaders(token) })
  if (!res.ok) throw new Error(`TorBox list failed (${res.status})`)
  const json = (await res.json()) as { data?: TorboxTorrent | TorboxTorrent[] | null }
  const data = json.data
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

export async function requestDownloadUrl(
  torrentId: number,
  fileId: number,
  token: string
): Promise<string> {
  const url =
    `${BASE}/v1/api/torrents/requestdl?token=${encodeURIComponent(token)}` +
    `&torrent_id=${torrentId}&file_id=${fileId}`
  const res = await fetch(url)
  const json = (await res.json().catch(() => ({}))) as { data?: string; detail?: string }
  if (!res.ok || !json.data) throw new Error(json.detail || `requestdl failed (${res.status})`)
  return json.data
}

const VIDEO_EXT = /\.(mkv|mp4|avi|mov|m4v|wmv|flv|webm|ts|m2ts|mpg|mpeg|vob)$/i
const SAMPLE_NAME = /\bsample\b/i

function isRealVideo(f: TorboxFile): boolean {
  return VIDEO_EXT.test(f.name) && !SAMPLE_NAME.test(f.name)
}

/**
 * Pick the file to download. TorBox's `file.id` and array order are its own
 * internal bookkeeping — they don't line up with Torrentio's `fileIdx` (an
 * index into the original torrent's file list), so a "hint" match can land
 * on a metadata/.txt/sample file that just happens to occupy that id or slot.
 * Only trust the hint when it actually resolves to a non-sample video file;
 * otherwise fall back to the largest video file (correct for a movie inside
 * a season pack), then the largest file overall.
 */
export function selectFileId(t: TorboxTorrent, preferredIdx: number | null): number {
  if (!t.files || t.files.length === 0) return 0

  if (preferredIdx != null) {
    const candidate = t.files.find((f) => f.id === preferredIdx) ?? t.files[preferredIdx]
    if (candidate && isRealVideo(candidate)) return candidate.id
  }

  const videos = t.files.filter(isRealVideo)
  const pool = videos.length ? videos : t.files
  return pool.reduce((a, b) => (b.size > a.size ? b : a)).id
}
