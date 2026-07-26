import test from 'node:test'
import assert from 'node:assert'

// Render a job's role heading(s) as <h3> lines, in the résumé's italic-keyword
// style: "Company _as_ Role (contract) _from_ X _to_ Y" (or "_onward_").
// One <h3> per role, so a promotion at one company stacks two headings.
const span = (role) =>
  role.to === 'present'
    ? ` <em>from</em> ${role.from} <em>onward</em>`
    : ` <em>from</em> ${role.from} <em>to</em> ${role.to}`

const roleLine = (job, role) =>
  `<h3 class="job-title">${job.company} <em>as</em> ${role.as}` +
  `${job.contract ? ' <em>(contract)</em>' : ''}${span(role)}</h3>`

const jobHeader = (job) => job.roles.map((r) => roleLine(job, r)).join('')

export default jobHeader

test('renders a single role heading', () => {
  const job = { company: 'Acme', roles: [{ as: 'Engineer', from: 'Jan 2020', to: 'Feb 2021' }] }
  assert.equal(
    jobHeader(job),
    '<h3 class="job-title">Acme <em>as</em> Engineer <em>from</em> Jan 2020 <em>to</em> Feb 2021</h3>',
  )
})

test('marks contract and present roles', () => {
  const job = { company: 'Acme', contract: true, roles: [{ as: 'Dev', from: 'Jan 2024', to: 'present' }] }
  assert.equal(
    jobHeader(job),
    '<h3 class="job-title">Acme <em>as</em> Dev <em>(contract)</em> <em>from</em> Jan 2024 <em>onward</em></h3>',
  )
})
