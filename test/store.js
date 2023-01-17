import {Buffer} from 'buffer'
import {Writable} from 'stream'

export default class Store extends Writable {
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

  readFull() {
    return new Promise((resolve, reject) => {
      this.once('finish', () => resolve(this.read()))
      this.once('error', reject)
    })
  }

  readFullBuffers() {
    return new Promise((resolve, reject) => {
      this.once('finish', () => resolve(this.bufs))
      this.once('error', reject)
    })
  }
}
