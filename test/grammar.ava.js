import {parse} from '../lib/grammar.js';
import test from 'ava';
import {testPeggy} from '@peggyjs/coverage';

function isInvalid(t, text, opts) {
  const er = t.throws(() => parse(text, {
    grammarSource: 'isInvalid',
    ...opts,
  }), undefined, `"${text}"`);
  if (typeof er?.format === 'function') {
    t.truthy(er.format([{source: 'isInvalid', text}]));
  }
}

test('parse error', t => {
  isInvalid(t, 'Bob');
  isInvalid(t, 'Bob');
  isInvalid(t, 'Bob -');
  isInvalid(t, 'Bob ->');
  isInvalid(t, 'Bob - >');
  isInvalid(t, 'Bob a');
  isInvalid(t, 'advance');
  isInvalid(t, 'advance ');
  isInvalid(t, 'advance\t');
  isInvalid(t, 'advance\\t');
  isInvalid(t, 'advance\\');
  isInvalid(t, 'Bob\x01 ->');
  isInvalid(t, 'Bob\x10 ->');
});

test('start rule', t => {
  const ast = parse('Bob -> Alice', {startRule: 'start'});
  t.truthy(ast);
  isInvalid(t, 'Bob -> Alice', {startRule: 'send'});
});

test('participant', t => {
  t.truthy(parse('participant Bob'));
  t.truthy(parse('  participant Bob'));
  t.truthy(parse('participant  "Bob" as Judy'));
  isInvalid(t, 'participant \\u0g2g');
  isInvalid(t, 'participant \\u00gg');
  isInvalid(t, 'participant \\u002g');
  isInvalid(t, 'participant \\u{g}');
  isInvalid(t, 'participant \\u{0');

  // TODO: this ought to work.
  // t.truthy(parse('participant Bob cob\n'));

  isInvalid(t, 'participant');
  isInvalid(t, 'participantBob');
  isInvalid(t, 'participant "Bob');
  isInvalid(t, 'participant "Bob"');
  isInvalid(t, 'participant "Bob" ');
  isInvalid(t, 'participant "Bob" as');
  isInvalid(t, 'participant "Bob" as ');
});

test('send', t => {
  // Here: Bob -> Alice: Test duration=2[duration=2]
  isInvalid(t, 'Bob ');
  isInvalid(t, 'Bob@');
  isInvalid(t, 'Bob @');
  isInvalid(t, 'Bob @ ');
  isInvalid(t, 'Bob @t');
  isInvalid(t, 'Bob @t ->');
  isInvalid(t, 't:');
  isInvalid(t, 'Bob -> Alice\nBob');
});

test('blocks', t => {
  isInvalid(t, 'opt');
  isInvalid(t, 'loop');
  isInvalid(t, 'block');
  isInvalid(t, 'opt ');
  isInvalid(t, 'loop ');
  isInvalid(t, 'block ');
  isInvalid(t, 'opt A');
  isInvalid(t, 'loop A');
  isInvalid(t, 'block "');
  isInvalid(t, 'opt "');
  isInvalid(t, 'loop "');
  isInvalid(t, 'block "');
});

test('options', t => {
  t.truthy(parse('A->B [ duration = 2 ,\tadvance=""\t]'));
  t.truthy(parse('A->B []'));
  t.truthy(parse('A->B [ ]'));
  t.truthy(parse('A->B [  ]'));
  isInvalid(t, 'A->B [');
  isInvalid(t, 'A->B [ ');
  isInvalid(t, 'A->B [ foo=');
  isInvalid(t, 'A->B [foo=2,');
  isInvalid(t, 'A->B [foo=2,bar=');
});

test('note', t => {
  isInvalid(t, 'note');
  isInvalid(t, 'note ');
  isInvalid(t, 'noteBob');
  isInvalid(t, 'note Bob');
  t.truthy(parse('note Bob: #'));
  t.truthy(parse('note Bob: \\\\ #'));
});

test('set', t => {
  isInvalid(t, 'set');
  isInvalid(t, 'set ');
  isInvalid(t, 'set UNKNOWN_PROP');
  isInvalid(t, 'set no_feet "');
  isInvalid(t, 'set no_feet:');
});

test('title', t => {
  t.truthy(parse('  title foo'));
  t.truthy(parse('title foo'));
  t.truthy(parse('title #'));
  t.truthy(parse('title \\xgg'));
  t.truthy(parse('title "\\xag"'));
  isInvalid(t, 'title');
  isInvalid(t, 'title"');
  isInvalid(t, 'title "');
});

test('grammar edges', t => {
  t.truthy(parse('a->b'));
  t.truthy(parse('a-->>b'));
  t.truthy(parse('a--#b'));
  t.truthy(parse('a<->b'));
  t.truthy(parse('a<<-->>b'));
  t.truthy(parse('a->b: \\l'));
  t.truthy(parse('a->b: \\l\\l'));
  isInvalid(t, 'a-b');
  isInvalid(t, 'a--b');
  isInvalid(t, 'a<-b');
  isInvalid(t, 'a<--b');
  isInvalid(t, 'a<b');
  isInvalid(t, 'a<<b');
  t.truthy(parse('a->b', {startRule: 'start'}));
  isInvalid(t, 'a->b', {startRule: '____UKNOWN_START____'});
});

test('testPeggy', async t => {
  const grammarUrl = new URL('../lib/grammar.js', import.meta.url);
  await testPeggy(grammarUrl, [
    {
      validInput: 'a->b',
      validResult(r) {
        t.snapshot(r);
        return r;
      },
      peg$maxFailPos: 4,
    },
    {
      invalidInput: 'Bob',
    },
    {
      invalidInput: 'Bob',
      startRule: 'start',
    },
    {
      validInput: '',
      validResult: ' ',
      options: {
        peg$startRuleFunction: 'peg$parse_',
        peg$silentFails: -1,
      },
    },
    {
      validInput: ' ',
      validResult: ' ',
      peg$maxFailPos: 1,
      options: {
        peg$startRuleFunction: 'peg$parse_',
        peg$silentFails: -1,
      },
    },
    {
      invalidInput: 'title foo',
      options: {
        peg$failAfter: {
          peg$parseto_the_end: 0,
        },
      },
    },
    {
      invalidInput: 'loop foo',
      options: {
        peg$failAfter: {
          peg$parseto_the_end: 0,
        },
      },
    },
    {
      invalidInput: 'opt foo',
      options: {
        peg$failAfter: {
          peg$parseto_the_end: 0,
        },
      },
    },
    {
      invalidInput: 'block foo',
      options: {
        peg$failAfter: {
          peg$parseto_the_end: 0,
        },
      },
    },
    {
      invalidInput: 'a',
      options: {
        peg$startRuleFunction: 'peg$parseWS',
        peg$silentFails: -1,
      },
    },
    {
      invalidInput: ' a',
      options: {
        peg$startRuleFunction: 'peg$parseWS',
        peg$silentFails: -1,
      },
    },
  ]);
});
