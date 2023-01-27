import PDFDriver from '../lib/PDFDriver.js'
import {Point} from '../lib/point.js'
import {parse} from '../lib/grammar.js'
// eslint-disable-next-line node/no-missing-import
import test from 'ava'

test('PDF edges', t => {
  const diag = parse('a->b')
  const d = new PDFDriver(diag, {})
  t.truthy(d)
  t.throws(() => d.style('unknown-style'))

  // These don't throw
  d.draw_label(new Point(0, 0), '')
  d.draw_label(new Point(0, 0), null)
  d.transform(0, 0, 0, () => 0)
})
