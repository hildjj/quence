/* eslint-disable prefer-named-capture-group */
/* eslint-disable array-element-newline */
export const config = {
  comments: {
    lineComment: '#',
  },
  brackets: [
    ['[', ']'],
  ],
  autoClosingPairs: [
    {open: '[', close: ']'},
    {open: '"', close: '"', notIn: ['string']},
  ],
  surroundingPairs: [
    {open: '[', close: ']'},
    {open: '"', close: '"'},
  ],
}

export const tokenizer = {
  // Set defaultToken to invalid to see what you do not tokenize yet
  // defaultToken: 'invalid',

  keywords: [
    'advance', 'as', 'end', 'false', 'loop', 'opt',
    'participant', 'set', 'title', 'true',
  ],

  typeKeywords: [],

  operators: [
    '->', '-->',
    '->>', '-->>',
    '-#', '--#',
    '<->', '<-->',
    '<->>', '<-->>',
    '<<->', '<<-->',
    '<<->>', '<<-->>',
    ':',
  ],

  symbols: /[#<>-]+/,

  // C# style strings
  escapes: /\\(?:[nrt\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  brackets: [
    {open: '[', close: ']', token: 'delimiter.bracket'},
  ],

  // The main tokenizer for our languages
  tokenizer: {
    root: [

      [/[[\]]/, '@brackets'],

      [/<{0,2}--?(?:#|>>?)/, 'operator.arrow'],

      {include: '@comment'},
      {include: '@strings'},
      {include: '@numbers'},
      {include: '@whitespace'},

      [/^(\s*)(title)([^#[\n]*)/, ['white', 'keyword', 'string']],

      // Time markers
      [/@[A-Za-z0-9_']+/, 'constant'],

      // Identifiers and keywords
      [/[A-Za-z0-9_']+/, {
        cases: {
          '@keywords': 'keyword',
          '@default': 'identifier',
        },
      }],

    ],

    numbers: [
      [/-?0x([a-fA-F]|\d)+/, 'number.hex'],
      [/-?\d+/, 'number'],
    ],

    strings: [
      [/(:)([^#[\n]*)/, ['operator', 'string']],
      [/"$/, 'string.escape', '@popall'],
      [/"/, 'string.escape', '@dblStringBody'],
    ],

    dblStringBody: [
      [/[^\\"]+$/, 'string', '@popall'],
      [/[^\\"]+/, 'string'],
      [/\\./, 'string'],
      [/"/, 'string.escape', '@popall'],
      [/\\$/, 'string'],
    ],

    comment: [
      [/#.*$/, 'comment'], // -# is an arrow, not a comment
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
    ],
  },
}

export const theme = {
  base: 'vs-dark',
  colors: {
  },
  inherit: true,
  rules: [
    {
      token: 'number',
      foreground: 'ADD8E6',
    },
    {
      token: 'operator',
      foreground: '66CDAA',
    },
    {
      token: 'operator.arrow',
      foreground: 'ADFF2F',
    },
  ],
}
