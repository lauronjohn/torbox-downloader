// Persisted settings. API keys are encrypted with Electron safeStorage (OS
// keychain) and never leave the main process in plaintext form.
import { app, safeStorage } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { AppSettings, SettingsUpdate } from '../shared/types'

interface Persisted {
  torboxToken?: string // base64(encrypted) or plaintext fallback
  tmdbKey?: string
  downloadDir?: string
  concurrency?: number
  encrypted?: boolean
}

function file(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function read(): Persisted {
  try {
    if (!existsSync(file())) return {}
    return JSON.parse(readFileSync(file(), 'utf-8')) as Persisted
  } catch {
    return {}
  }
}

function write(data: Persisted): void {
  const dir = dirname(file())
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(file(), JSON.stringify(data, null, 2), 'utf-8')
}

function encrypt(value: string): { stored: string; encrypted: boolean } {
  if (safeStorage.isEncryptionAvailable()) {
    return { stored: safeStorage.encryptString(value).toString('base64'), encrypted: true }
  }
  return { stored: value, encrypted: false }
}

function decrypt(value: string | undefined, encrypted: boolean): string | null {
  if (!value) return null
  if (encrypted && safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(Buffer.from(value, 'base64'))
    } catch {
      return null
    }
  }
  return value
}

export function getTorboxToken(): string | null {
  const data = read()
  return decrypt(data.torboxToken, data.encrypted ?? false)
}

export function getTmdbKey(): string | null {
  const data = read()
  return decrypt(data.tmdbKey, data.encrypted ?? false)
}

export function getDownloadDir(): string {
  return read().downloadDir ?? app.getPath('downloads')
}

export function getConcurrency(): number {
  const n = read().concurrency
  return n && n > 0 ? n : 3
}

export function getPublicSettings(): AppSettings {
  const data = read()
  return {
    hasTorboxToken: !!decrypt(data.torboxToken, data.encrypted ?? false),
    hasTmdbKey: !!decrypt(data.tmdbKey, data.encrypted ?? false),
    downloadDir: data.downloadDir ?? app.getPath('downloads'),
    concurrency: data.concurrency && data.concurrency > 0 ? data.concurrency : 3
  }
}

export function updateSettings(update: SettingsUpdate): AppSettings {
  const data = read()
  // Re-encrypt everything under a single `encrypted` flag so old plaintext
  // values are upgraded once safeStorage becomes available.
  const secrets: { torboxToken?: string; tmdbKey?: string } = {
    torboxToken: decrypt(data.torboxToken, data.encrypted ?? false) ?? undefined,
    tmdbKey: decrypt(data.tmdbKey, data.encrypted ?? false) ?? undefined
  }
  if (update.torboxToken !== undefined) secrets.torboxToken = update.torboxToken.trim() || undefined
  if (update.tmdbKey !== undefined) secrets.tmdbKey = update.tmdbKey.trim() || undefined

  const next: Persisted = {
    downloadDir: update.downloadDir ?? data.downloadDir,
    concurrency: update.concurrency ?? data.concurrency,
    encrypted: safeStorage.isEncryptionAvailable()
  }
  if (secrets.torboxToken) next.torboxToken = encrypt(secrets.torboxToken).stored
  if (secrets.tmdbKey) next.tmdbKey = encrypt(secrets.tmdbKey).stored

  write(next)
  return getPublicSettings()
}
