import * as quence from '../lib/index.js'
import Store from './store.js'
import fs from 'fs'
import test from 'ava'
import url from 'url'

const EXAMPLES = new URL('../examples/', import.meta.url)

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
  const dir = await fs.promises.readdir(EXAMPLES)
  for (const f of dir) {
    if (f.endsWith('.wsd')) {
      const fn = new URL(f, EXAMPLES)
      const buf = await fs.promises.readFile(fn, 'utf-8')
      const output = quence.draw(buf, 'svg', new Store())
      const o = await output.readFullString()
      t.snapshot(canon(o), f)
    }
  }
})

test('pdf', async t => {
  const cwd = process.cwd()
  process.chdir(url.fileURLToPath(EXAMPLES))
  const dir = await fs.promises.readdir(EXAMPLES)
  for (const f of dir) {
    if (f.endsWith('.wsd')) {
      const fn = new URL(f, EXAMPLES)
      const buf = await fs.promises.readFile(fn, 'utf-8')
      const output = quence.draw(buf, 'pdf', new Store())
      const o = await output.readFull()
      t.assert(o.length > 0)
      t.is(o.toString('utf8', 0, 5), '%PDF-')
    }
  }
  process.chdir(cwd)
})

test('json', async t => {
  const dir = await fs.promises.readdir(EXAMPLES)
  for (const f of dir) {
    if (f.endsWith('.wsd')) {
      const fn = new URL(f, EXAMPLES)
      const buf = await fs.promises.readFile(fn, 'utf-8')
      const output = quence.draw(buf, 'json', new Store())
      const o = await output.readFullString()
      t.snapshot(o, f)
    }
  }
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

