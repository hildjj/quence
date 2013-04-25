/*jslint node: true */
"use strict";

var opt = require('optimist');
var argv = opt
  .boolean('d')
  .describe('d', 'debug output')
  .string('o')
  .describe('o', 'output type [png, svg]')
  .default('o', 'svg')
  .boolean('h')
  .describe('h', 'Show help')
  .argv;

if (argv.h) {
  opt.showHelp();
  process.exit(64);
}

var Ladder = require( './ladder-diagram' );
var LadderParse = require( './ladder-parser');
var fs = require('fs');
var path = require('path');
var canvg = require("canvg");
var Canvas = require("canvas");

if (argv.d) {
    require('./debug').enable();
    process.argv.shift();
}

function newExt(name, ext) {
  // check extension now, so we don't create an empty file
  switch (ext) {
    case 'png':
      break;
    case 'jpg':
    case 'jpeg':
      process.stderr.write('Output type not working yet: "' + ext + '"\n');
      break;
    default:
      process.stderr.write('Unknown output type: "' + ext + '"\n');
      process.exit(1);
  }
  return path.dirname(name) +
    path.sep +
    path.basename(name, path.extname(name)) +
    "." + ext;
}

function readFile(name) {
  fs.readFile(name, {encoding: 'utf8'}, function(er, data) {
    if (er) {
      process.stderr.write(er + "\n");
      process.exit(1);
    }
    var parsed = LadderParse.parse(data);
    Ladder.compute_ladder(parsed);
    var output = Ladder.draw_ladder();
    var outf = newExt(name, argv.o);

    if (argv.o === 'svg') {
      fs.writeFile(outf, output, function (er) {
        if (er) {
          process.stderr.write(er + "\n");
          process.exit(1);
        }
      });
    } else {
      var canvas = new Canvas();
      canvg(canvas, output, {ignoreAnimation: true});
      var outs = fs.createWriteStream(outf);
      switch (argv.o) {
        case 'png': canvas.pngStream().pipe(outs); break;
        case 'jpg':
        case 'jpeg': canvas.jpegStream().pipe(outs); break;
      }
    }
  });
}

for (var i=0; i<argv._.length; i++) {
  readFile(argv._[i]);
}

