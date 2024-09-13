import test from 'node:test'
import assert from 'node:assert'

const _split = '\n---\n'

const getChunk = (content, chunk, cfg) => {
  const split = cfg?.split || _split
  return content.split(split)[chunk] // or undef
}

export default getChunk

test('gets chunks properly', () => {
  assert.equal(getChunk('aaa\n---\nbbb\n---\nccc', 0), 'aaa')
  assert.equal(getChunk('aaa\n---\nbbb\n---\nccc', 1), 'bbb')
  assert.equal(getChunk('aaa\n---\nbbb\n---\nccc', 2), 'ccc')
  assert.equal(getChunk('aaa\n---\nbbb\n---\nccc', 3), undefined)
})
