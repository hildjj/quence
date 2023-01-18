import {Command, Option} from 'commander'
import {SyntaxError, VALID_OUTPUTS, draw} from './index.js'
import fs from 'fs'
import l4js from 'log4js'
import path from 'path'
import {version} from '../package.js'

const log = l4js.getLogger()

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

async function readFile(name, opts) {
  const outf = path.join(
    path.dirname(name),
    `${path.basename(name, path.extname(name))}.${opts.output}`
  )
  const out = (name === '-') ?
    process.stdout :
    fs.createWriteStream(outf)

  let text = null
  try {
    text = (name === '-') ?
      await stdin() :
      await fs.promises.readFile(name, 'utf8')
    await draw(text, {...opts, fileName: name}, out)
  } catch (er) {
    if (name !== '-') {
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
      log.error(er.format([{source: name, text}]))
    } else {
      log.fatal(name, er)
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
  if (testing?.configureOutput) {
    program.configureOutput(testing.configureOutput)
    program.exitOverride(testing.exitOverride)
  }
  program
    .arguments('<FILE...>')
    .option('-n, --nolink', 'do not add project link to output')
    .addOption(
      new Option('-o, --output <type>', 'output type')
        .choices(VALID_OUTPUTS)
        .default('pdf')
    )
    .option(
      '-O, --option <key=value>',
      'option in the form key=value.  May be specified multiple times.',
      collect,
      []
    )
    .option('-v, --verbose', 'verbose logging')
    .version(version)
    .parse()

  const opts = program.opts()
  log.level = opts.verbose ? 'ALL' : 'WARN'

  return Promise.all(program.args.map(f => readFile(f, opts)))
}
