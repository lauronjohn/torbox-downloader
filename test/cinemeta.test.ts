import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toMovieResults } from '../src/main/services/cinemeta'

test('maps Cinemeta metas to MovieResult with the IMDb id passed through', () => {
  const out = toMovieResults([
    {
      id: 'tt1877830',
      type: 'movie',
      name: 'The Batman',
      year: '2022',
      poster: 'https://m.media-amazon.com/images/M/x.jpg',
      description: 'Batman ventures into Gotham.'
    }
  ])
  assert.equal(out.length, 1)
  assert.deepEqual(out[0], {
    id: 'tt1877830',
    title: 'The Batman',
    year: '2022',
    posterPath: 'https://m.media-amazon.com/images/M/x.jpg',
    overview: 'Batman ventures into Gotham.'
  })
})

test('filters out non-IMDb ids (Torrentio only understands tt… ids)', () => {
  const out = toMovieResults([
    { id: 'kitsu:1', name: 'Some Anime' },
    { id: 'tt0000001', name: 'Real Movie' },
    { name: 'No id at all' }
  ])
  assert.deepEqual(
    out.map((m) => m.id),
    ['tt0000001']
  )
})

test('falls back to Untitled and null poster when fields are missing', () => {
  const [m] = toMovieResults([{ id: 'tt0000002' }])
  assert.equal(m.title, 'Untitled')
  assert.equal(m.posterPath, null)
  assert.equal(m.overview, '')
})

test('derives a 4-char year from year or releaseInfo, incl. series ranges', () => {
  assert.equal(toMovieResults([{ id: 'tt1', releaseInfo: '2008-2013' }])[0].year, '2008')
  assert.equal(toMovieResults([{ id: 'tt2' }])[0].year, null)
})

test('handles undefined/empty input safely', () => {
  assert.deepEqual(toMovieResults(undefined), [])
  assert.deepEqual(toMovieResults([]), [])
})
