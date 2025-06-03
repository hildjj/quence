import base from '@cto.af/eslint-config';
import globals from '@cto.af/eslint-config/globals.js';
import mod from '@cto.af/eslint-config/module.js';
import ts from '@cto.af/eslint-config/ts.js';

export default [
  {
    ignores: [
      'lib/grammar.js',
      'vscode/out/**',
      'vscode/dist/**',
      '**/*.d.ts',
      '**/*.min.js',
      'node_modules/**',
      'vscode/.vscode-test/**',
      '**/.vscode/**',
    ],
  },
  ...base,
  ...mod,
  ...ts,
  {
    files: ['**/*.js'],
    rules: {
      'n/prefer-node-protocol': 'off',
    },
  },
  {
    files: [
      'web/**/*.js',
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
];
