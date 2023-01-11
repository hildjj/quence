#!/usr/bin/env node
import {draw, supported} from '../lib/quence.js'
import {SyntaxError} from '../lib/grammar.js'
import fs from 'fs'
import l4js from 'log4js'
import opt from 'optimist'
import path from 'path'
const log = l4js.getLogger()

const {argv} = opt
  .usage('Usage: $0 [-o type] [-v] [-h] [-n] FILE...')
  .boolean('n')
  .describe('n', 'do not add project link to output')
  .string('o')
  .describe('o', 'output type [pdf, svg, json]')
  .default('o', 'pdf')
  .boolean('v')
  .describe('v', 'verbose logging')
  .boolean('h')
  .describe('h', 'Show help')

if (argv.h) {
  opt.showHelp()
  process.exit(64)
}

log.level = argv.v ? 'ALL' : 'WARN'

function newExt(name, ext) {
  // Check extension now, so we don't create an empty file
  if (!supported(ext)) {
    log.fatal('Unknown output type:', ext)
    process.exit(1)
  }

  return path.join(
    path.dirname(name),
    `${path.basename(name, path.extname(name))}.${ext}`
  )
}

function readFile(name) {
  fs.readFile(name, {encoding: 'utf8'}, (er, data) => {
    if (er) {
      log.error(name, er)
      return
    }

    const outf = newExt(name, argv.o)
    const out = fs.createWriteStream(outf)
    // TODO: Switch to promises
    draw(data, argv, out, err => {
      if (err) {
        fs.unlinkSync(outf)
        if (err instanceof SyntaxError) {
          log.error(`${name}(${err.location.start.line}:${err.location.start.column}): ${err.message}`)
        } else {
          log.fatal(err)
          process.exit(1)
        }
      } else {
        log.debug('finished')
      }
    })
  })
}

for (let i = 0; i < argv._.length; i++) {
  readFile(argv._[i])
}
