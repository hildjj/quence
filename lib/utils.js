/* jslint node: true */
'use strict';

exports.deep_copy = function deep_copy(a) {
  return JSON.parse(JSON.stringify(a));
};
