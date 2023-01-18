'use strict'

// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  extends: '@cto.af/eslint-config/modules',
  env: {
    browser: true,
    node: false,
    es6: true,
    es2020: false,
  },
  rules: {
    'func-names': 0,
    'node/no-unsupported-features/node-builtins': 0,
  },
  ignorePatterns: [
    '*.min.js',
  ],
}
