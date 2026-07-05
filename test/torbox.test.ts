import { test } from 'node:test'
import assert from 'node:assert/strict'
import { selectFileId, type TorboxTorrent } from '../src/main/services/torbox'

const mk = (files: { id: number; name: string; size: number }[]): TorboxTorrent =>
  ({
    id: 1,
    hash: 'x',
    download_finished: true,
    download_present: true,
    progress: 1,
    download_speed: 0,
    eta: 0,
    size: 0,
    files
  }) as TorboxTorrent

test('selectFileId: uses a valid preferred fileIdx', () => {
  const t = mk([
    { id: 0, name: 'RARBG.txt', size: 100 },
    { id: 1, name: 'The.Movie.mkv', size: 5_000_000_000 },
    { id: 2, name: 'Sample.mkv', size: 40_000_000 }
  ])
  assert.equal(selectFileId(t, 1), 1)
})

test('selectFileId: falls back to the largest video when idx is null or out of range', () => {
  const t = mk([
    { id: 0, name: 'RARBG.txt', size: 100 },
    { id: 1, name: 'The.Movie.mkv', size: 5_000_000_000 },
    { id: 2, name: 'Sample.mkv', size: 40_000_000 }
  ])
  assert.equal(selectFileId(t, null), 1)
  assert.equal(selectFileId(t, 99), 1)
})

test('selectFileId: prefers a video file over a larger non-video file', () => {
  const t = mk([
    { id: 0, name: 'huge.iso', size: 9_000_000_000 },
    { id: 1, name: 'movie.mkv', size: 1_000_000_000 }
  ])
  assert.equal(selectFileId(t, null), 1)
})

test('selectFileId: empty file list returns 0', () => {
  assert.equal(selectFileId(mk([]), null), 0)
})

// Regression coverage for a real bug: TorBox's own `file.id` and array order
// are its own bookkeeping, unrelated to Torrentio's `fileIdx` (an index into
// the *original* torrent's file list). Trusting either blindly can make
// selectFileId return a .txt/NFO file instead of the movie. See torbox.ts.

test('regression: ignores fileIdx when it id-matches a non-video file', () => {
  const t = mk([
    { id: 0, name: 'RARBG.txt', size: 200 }, // preferredIdx (0) coincidentally equals this id
    { id: 1, name: 'The.Movie.mkv', size: 4_500_000_000 }
  ])
  assert.equal(selectFileId(t, 0), 1)
})

test('regression: ignores fileIdx when array-position match is a non-video file', () => {
  const t = mk([
    { id: 55, name: 'info.txt', size: 300 }, // array position 0; id doesn't match preferredIdx
    { id: 56, name: 'The.Movie.mp4', size: 3_800_000_000 },
    { id: 57, name: 'Sample.mp4', size: 35_000_000 }
  ])
  assert.equal(selectFileId(t, 0), 56)
})

test('regression: excludes sample files from the video pool by name, even with a video extension', () => {
  const t = mk([
    { id: 0, name: 'Sample.mkv', size: 50_000_000 },
    { id: 1, name: 'The.Movie.mkv', size: 4_200_000_000 }
  ])
  assert.equal(selectFileId(t, null), 1)
  assert.equal(selectFileId(t, 0), 1)
})
