import {Command, Option} from 'commander'
import {SyntaxError, VALID_OUTPUTS, draw} from './index.js'
import {name, version} from '../package.js'
import fs from 'fs'
import path from 'path'

/**
 * @typedef {object} StdIO
 * @property {import('stream').Readable} stdin
 * @property {import('stream').Writable} stdout
 * @property {import('stream').Writable} stderr
 */

/**
 * @typedef {Partial<StdIO>} TestingOptions
 */

/**
 * Read all of stdin.
 *
 * @returns {Promise<string>}
 */
function stdin(stdio) {
  stdio.stdin.setEncoding('utf8')
  return new Promise((resolve, reject) => {
    let data = ''
    stdio.stdin.on('data', chunk => {
      data += chunk
    })
    stdio.stdin.on('end', () => resolve(data))
    stdio.stdin.on('error', reject)
  })
}

/**
 * Read the given file, draw the diagram, and create the desired output file.
 *
 * @param {string} fileName
 * @param {import('commander').OptionValues} opts
 * @param {StdIO} [stdio=process]
 */
async function processFile(fileName, opts, stdio = process) {
  const outf = opts.out ?? path.join(
    path.dirname(fileName),
    `${path.basename(fileName, path.extname(fileName))}.${opts.output}`
  )
  const out = ((!opts.out && (fileName === '-')) || (opts.out === '-')) ?
    stdio.stdout :
    fs.createWriteStream(outf)

  out.on('error', er => {
    stdio.stderr.write(er.message)
    stdio.stderr.write('\n')
  })
  let text = null
  try {
    text = (fileName === '-') ?
      await stdin(stdio) :
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
      stdio.stderr.write(er.format([{source: fileName, text}]))
      stdio.stderr.write('\n')
    } else {
      stdio.stderr.write(`Processing "${fileName}": ${er}\n`)
    }
    throw er
  }
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
  const stdio = {
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr,
    ...testing,
  }
  if (testing) {
    program.exitOverride()
    program.configureOutput({
      writeOut(s) {
        stdio.stdout.write(s)
      },
      writeErr(s) {
        stdio.stderr.write(s)
      },
    })
  }
  program
    .name(name)
    .argument('<FILE...>', 'file names to process, "-" for stdin')
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
    .version(version)
    .parse(args)

  const opts = program.opts()

  if (opts.out && (program.args.length > 1)) {
    program.error('"-o, -out <FILE>" not valid with multiple inputs')
  }

  return Promise.all(program.args.map(f => processFile(f, opts, stdio)))
}
