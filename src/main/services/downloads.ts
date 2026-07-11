// Concurrent, streamed downloads with live progress/speed/ETA reporting and
// cooperative cancellation (AbortController per job).
import { createWriteStream } from 'fs'
import { mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import type { DownloadJob } from '../../shared/types'

export interface DownloadRequest {
  jobId: string
  url: string
  dir: string
  filename: string
}

type ProgressCb = (jobId: string, patch: Partial<DownloadJob>) => void

export class DownloadManager {
  private queue: DownloadRequest[] = []
  private active = 0
  private controllers = new Map<string, AbortController>()

  constructor(
    private concurrency: number,
    private readonly onProgress: ProgressCb
  ) {}

  setConcurrency(n: number): void {
    this.concurrency = Math.max(1, n)
    this.pump()
  }

  enqueue(req: DownloadRequest): void {
    this.queue.push(req)
    this.pump()
  }

  /**
   * Cancel a queued or in-flight download. Returns true if the job was known to
   * the manager (either waiting in the queue or actively downloading).
   */
  cancel(jobId: string): boolean {
    const queuedIdx = this.queue.findIndex((r) => r.jobId === jobId)
    if (queuedIdx !== -1) {
      this.queue.splice(queuedIdx, 1)
      this.onProgress(jobId, { status: 'canceled', speedBytes: 0, etaSeconds: null })
      return true
    }
    const controller = this.controllers.get(jobId)
    if (controller) {
      controller.abort()
      return true
    }
    return false
  }

  private pump(): void {
    while (this.active < this.concurrency && this.queue.length > 0) {
      const req = this.queue.shift()!
      this.active++
      void this.run(req).finally(() => {
        this.active--
        this.pump()
      })
    }
  }

  private async run(req: DownloadRequest): Promise<void> {
    const controller = new AbortController()
    this.controllers.set(req.jobId, controller)
    const dest = join(req.dir, req.filename)
    try {
      this.onProgress(req.jobId, { status: 'downloading', progress: 0 })
      const res = await fetch(req.url, { signal: controller.signal })
      if (!res.ok || !res.body) throw new Error(`Download failed (${res.status})`)
      const total = Number(res.headers.get('content-length')) || null

      await mkdir(req.dir, { recursive: true })

      let received = 0
      let lastTime = Date.now()
      let lastBytes = 0

      const nodeStream = Readable.fromWeb(res.body as never)
      nodeStream.on('data', (chunk: Buffer) => {
        received += chunk.length
        const now = Date.now()
        if (now - lastTime >= 500) {
          const speed = ((received - lastBytes) / (now - lastTime)) * 1000
          const eta = total && speed > 0 ? (total - received) / speed : null
          this.onProgress(req.jobId, {
            receivedBytes: received,
            sizeBytes: total,
            speedBytes: speed,
            etaSeconds: eta,
            progress: total ? received / total : 0
          })
          lastTime = now
          lastBytes = received
        }
      })

      await pipeline(nodeStream, createWriteStream(dest))

      this.onProgress(req.jobId, {
        status: 'completed',
        progress: 1,
        speedBytes: 0,
        etaSeconds: 0,
        receivedBytes: received,
        filePath: dest
      })
    } catch (err) {
      const aborted = controller.signal.aborted || (err as Error).name === 'AbortError'
      // Drop the partial file so the slot is clean for a retry.
      await unlink(dest).catch(() => {})
      if (aborted) {
        this.onProgress(req.jobId, { status: 'canceled', speedBytes: 0, etaSeconds: null })
      } else {
        this.onProgress(req.jobId, { status: 'failed', error: (err as Error).message })
      }
    } finally {
      this.controllers.delete(req.jobId)
    }
  }
}
