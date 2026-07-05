export function formatBytes(bytes: number | null): string {
  if (bytes == null || bytes <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '—'
  return `${formatBytes(bytesPerSec)}/s`
}

export function formatEta(seconds: number | null): string {
  if (seconds == null || !isFinite(seconds) || seconds <= 0) return '—'
  const s = Math.round(seconds)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rs = s % 60
  if (m < 60) return `${m}m ${rs}s`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return `${h}h ${rm}m`
}
