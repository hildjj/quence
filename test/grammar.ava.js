'use strict'

const test = require('ava')
const {parse} = require('../lib/grammar')

test('parse error', t => {
  t.throws(() => parse('Bob'))
  t.throws(() => parse('Bob -'))
  t.throws(() => parse('Bob ->'))
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

  t.throws(() => parse('participant "Bob'))
  t.throws(() => parse('participant "Bob"'))
  t.throws(() => parse('participant "Bob" '))
  t.throws(() => parse('participant "Bob" as'))
  t.throws(() => parse('participant "Bob" as '))
})

test('send', t => {
  // here: Bob -> Alice: Test duration=2[duration=2]
  t.throws(() => parse('Bob '))
  t.throws(() => parse('Bob @'))
  t.throws(() => parse('Bob @ '))
  t.throws(() => parse('Bob @t'))
  t.throws(() => parse('Bob @t ->'))
  t.throws(() => parse('t:'))
})

test('opt', t => {
  t.throws(() => parse('opt'))
})
