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

async function readFile(name) {
  const outf = newExt(name, argv.o)
  argv.fileName = name
  let text = null
  try {
    text = await fs.promises.readFile(name, 'utf8')
    const out = fs.createWriteStream(outf)
    await draw(text, argv, out)
  } catch (er) {
    try {
      await fs.promises.unlink(outf)
    } catch (ignored) {
      // Ignore
    }
    if (er instanceof SyntaxError) {
      log.error(er.format([{source: name, text}]))
    } else {
      log.fatal(name, er)
    }
    throw er
  }
  log.debug('finished')
}

Promise.all(argv._.map(readFile)).catch(() => process.exit(1))
