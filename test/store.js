import {Buffer} from 'buffer'
import {Writable} from 'stream'

export default class Store extends Writable {
  /**
   *
   * @param  {import('stream').WritableOptions} [opts]
   */
  constructor(opts) {
    super(opts)

    /**
     * @type {Buffer[]}
     */
    this.bufs = []
  }

  /**
   * @param {Buffer|string} chunk
   * @param {BufferEncoding} [encoding] If chunk is string, encode it
   * @param {callback: (error?: Error | null) => void} next Callback when done
   */
  _write(chunk, encoding, next) {
    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding)
    }
    this.bufs.push(chunk)
    next()
  }

  /**
   * @returns {Buffer}
   */
  read() {
    const res = Buffer.concat(this.bufs)
    this.bufs = []
    return res
  }

  /**
   * @returns {Buffer}
   */
  readFull() {
    return new Promise((resolve, reject) => {
      this.once('finish', () => resolve(this.read()))
      this.once('error', reject)
    })
  }

  /**
   * @returns {Promise<Buffer[]}
   */
  readFullBuffers() {
    return new Promise((resolve, reject) => {
      this.once('finish', () => resolve(this.bufs))
      this.once('error', reject)
    })
  }

  /**
   * @param {BufferEncoding} [enc] Encoding
   * @returns {Promise<string>}
   */
  readFullString(enc) {
    return new Promise((resolve, reject) => {
      this.once('finish', () => resolve(this.read().toString(enc)))
      this.once('error', reject)
    })
  }
}
