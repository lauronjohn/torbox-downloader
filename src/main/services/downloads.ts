// Concurrent, streamed downloads with live progress/speed/ETA reporting.
import { createWriteStream } from 'fs'
import { mkdir } from 'fs/promises'
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
    try {
      this.onProgress(req.jobId, { status: 'downloading', progress: 0 })
      const res = await fetch(req.url)
      if (!res.ok || !res.body) throw new Error(`Download failed (${res.status})`)
      const total = Number(res.headers.get('content-length')) || null

      await mkdir(req.dir, { recursive: true })
      const dest = join(req.dir, req.filename)

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
      this.onProgress(req.jobId, { status: 'failed', error: (err as Error).message })
    }
  }
}
