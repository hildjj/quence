'use strict'

const {Buffer} = require('buffer')
const test = require('ava')
const fs = require('fs')
const path = require('path')
const quence = require('../lib/quence')
const log = require('log4js').getLogger()
log.level = 'off'

const EXAMPLE = path.join(__dirname, '..', 'examples', 'test.wsd')

class Store extends require('stream').Writable {
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

test.cb('Store', t => {
  const s = new Store()
  s.on('finish', () => {
    const buf = s.read()
    t.truthy(buf)
    t.truthy(Buffer.isBuffer(buf))
    t.is(buf.length, 6)
    t.end()
  })
  s.write('foo')
  s.end('bar')
})

test.cb('svg', t => {
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
      t.end()
    })
  })
})

test.cb('pdf', t => {
  fs.readFile(EXAMPLE, 'utf-8', (er, buf) => {
    t.falsy(er)
    const output = new Store()
    output.on('finish', () => {
      const o = output.read()
      t.truthy(Buffer.isBuffer(o))
      t.true(o.length > 0)
      // TODO: do some kind of better testing
      t.end()
    })
    output.on('error', err => t.falsy(err))
    quence.draw(buf, {o: 'pdf'}, output, err => {
      t.falsy(err)
    })
  })
})

test.cb('json', t => {
  fs.readFile(EXAMPLE, 'utf-8', (er, buf) => {
    t.falsy(er)
    const output = new Store()
    quence.draw(buf, {o: 'json'}, output, err => {
      t.falsy(err)
      const buff = output.read()
      t.snapshot(buff.toString('utf-8'))
      t.end()
    })
  })
})
