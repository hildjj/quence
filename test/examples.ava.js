import * as quence from '../lib/index.js'
import Store from './store.js'
import fs from 'fs'
// eslint-disable-next-line node/no-missing-import
import test from 'ava'

const EXAMPLE = new URL('../examples/test.wsd', import.meta.url)

function canon(o) {
  // Don't care about date
  o = o.replace(
    /<dc:date>[^<]+<\/dc:date>/g,
    '<dc:date>2017-06-27T06:26:23.547Z</dc:date>'
  )
  // Don't care about version
  return o.replace(
    />v\d+\.\d+\.\d+<\/tspan>/,
    '>v0.2.1</tspan>'
  )
}

test('svg', async t => {
  const buf = await fs.promises.readFile(EXAMPLE, 'utf-8')
  const output = quence.draw(buf, 'svg', new Store())
  const o = output.read().toString('utf-8')
  t.snapshot(canon(o))
})

test('svg drops', async t => {
  const DROPS = new URL('../examples/drops.wsd', import.meta.url)
  const buf = await fs.promises.readFile(DROPS, 'utf-8')
  const output = quence.draw(buf, 'svg', new Store())
  const o = output.read().toString('utf-8')
  t.snapshot(canon(o))
})

test('svg unicode', async t => {
  const UNICODE = new URL('../examples/unicode.wsd', import.meta.url)
  const buf = await fs.promises.readFile(UNICODE, 'utf-8')
  const output = quence.draw(buf, 'svg', new Store())
  const o = output.read().toString('utf-8')
  t.snapshot(canon(o))
})

test('pdf', async t => {
  const buf = await fs.promises.readFile(EXAMPLE, 'utf-8')
  const output = quence.draw(buf, {output: 'pdf'}, new Store())
  const o = await output.readFull() // Wait for `finish` event
  t.assert(o.length > 0)
  t.is(o.toString('utf8', 0, 5), '%PDF-')
})

test('json', async t => {
  const buf = await fs.promises.readFile(EXAMPLE, 'utf-8')
  const output = quence.draw(buf, {output: 'json'}, new Store())
  const o = output.read()
  t.snapshot(o.toString('utf-8'))
})

test('web svg', async t => {
  const CSS = `
text {
  fill: purple
}
`
  const store = await quence.draw('A->B', {output: 'svg', CSS}, new Store())
  t.regex(store.read().toString(), /purple/)
})

test('edges', async t => {
  await t.throws(() => quence.draw(`
dup: A->B
dup: A->B
  `, {output: 'json'}, new Store()))

  await t.throws(() => quence.draw(`
A@doesNotExist->B
  `, {output: 'json'}, new Store()))

  await t.throws(() => quence.draw('', {output: 'not valid'}))

  await t.throws(() => quence.draw('set unknown_property', 'json'))
})

