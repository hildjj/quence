import {Arrow, Diagram, Step} from '../lib/ast.js'
// eslint-disable-next-line node/no-missing-import
import test from 'ava'

test('arrow create', t => {
  const a = new Arrow(null, '-', '>')
  t.truthy(a)
  t.is(a.begin, null)
  t.is(a.dash, '-')
  t.is(a.end, '>')
  t.is(a.toString(), '->')
  t.is(a.classes(), 'solid closed_forward')
})

test('arrow classes', t => {
  const arrows = [
    [null, '-', '>', '->', 'solid closed_forward'],
    [null, '-', '>>', '->>', 'solid open_forward'],
    [null, '--', '>', '-->', 'dashed closed_forward'],
    [null, '--', '>>', '-->>', 'dashed open_forward'],

    ['<', '-', '>', '<->', 'closed_back solid closed_forward'],
    ['<', '-', '>>', '<->>', 'closed_back solid open_forward'],
    ['<', '--', '>', '<-->', 'closed_back dashed closed_forward'],
    ['<', '--', '>>', '<-->>', 'closed_back dashed open_forward'],

    ['<<', '-', '>', '<<->', 'open_back solid closed_forward'],
    ['<<', '-', '>>', '<<->>', 'open_back solid open_forward'],
    ['<<', '--', '>', '<<-->', 'open_back dashed closed_forward'],
    ['<<', '--', '>>', '<<-->>', 'open_back dashed open_forward'],
  ]
  for (const arr of arrows) {
    const a = new Arrow(arr[0], arr[1], arr[2])
    t.deepEqual(a.toString(), arr[3])
    t.deepEqual(a.classes(), arr[4])
  }
})

test('diagram create', t => {
  const d = new Diagram()
  t.truthy(d)
  t.snapshot(d)
  t.is(d.title, null)
  d.setTitle(' foo ')
  t.is(d.title, 'foo')
  t.throws(() => d.setTitle('bar'))
  t.throws(() => d.addStep(12))
  d.addAdvance(1, 2)
  const a1 = d.addEndpoint('Alice')
  const a2 = d.addEndpoint('Alice', 'here')
  const b1 = d.addEndpoint('Bob')
  t.throws(() => d.parts.add('Bob'))
  d.addMessage(2, 'here', a1, new Arrow(null, '-', '>'), a2, 'Hi!')
  const msg = d.addMessage(3, '', a1, new Arrow('<<', '--', '>>'), b1, null)
  t.is(msg.toString(), 'Alice <<-->> Bob: undefined')
  d.addBlock(4, 'loop', 'Fine')
  t.throws(() => d.compute())
  d.addBlock(5, 'opt', '')
  t.throws(() => d.compute())
  d.endBlock(6)
  d.endBlock(7)
  t.throws(() => d.endBlock(8))
  d.setProp('arrow_color', ' orange ')
  d.setProp('auto_number', '')
  d.setProp('rung_width', 10)
  t.throws(() => d.setProp('mumble12'))
  d.compute()
  t.snapshot(d)

  const that = {}
  function fe1() {
    // eslint-disable-next-line no-invalid-this
    t.is(this, that)
  }
  function fe2() {
    // eslint-disable-next-line no-invalid-this
    t.is(this, d.parts)
  }
  d.parts.forEach(fe1, that)
  d.parts.forEach(fe2)
})

test('Step', t => {
  const s = new Step(null, null)
  t.throws(() => {
    s.compute()
  })
})
