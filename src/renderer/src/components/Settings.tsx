import { useState, type ReactNode } from 'react'
import { useAppStore } from '../store/appStore'

export function Settings() {
  const settings = useAppStore((s) => s.settings)
  const saveSettings = useAppStore((s) => s.saveSettings)
  const chooseDir = useAppStore((s) => s.chooseDir)

  const [torboxToken, setTorboxToken] = useState('')
  const [tmdbKey, setTmdbKey] = useState('')
  const [concurrency, setConcurrency] = useState(settings?.concurrency ?? 3)
  const [saved, setSaved] = useState(false)

  const onSave = async (): Promise<void> => {
    await saveSettings({
      // Only send keys the user actually typed; blank leaves the stored key intact.
      ...(torboxToken ? { torboxToken } : {}),
      ...(tmdbKey ? { tmdbKey } : {}),
      concurrency
    })
    setTorboxToken('')
    setTmdbKey('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-1 text-lg font-semibold text-neutral-100">Settings</h2>
      <p className="mb-6 text-sm text-neutral-500">
        API keys are encrypted with your OS keychain and never leave this machine.
      </p>

      <div className="space-y-5">
        <Field
          label="TorBox API key"
          hint={settings?.hasTorboxToken ? 'A key is saved. Enter a new one to replace it.' : 'Required. Find it in your TorBox account settings.'}
          saved={settings?.hasTorboxToken ?? false}
        >
          <input
            type="password"
            value={torboxToken}
            onChange={(e) => setTorboxToken(e.target.value)}
            placeholder={settings?.hasTorboxToken ? '••••••••••••' : 'Paste your TorBox token'}
            className={inputCls}
          />
        </Field>

        <Field
          label="TMDB API key"
          hint={settings?.hasTmdbKey ? 'A key is saved. Enter a new one to replace it.' : 'Required. Free from themoviedb.org.'}
          saved={settings?.hasTmdbKey ?? false}
        >
          <input
            type="password"
            value={tmdbKey}
            onChange={(e) => setTmdbKey(e.target.value)}
            placeholder={settings?.hasTmdbKey ? '••••••••••••' : 'Paste your TMDB API key'}
            className={inputCls}
          />
        </Field>

        <Field label="Download folder">
          <div className="flex gap-2">
            <input readOnly value={settings?.downloadDir ?? ''} className={`${inputCls} flex-1`} />
            <button
              onClick={() => void chooseDir()}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-neutral-200 hover:bg-neutral-700"
            >
              Browse…
            </button>
          </div>
        </Field>

        <Field label="Concurrent downloads">
          <input
            type="number"
            min={1}
            max={10}
            value={concurrency}
            onChange={(e) => setConcurrency(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
            className={`${inputCls} w-24`}
          />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => void onSave()}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            Save settings
          </button>
          {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'

function Field({
  label,
  hint,
  saved,
  children
}: {
  label: string
  hint?: string
  saved?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <label className="text-sm font-medium text-neutral-300">{label}</label>
        {saved && <span className="text-xs text-emerald-400">● saved</span>}
      </div>
      {children}
      {hint && <p className="mt-1 text-xs text-neutral-600">{hint}</p>}
    </div>
  )
}
