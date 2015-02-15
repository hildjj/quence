/* jslint node: true */
/* jslint multistr: true */
'use strict';

var util = require('util');
var Driver = require('./driver');

function JSONDriver() {
  Driver.apply(this, arguments);
}

util.inherits(JSONDriver, Driver);
module.exports = JSONDriver;

JSONDriver.prototype.draw = function draw(outstream, cb) {
  var s = JSON.stringify(this.diag, null, 2) + "\n";
  outstream.write(s,'utf8');
  cb(null, s);
};

JSONDriver.prototype.document = function document() {
  return null;
};
