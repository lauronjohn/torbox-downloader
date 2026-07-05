# Contributing

Thanks for considering a contribution — bug fixes, features, and cleanups are
all welcome.

## Dev setup

```bash
npm install
npm run dev          # launches the app with hot reload
```

Paste your own TMDB + TorBox keys into Settings on first launch (see the main
[README](README.md) for where to get them).

## Before opening a PR

```bash
npm run typecheck    # main, preload, renderer, and test projects
npm test             # node:test suite for parsing/selection/formatting logic
npm run build        # production bundle sanity check
```

All three should pass cleanly. There's no UI test harness yet, so for any
change touching the renderer, actually run `npm run dev` and click through the
affected flow before submitting.

## Where things live

See the **Architecture** section of the [README](README.md) for the process
layout (main / preload / renderer) and what belongs where. A few things worth
knowing going in:

- All network calls, disk access, and secrets live in `src/main/` (Node). The
  renderer only ever talks to `window.api` (see `src/preload/index.ts`) — it
  never sees a raw API key or makes a direct HTTP request.
- `src/main/services/torbox.ts`'s `selectFileId` picks which file in a torrent
  to download. TorBox's own file `id`/array order is unrelated to Torrentio's
  `fileIdx` — see the regression tests in `test/torbox.test.ts` before changing
  this logic, they encode a real bug that was fixed once already.

## Reporting bugs

Open an issue with what you searched for, what you expected, and what
happened instead. If it's a wrong-file-downloaded bug, the torrent's file
list (visible in the TorBox web UI) is the most useful thing to include.
