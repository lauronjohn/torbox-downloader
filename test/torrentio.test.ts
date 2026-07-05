import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toStreamResults } from '../src/main/services/torrentio'

const raw = [
  {
    name: 'Torrentio\n4k',
    title: 'Kung.Fu.Panda.2008.2160p.UHD.BluRay.x265\n👤 45 💾 12.3 GB ⚙️ ThePirateBay',
    infoHash: 'ABCDEF1234567890ABCDEF1234567890ABCDEF12',
    fileIdx: 0,
    behaviorHints: { filename: 'Kung.Fu.Panda.2008.2160p.mkv', bingeGroup: 'x' },
    sources: [
      'tracker:udp://tracker.opentrackr.org:1337/announce',
      'tracker:udp://open.demonii.com:1337',
      'dht:ABCDEF1234567890'
    ]
  },
  {
    name: 'Torrentio\n1080p',
    title: 'Kung Fu Panda (2008) 1080p BluRay\n👤 210 💾 2.1 GB ⚙️ YTS',
    infoHash: '1111111111111111111111111111111111111111',
    fileIdx: 1,
    behaviorHints: { filename: 'Kung Fu Panda 2008 1080p.mp4' },
    sources: ['tracker:udp://tr1.example:1337', 'dht:x']
  },
  { title: 'no infohash here', name: 'skip' }
]

test('filters streams without an infoHash', () => {
  assert.equal(toStreamResults(raw).length, 2)
})

test('parses quality, size, seeders, and provider from the title/name lines', () => {
  const [s0] = toStreamResults(raw)
  assert.equal(s0.quality, '4K')
  assert.equal(s0.sizeBytes, 12_300_000_000)
  assert.equal(s0.sizeLabel, '12.3 GB')
  assert.equal(s0.seeders, 45)
  assert.equal(s0.provider, 'ThePirateBay')
  assert.equal(s0.title, 'Kung.Fu.Panda.2008.2160p.UHD.BluRay.x265')
})

test('lowercases infoHash for stable comparisons with TorBox', () => {
  const [s0] = toStreamResults(raw)
  assert.equal(s0.infoHash, 'abcdef1234567890abcdef1234567890abcdef12')
})

test('magnet includes tracker sources but not DHT sources', () => {
  const [s0] = toStreamResults(raw)
  assert.equal(s0.trackers.length, 2)
  assert.match(s0.magnet, /^magnet:\?xt=urn:btih:abcdef1234567890/)
  assert.equal((s0.magnet.match(/&tr=/g) ?? []).length, 2)
  assert.ok(!s0.magnet.includes('dht'))
  assert.ok(s0.magnet.includes('dn='))
})

test('parses a second stream independently', () => {
  const [, s1] = toStreamResults(raw)
  assert.equal(s1.quality, '1080p')
  assert.equal(s1.seeders, 210)
  assert.equal(s1.provider, 'YTS')
})
