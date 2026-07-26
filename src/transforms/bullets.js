import test from 'node:test'
import assert from 'node:assert'

// Render a highlights array into a nested <ul>.
// Each item is either a plain string, or { text, children: [...] } for nesting.
const renderItem = (item) => {
  if (typeof item === 'string') return `<li>${item}</li>`
  const { text = '', children = [] } = item
  const kids = children.length ? `<ul>${children.map(renderItem).join('')}</ul>` : ''
  return `<li>${text}${kids}</li>`
}

const bullets = (items = []) =>
  items.length ? `<ul>${items.map(renderItem).join('')}</ul>` : ''

export default bullets

test('renders flat and nested bullets', () => {
  assert.equal(bullets(['a', 'b']), '<ul><li>a</li><li>b</li></ul>')
  assert.equal(
    bullets([{ text: 'a', children: ['x', 'y'] }]),
    '<ul><li>a<ul><li>x</li><li>y</li></ul></li></ul>',
  )
  assert.equal(bullets([]), '')
})
