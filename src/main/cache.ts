/** Minimal in-memory TTL cache (used to mirror Torrentio's 1h cache window). */
export class TtlCache<T> {
  private map = new Map<string, { value: T; expires: number }>()

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | null {
    const entry = this.map.get(key)
    if (!entry) return null
    if (Date.now() > entry.expires) {
      this.map.delete(key)
      return null
    }
    return entry.value
  }

  set(key: string, value: T): void {
    this.map.set(key, { value, expires: Date.now() + this.ttlMs })
  }
}
