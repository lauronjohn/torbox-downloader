import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatBytes, formatEta, formatSpeed } from '../src/renderer/src/lib/format'

test('formatBytes renders GB and handles null', () => {
  assert.equal(formatBytes(2_100_000_000), '2.0 GB')
  assert.equal(formatBytes(null), '—')
})

test('formatSpeed adds /s and handles zero', () => {
  assert.equal(formatSpeed(0), '—')
  assert.equal(formatSpeed(1_500_000), '1.4 MB/s')
})

test('formatEta renders seconds, minutes, hours, and handles null', () => {
  assert.equal(formatEta(42), '42s')
  assert.equal(formatEta(3661), '1h 1m')
  assert.equal(formatEta(null), '—')
})
