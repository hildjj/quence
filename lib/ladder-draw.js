/* jslint node: true */
/* jslint multistr: true */
'use strict';

var log = require('log4js').getLogger();
var ladder = require( './ladder');

var outputs = {
  js: require('./ladder-json'),
  json: require('./ladder-json'),
  svg: require('./ladder-svg'),
  pdf: require('./ladder-pdf')
};

function supported(output_type) {
  return outputs.hasOwnProperty(output_type);
}
exports.supported = supported;

exports.draw = function draw(input, argv, cb) {
  if (!cb) {
    throw new Error("No callback specified");
  }
  var output_type = argv.o;
  if (!supported(output_type)) {
    throw new Error('Invalid output type: ' + output_type);
  }
  var Driver = outputs[output_type];
  var parsed = ladder.parse(input);
  var drawer = new Driver(parsed, argv);
  return drawer.draw(cb);
};
