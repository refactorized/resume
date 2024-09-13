import test from 'node:test'
import assert from 'node:assert'

const _className = 'page'
const _wrapFn = (content, className) =>
  `<div class="${className}">\n${content}\n</div>`
const _split = '\n---\n'

const wrap = (content, cfg) => {
  const wrapFn = cfg?.wrapFn || _wrapFn
  const className = cfg?.className || _className
  const split = cfg?.split || _split

  return content
    .split(split)
    .map((str) => wrapFn(str, className))
    .join('')
}

export default wrap

test('wraps as expected', () => {
  const content = 'aaa\n\n---\n\nbbb'
  const expected =
    '<div class="page">\naaa\n\n</div><div class="page">\n\nbbb\n</div>'
  assert.equal(wrap(content), expected)
})
