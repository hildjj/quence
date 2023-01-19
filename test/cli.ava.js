import Store from './store.js'
import {execa} from 'execa'
import l4js from 'log4js'
import {main} from '../lib/cli.js'
import path from 'path'
// eslint-disable-next-line node/no-missing-import
import test from 'ava'
import url from 'url'

const processArgs = process.argv.slice(0, 2)
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const examples = path.resolve(__dirname, '..', 'examples')
const fixtures = path.resolve(__dirname, 'fixtures')

const TEST = path.join(examples, 'test.wsd')
const BIN = path.resolve(__dirname, '..', 'bin', 'quence.js')

async function run(...argv) {
  const stdout = new Store()
  const stderr = new Store()
  let error = null

  try {
    await main([...processArgs, ...argv], {stdout, stderr})
  } catch (er) {
    error = er
  }

  return {
    stdout: stdout.read().toString(),
    stderr: stderr.read().toString(),
    error,
  }
}

test.before('Capture log events', () => {
  l4js.configure({
    appenders: {test: {type: 'recording'}},
    categories: {default: {appenders: ['test'], level: 'WARN'}},
  })
})

test.after('Reset logging', () => {
  l4js.configure({
    appenders: {out: {type: 'stdout'}},
    categories: {default: {appenders: ['out'], level: 'WARN'}},
  })
})

test.afterEach('clear logger', () => {
  l4js.recording().erase()
})

test('cli', async t => {
  const help = await run('-h')
  t.snapshot(help.stdout)
  t.is(help.error.code, 'commander.helpDisplayed')
  const basic = await run(TEST, '-osvg')
  t.falsy(basic.error)

  const opts = await run(TEST, '-ojs', '--out', '-', '-p', 'rung_width=12')
  t.falsy(basic.error)
  const jopts = JSON.parse(opts.stdout)
  t.is(jopts.props.rung_width, 12)
})

test('cli errors', async t => {
  const help = await run('-ofoo', TEST)
  t.is(help.error.code, 'commander.invalidArgument')

  const opts = await run(TEST, '-ojs', '--out', '-', '-p', 'unknown=12')
  t.truthy(opts.error)

  const syntax = await run(path.join(fixtures, 'invalid.wsd'))
  t.truthy(syntax.error)

  const outputWithFiles = await run('foo', 'bar', '-Ofoo')
  t.is(outputWithFiles.error.code, 'commander.error')
})

test('exec', async t => {
  const {stdout} = await execa(BIN, ['-ojs', '-O-', '-'], {
    input: 'alice -> blue',
  })
  t.true(stdout.length > 0)
  t.regex(stdout, /alice/)
})
