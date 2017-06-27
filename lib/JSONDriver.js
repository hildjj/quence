'use strict';

const util = require('util');
const Driver = require('./driver');

module.exports = class JSONDriver extends Driver {
  constructor(...args){
    super(...args);
  }

  draw(outstream, cb) {
    const s = JSON.stringify(this.diag, null, 2) + '\n';
    outstream.write(s, 'utf8');
    cb(null, s);
  }

  document() {
    return null;
  }
};