import Driver from './driver.js'

export default class JSONDriver extends Driver {
  /**
   * @param {import("stream").Writable} outstream
   * @returns {import("stream").Writable}
   */
  draw(outstream) {
    const s = `${JSON.stringify(this.diag, null, 2)}\n`
    outstream.end(s, 'utf8')
    return outstream
  }
}
