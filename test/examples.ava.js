import * as quence from '../lib/quence.js'
import Store from './store.js'
import fs from 'fs'
import l4js from 'log4js'
// eslint-disable-next-line node/no-missing-import
import test from 'ava'
const log = l4js.getLogger()
log.level = 'off'

const EXAMPLE = new URL('../examples/test.wsd', import.meta.url)

test('svg', async t => {
  const buf = await fs.promises.readFile(EXAMPLE, 'utf-8')
  const output = await quence.draw(buf, 'svg', new Store())
  let o = output.read().toString('utf-8')
  // Don't care about date
  o = o.replace(
    /<dc:date>[^<]+<\/dc:date>/g,
    '<dc:date>2017-06-27T06:26:23.547Z</dc:date>'
  )
  // Don't care about version
  o = o.replace(
    />v\d+\.\d+\.\d+<\/tspan>/,
    '>v0.2.1</tspan>'
  )
  t.snapshot(o)
})

test('pdf', async t => {
  const buf = await fs.promises.readFile(EXAMPLE, 'utf-8')
  const output = await quence.draw(buf, {o: 'pdf'}, new Store())
  const o = await output.readFull() // Wait for `finish` event
  t.assert(o.length > 0)
  t.is(o.toString('utf8', 0, 5), '%PDF-')
})

test('json', async t => {
  const buf = await fs.promises.readFile(EXAMPLE, 'utf-8')
  const output = await quence.draw(buf, {o: 'json'}, new Store())
  const o = output.read()
  t.snapshot(o.toString('utf-8'))
})

test('edges', async t => {
  await t.throwsAsync(() => quence.draw(`
dup: A->B
dup: A->B
  `, {o: 'json'}, new Store()))

  await t.throwsAsync(() => quence.draw(`
A@doesNotExist->B
  `, {o: 'json'}, new Store()))

  await t.throwsAsync(() => quence.draw('', {o: 'not valid'}))
})
