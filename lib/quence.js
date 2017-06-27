'use strict';

const log = require('log4js').getLogger();
const quence = require('./grammar');

const outputs = {
  js: require('./JSONDriver'),
  json: require('./JSONDriver'),
  svg: require('./SVGDriver'),
  pdf: require('./PDFDriver')
};

function supported(output_type) {
  return outputs.hasOwnProperty(output_type);
}
exports.supported = supported;

exports.draw = function draw(input, argv, outstream, cb) {
  if (!cb) {
    throw new Error('No callback specified');
  }
  if (typeof argv === 'string') {
    argv = { o: argv };
  }
  const output_type = argv.o;
  if (!supported(output_type)) {
    throw new Error('Invalid output type: ' + output_type);
  }
  try {
    const Driver = outputs[output_type];
    const parsed = quence.parse(input);
    const drawer = new Driver(parsed, argv);
    return drawer.draw(outstream, cb);
  } catch (ex) {
    cb(ex);
  }
};
