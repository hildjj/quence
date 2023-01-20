import {Point} from '../lib/point.js'
// eslint-disable-next-line node/no-missing-import
import test from 'ava'

test('point', t => {
  const p = new Point(1, 2)
  t.is(p.toString('test'), 'xtest="1" ytest="2" ')
  t.is(p.toString(), 'x="1" y="2" ')
  const q = p.adjust(-2, -2)
  t.is(q.x, -1)
  t.is(q.y, 0)

  t.throws(() => new Point())
  t.throws(() => new Point(0))

  // Shouldn't happen in quence, but it's there just in case
  const a = Point.angle(new Point(0, 0), new Point(0, 1))
  t.is(a, Math.PI / 2)
})
