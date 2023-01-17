import {Buffer} from 'buffer'
import Store from './store.js'
// eslint-disable-next-line node/no-missing-import
import test from 'ava'

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

test('StoreFull', async t => {
  const s = new Store()
  s.write('foo')
  s.end('bar')
  const buf = await s.readFull()
  t.truthy(buf)
  t.truthy(Buffer.isBuffer(buf))
  t.is(buf.length, 6)
})
