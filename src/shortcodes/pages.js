import test from 'node:test'
import assert from 'node:assert'

const _className = 'page'
const _wrap = (content, className) =>
  `<div class="${className}">\n${content}\n</div>`
const _split = '\n---\n'

const process = (content, cfg) => {
  const wrap = cfg?.wrap || _wrap
  const className = cfg?.className || _className
  const split = cfg?.split || _split

  return content
    .split(split)
    .map((str) => wrap(str, className))
    .join('')
}

export default process

test('wraps as expected', () => {
  const content = 'aaa\n\n---\n\nbbb'
  const expected =
    '<div class="page">\naaa\n\n</div><div class="page">\n\nbbb\n</div>'
  assert.equal(process(content), expected)
})
