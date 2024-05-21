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
    ],
  },
  ...base,
  ...mod,
  ...ts,
  {
    files: [
      'web/**/*.js',
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
];
