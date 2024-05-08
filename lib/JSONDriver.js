import Driver from './driver.js';

/** @extends Driver<void> */
export default class JSONDriver extends Driver {
  /**
   * @param {import("stream").Writable} outstream
   * @returns {import("stream").Writable}
   */
  draw(outstream) {
    outstream.write(JSON.stringify(this.diag, null, 2), 'utf8');
    outstream.end('\n', 'utf8');
    return outstream;
  }
}
