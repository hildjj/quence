'use strict';

const test = require('ava');
const fs = require('fs');
const path = require('path');
const quence = require('../lib/quence');
const log = require('log4js').getLogger();
log.setLevel('OFF');

const EXAMPLE = path.join(__dirname, '..', 'examples', 'test.wsd');

class Store extends require('stream').Writable {
  constructor(...args) {
    super(...args);
    this.bufs = [];
  }
  _write(chunk, encoding, next) {
    this.bufs.push(chunk);
    next();
  }
  read() {
    const res = Buffer.concat(this.bufs);
    this.bufs = [];
    return res;
  }
}

test.cb('Store', t => {
  const s = new Store();
  s.on('finish', () => {
    const buf = s.read();
    t.truthy(buf);
    t.truthy(Buffer.isBuffer(buf));
    t.is(buf.length, 6);
    t.end();
  });
  s.write('foo');
  s.end('bar');
});

test.cb('svg', t => {
  fs.readFile(EXAMPLE, 'utf-8', (er, buf) => {
    t.ifError(er);
    const output = new Store();
    quence.draw(buf, 'svg', output, (er) => {
      t.ifError(er);
      let o = output.read().toString('utf-8');
      o = o.replace(
        /<dc:date>[^<]+<\/dc:date>/g,
        '<dc:date>2017-06-27T06:26:23.547Z</dc:date>');
      t.snapshot(o);
      t.end();
    });
  });
});

test.cb('pdf', t => {
  fs.readFile(EXAMPLE, 'utf-8', (er, buf) => {
    t.ifError(er);
    const output = new Store();
    output.on('finish', () => {
      const o = output.read();
      t.truthy(Buffer.isBuffer(o));
      t.true(o.length > 0);
      // TODO: do some kind of better testing
      t.end();
    });
    output.on('error', (er) => t.ifError(er));
    quence.draw(buf, {o: 'pdf'}, output, (er) => {
      t.ifError(er);
    });
  });
});

test.cb('json', t => {
  fs.readFile(EXAMPLE, 'utf-8', (er, buf) => {
    t.ifError(er);
    const output = new Store();
    quence.draw(buf, {o: 'json'}, output, (er) => {
      t.ifError(er);
      const buf = output.read();
      t.snapshot(buf.toString('utf-8'));
      t.end();
    });
  });
});