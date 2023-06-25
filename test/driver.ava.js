import Driver from '../lib/driver.js'
import {parse} from '../lib/grammar.js'
import test from 'ava'

test('driver', t => {
  const diag = parse('a->b')
  const d = new Driver(diag, {
    property: ['no_link', 'no_link=false'],
  })
  t.truthy(d)
  d.clear()
  d.draw_label()
  t.throws(() => d.meta())
  t.throws(() => d.home_link({}))
  t.throws(() => d.transform())
  t.throws(() => new Driver(diag, {
    property: ['line_width=YES'],
  }))
})
