import * as quence from '../lib/quence.js'
import {Buffer} from 'buffer'
import {Writable} from 'stream'
import fs from 'fs'
import l4js from 'log4js'
// eslint-disable-next-line node/no-missing-import
import test from 'ava'
const log = l4js.getLogger()
log.level = 'off'

const EXAMPLE = new URL('../examples/test.wsd', import.meta.url)

class Store extends Writable {
  constructor(...args) {
    super(...args)
    this.bufs = []
  }

  _write(chunk, encoding, next) {
    this.bufs.push(chunk)
    next()
  }

  read() {
    const res = Buffer.concat(this.bufs)
    this.bufs = []
    return res
  }
}

test('Store', t => new Promise(resolve => {
  const s = new Store()
  s.on('finish', () => {
    const buf = s.read()
    t.truthy(buf)
    t.truthy(Buffer.isBuffer(buf))
    t.is(buf.length, 6)
    resolve()
  })
  s.write('foo')
  s.end('bar')
}))

test('svg', t => new Promise(resolve => {
  fs.readFile(EXAMPLE, 'utf-8', (er, buf) => {
    t.falsy(er)
    const output = new Store()
    quence.draw(buf, 'svg', output, err => {
      t.falsy(err)
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
      resolve()
    })
  })
}))

test('pdf', t => new Promise(resolve => {
  fs.readFile(EXAMPLE, 'utf-8', (er, buf) => {
    t.falsy(er)
    const output = new Store()
    output.on('finish', () => {
      const o = output.read()
      t.truthy(Buffer.isBuffer(o))
      t.true(o.length > 0)
      // TODO: do some kind of better testing
      resolve()
    })
    output.on('error', err => t.falsy(err))
    quence.draw(buf, {o: 'pdf'}, output, err => {
      t.falsy(err)
    })
  })
}))

test('json', t => new Promise(resolve => {
  fs.readFile(EXAMPLE, 'utf-8', (er, buf) => {
    t.falsy(er)
    const output = new Store()
    quence.draw(buf, {o: 'json'}, output, err => {
      t.falsy(err)
      const buff = output.read()
      t.snapshot(buff.toString('utf-8'))
      resolve()
    })
  })
}))
