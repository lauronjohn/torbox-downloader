import type { DownloadJob, DownloadStatus } from '@shared/types'
import { useAppStore } from '../store/appStore'
import { formatBytes, formatEta, formatSpeed } from '../lib/format'

const STATUS_LABEL: Record<DownloadStatus, string> = {
  queued: 'Queued',
  adding: 'Adding to TorBox',
  processing: 'Processing on TorBox',
  downloading: 'Downloading',
  completed: 'Completed',
  failed: 'Failed'
}

const STATUS_COLOR: Record<DownloadStatus, string> = {
  queued: 'text-neutral-400',
  adding: 'text-sky-300',
  processing: 'text-sky-300',
  downloading: 'text-brand-hover',
  completed: 'text-emerald-400',
  failed: 'text-red-400'
}

function BarColor(status: DownloadStatus): string {
  if (status === 'completed') return 'bg-emerald-500'
  if (status === 'failed') return 'bg-red-500'
  return 'bg-brand'
}

function JobCard({ job }: { job: DownloadJob }) {
  const removeDownload = useAppStore((s) => s.removeDownload)
  const pct = Math.round(job.progress * 100)
  const indeterminate = job.status === 'adding' || job.status === 'processing'

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-100" title={job.title}>
            {job.title}
          </p>
          <p className={`text-xs ${STATUS_COLOR[job.status]}`}>
            {STATUS_LABEL[job.status]}
            {job.status === 'processing' && job.progress > 0 && ` · ${pct}%`}
          </p>
        </div>
        <button
          onClick={() => void removeDownload(job.id)}
          title="Remove"
          className="shrink-0 rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
        >
          ✕
        </button>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className={`h-full rounded-full transition-all ${BarColor(job.status)} ${
            indeterminate ? 'animate-pulse' : ''
          }`}
          style={{ width: `${indeterminate && job.progress === 0 ? 100 : pct}%` }}
        />
      </div>

      {job.status === 'downloading' && (
        <div className="mt-1.5 flex justify-between text-xs text-neutral-500">
          <span>
            {formatBytes(job.receivedBytes)}
            {job.sizeBytes ? ` / ${formatBytes(job.sizeBytes)}` : ''}
          </span>
          <span>
            {formatSpeed(job.speedBytes)} · ETA {formatEta(job.etaSeconds)}
          </span>
        </div>
      )}

      {job.status === 'completed' && job.filePath && (
        <p className="mt-1.5 truncate text-xs text-neutral-500" title={job.filePath}>
          Saved to {job.filePath}
        </p>
      )}

      {job.status === 'failed' && job.error && (
        <p className="mt-1.5 text-xs text-red-400/80">{job.error}</p>
      )}
    </div>
  )
}

export function DownloadQueue() {
  const downloads = useAppStore((s) => s.downloads)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-200">Downloads</h2>
        {downloads.length > 0 && (
          <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
            {downloads.length}
          </span>
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {downloads.length === 0 ? (
          <p className="mt-8 text-center text-sm text-neutral-600">No downloads yet.</p>
        ) : (
          downloads.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  )
}
