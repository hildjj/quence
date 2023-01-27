import {Point} from '../lib/point.js'
import SVGDriver from '../lib/SVGDriver.js'
import {parse} from '../lib/grammar.js'
// eslint-disable-next-line node/no-missing-import
import test from 'ava'

test('SVG edges', t => {
  const diag = parse('a->b')
  const d = new SVGDriver(diag, {})
  t.truthy(d)

  d.transform(0, 0, 0, () => 0)
  d.draw_label(new Point(0, 0), '')
  d.draw_label(new Point(0, 0), null)
})
