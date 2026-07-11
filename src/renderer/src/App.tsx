import { useEffect, type ReactNode } from 'react'
import { useAppStore } from './store/appStore'
import { useDownloads } from './hooks/useDownloads'
import { SearchBar } from './components/SearchBar'
import { ResultsTable } from './components/ResultsTable'
import { DownloadQueue } from './components/DownloadQueue'
import { Settings } from './components/Settings'

export default function App() {
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const settings = useAppStore((s) => s.settings)
  const loadSettings = useAppStore((s) => s.loadSettings)
  const error = useAppStore((s) => s.error)
  const clearError = useAppStore((s) => s.clearError)

  useDownloads()

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  // Nudge first-time users to Settings until the TorBox key is present.
  useEffect(() => {
    if (settings && !settings.hasTorboxToken) {
      setView('settings')
    }
  }, [settings, setView])

  const needsKeys = settings ? !settings.hasTorboxToken : false

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">📦 TorBox Downloader</span>
        </div>
        <nav className="flex items-center gap-1">
          <TabButton active={view === 'search'} onClick={() => setView('search')}>
            Search
          </TabButton>
          <TabButton active={view === 'settings'} onClick={() => setView('settings')}>
            Settings
            {needsKeys && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-amber-400" />}
          </TabButton>
        </nav>
      </header>

      {error && (
        <div className="flex items-center justify-between border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          <span>{error}</span>
          <button onClick={clearError} className="rounded px-2 hover:bg-red-500/20">
            ✕
          </button>
        </div>
      )}

      <main className="flex min-h-0 flex-1">
        <section className="min-w-0 flex-1 overflow-y-auto p-4">
          {view === 'settings' ? (
            <Settings />
          ) : (
            <>
              <SearchBar />
              <ResultsTable />
            </>
          )}
        </section>
        <aside className="w-96 shrink-0 border-l border-neutral-800 bg-neutral-950">
          <DownloadQueue />
        </aside>
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-100'
      }`}
    >
      {children}
    </button>
  )
}
