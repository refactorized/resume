import test from 'node:test'
import assert from 'node:assert'

// The year a job most recently ended — its newest role's `to` (`present` → Infinity).
// Variant templates use it to weight recent roles and thin older ones by date.
const recencyYear = (job) => {
  const to = job.roles[0].to
  return to === 'present' ? Infinity : parseInt(String(to).slice(-4), 10)
}

export default recencyYear

test('reads the most-recent end year', () => {
  assert.equal(recencyYear({ roles: [{ to: 'May 2023' }, { to: 'Apr 2022' }] }), 2023)
  assert.equal(recencyYear({ roles: [{ to: 'present' }] }), Infinity)
})
