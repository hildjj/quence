import {parse} from '../lib/grammar.js'
// eslint-disable-next-line node/no-missing-import
import test from 'ava'

test('parse error', t => {
  t.throws(() => parse('Bob'))
  t.throws(() => parse('Bob -'))
  t.throws(() => parse('Bob ->'))
  t.throws(() => parse('Bob - >'))
  t.throws(() => parse('Bob a'))
  t.throws(() => parse('advance'))
  t.throws(() => parse('advance '))
  t.throws(() => parse('advance\t'))
  t.throws(() => parse('advance\\t'))
  t.throws(() => parse('advance\\'))
  t.throws(() => parse('Bob\x01 ->'))
  t.throws(() => parse('Bob\x10 ->'))
})

test('start rule', t => {
  const ast = parse('Bob -> Alice', {startRule: 'start'})
  t.truthy(ast)
  t.throws(() => parse('Bob -> Alice', {startRule: 'send'}))
})

test('participant', t => {
  t.truthy(parse('participant Bob'))

  // TODO: this ought to work.
  // t.truthy(parse('participant Bob cob\n'));

  t.throws(() => parse('participant'))
  t.throws(() => parse('participantBob'))
  t.throws(() => parse('participant "Bob'))
  t.throws(() => parse('participant "Bob"'))
  t.throws(() => parse('participant "Bob" '))
  t.throws(() => parse('participant "Bob" as'))
  t.throws(() => parse('participant "Bob" as '))
})

test('send', t => {
  // Here: Bob -> Alice: Test duration=2[duration=2]
  t.throws(() => parse('Bob '))
  t.throws(() => parse('Bob@'))
  t.throws(() => parse('Bob @'))
  t.throws(() => parse('Bob @ '))
  t.throws(() => parse('Bob @t'))
  t.throws(() => parse('Bob @t ->'))
  t.throws(() => parse('t:'))
  t.throws(() => parse('Bob -> Alice\nBob'))
})

test('blocks', t => {
  t.throws(() => parse('opt'))
  t.throws(() => parse('loop'))
  t.throws(() => parse('block'))
  t.throws(() => parse('opt '))
  t.throws(() => parse('loop '))
  t.throws(() => parse('block '))
  t.throws(() => parse('opt A'))
  t.throws(() => parse('loop A'))
  t.throws(() => parse('block "'))
  t.throws(() => parse('opt "'))
  t.throws(() => parse('loop "'))
  t.throws(() => parse('block "'))
})

test('options', t => {
  t.truthy(parse('A->B [ duration = 2 ,\tadvance=""\t]'))
})

test('note', t => {
  t.throws(() => parse('note'))
  t.throws(() => parse('note '))
  t.throws(() => parse('noteBob'))
  t.throws(() => parse('note Bob'))
  t.truthy(parse('note Bob: #'))
  t.truthy(parse('note Bob: \\\\ #'))
})

test('set', t => {
  t.throws(() => parse('set'))
  t.throws(() => parse('set '))
  t.throws(() => parse('set UNKNOWN_PROP'))
  t.throws(() => parse('set no_feet "'))
})
