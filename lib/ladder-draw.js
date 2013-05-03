/* jslint node: true */
/* jslint multistr: true */
'use strict';

var log = require('log4js').getLogger();
var ladder = require( './ladder');

exports.supported = function(output_type) {
  switch (output_type) {
    case 'pdf':
    case 'svg':
    case 'js':
    case 'json':
      return true;
  }
  return false;
};

exports.draw = function(input, output_type, cb) {
  if (!cb) {
    throw new Error("No callback specified");
  }

  var parsed = ladder.parse(input);
  switch (output_type) {
    case 'js':
    case 'json':
      var s = JSON.stringify(parsed, null, 2) + "\n";
      cb(null, s);
      return s;
    case 'svg':
      var LadderSVG = require( './ladder-svg' );
      return LadderSVG.draw(parsed, cb);
    case 'pdf':
      var LadderPDF = require( './ladder-pdf' );
      return LadderPDF.draw(parsed, cb);
  }

  throw new Error('Invalid output type: ' + output_type);
};
