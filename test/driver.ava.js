import Driver from '../lib/driver.js'
// eslint-disable-next-line node/no-missing-import
import test from 'ava'

test('driver', t => {
  const d = new Driver({props: {column_width: 0}, parts: [], max_time: 0})
  t.truthy(d)
  t.throws(() => d.meta())
  t.throws(() => d.home_link({}))
  const pos = d.posa(1, 2)
  t.is(pos.toString('test'), 'xtest="1" ytest="2" ')
  t.is(pos.toString(), 'x="1" y="2" ')
  t.throws(() => d.transform())
})
