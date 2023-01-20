import * as fs from 'fs'
import * as path from 'path'
import {Command, Option} from 'commander'
import {SyntaxError, VALID_OUTPUTS, draw} from './index.js'
import {name, version} from '../package.js'
import l4js from 'log4js'
const log = l4js.getLogger()

/**
 * @typedef {object} TestingOptions
 * @property {import('stream').Writable} stdout
 * @property {import('stream').Writable} stderr
 */

/**
 * Read all of stdin.
 *
 * @returns {Promise<string>}
 */
function stdin() {
  process.stdin.setEncoding('utf8')
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.on('data', chunk => {
      data += chunk
    })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}

/**
 * Read the given file, draw the diagram, and create the desired output file.
 *
 * @param {string} fileName
 * @param {import('commander').OptionValues} opts
 * @param {TestingOptions} [testing]
 */
async function processFile(fileName, opts, testing) {
  const outf = opts.out ?? path.join(
    path.dirname(fileName),
    `${path.basename(fileName, path.extname(fileName))}.${opts.output}`
  )
  const out = ((!opts.out && (fileName === '-')) || (opts.out === '-')) ?
    (testing?.stdout ?? process.stdout) :
    fs.createWriteStream(outf)

  let text = null
  try {
    text = (fileName === '-') ?
      await stdin() :
      await fs.promises.readFile(fileName, 'utf8')
    const {output, property} = opts
    draw(text, {output, property, fileName}, out)
  } catch (er) {
    if (fileName !== '-') {
      try {
        await new Promise(resolve => {
          out.end(ignored => resolve())
        })
        await fs.promises.unlink(outf)
      } catch (ignored) {
        // Ignore. The file will often not be there yet.  We just want to
        // ensure nothing is left half-written
      }
    }
    if (er instanceof SyntaxError) {
      log.error(er.format([{source: fileName, text}]))
    } else {
      log.fatal(fileName, er)
    }
    throw er
  }
  log.debug('finished')
}

/**
 * Main CLI entry point.
 *
 * @param {string[]} [args] Defaults to process.argv
 * @param {TestingOptions} [testing] stdio streams for testing
 * @returns {Promise<void[]>}
 */
export function main(args, testing) {
  const program = new Command()
  if (testing) {
    program.exitOverride()
    program.configureOutput({
      writeOut(s) {
        testing.stdout.write(s)
      },
      writeErr(s) {
        testing.stderr.write(s)
      },
    })
  }
  program
    .name(name)
    .argument('<FILE...>', 'file names to process, "-" for stdin')
    .option('-n, --nolink', 'do not add project link to output')
    .addOption(
      new Option('-o, --output <type>', 'output type')
        .choices(VALID_OUTPUTS)
        .default('pdf')
    )
    .option('-O, --out <FILE>', 'output file name, "-" for stdout. Not valid with more than one input file.')
    .option(
      '-p, --property <key=value>',
      'diagram property in the form key=value.  May be specified multiple times.',
      (val, prev) => prev.concat([val]),
      []
    )
    .option('-v, --verbose', 'verbose logging')
    .version(version)
    .parse(args)

  const opts = program.opts()
  log.level = opts.verbose ? 'ALL' : 'WARN'

  if (opts.out && (program.args.length > 1)) {
    program.error('"-o, -out <FILE>" not valid with multiple inputs')
  }

  return Promise.all(program.args.map(f => processFile(f, opts, testing)))
}
