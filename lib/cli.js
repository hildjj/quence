import {Command, Option} from 'commander'
import {SyntaxError, VALID_OUTPUTS, draw} from './index.js'
import {name, version} from '../package.js'
import fs from 'fs'
import l4js from 'log4js'
import path from 'path'

const log = l4js.getLogger()

function stdin(testing) {
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

async function readFile(fileName, opts, testing) {
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
    await draw(text, {...opts, fileName}, out)
  } catch (er) {
    if (fileName !== '-') {
      try {
        await new Promise(resolve => {
          // Ignore err
          out.end(resolve)
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

function collect(value, previous) {
  return previous.concat([value])
}

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
    .arguments('<FILE...>')
    .option('-n, --nolink', 'do not add project link to output')
    .addOption(
      new Option('-o, --output <type>', 'output type')
        .choices(VALID_OUTPUTS)
        .default('pdf')
    )
    .option('--out <FILE>', 'output file name')
    .option(
      '-O, --option <key=value>',
      'option in the form key=value.  May be specified multiple times.',
      collect,
      []
    )
    .option('-v, --verbose', 'verbose logging')
    .version(version)
    .parse(args)

  const opts = program.opts()
  log.level = opts.verbose ? 'ALL' : 'WARN'

  return Promise.all(program.args.map(f => readFile(f, opts, testing)))
}
