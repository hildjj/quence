import * as quence from './grammar.js'
import json from './JSONDriver.js'
import pdf from './PDFDriver.js'
import svg from './SVGDriver.js'

const outputs = {
  js: json,
  json,
  pdf,
  svg,
}

export function supported(output_type) {
  return Object.prototype.hasOwnProperty.call(outputs, output_type)
}

export function draw(input, argv, outstream, cb) {
  if (!cb) {
    throw new Error('No callback specified')
  }
  if (typeof argv === 'string') {
    argv = {o: argv}
  }
  const output_type = argv.o
  if (!supported(output_type)) {
    throw new Error(`Invalid output type: "${output_type}"`)
  }
  try {
    const Driver = outputs[output_type]
    const parsed = quence.parse(input)
    const drawer = new Driver(parsed, argv)
    return drawer.draw(outstream, cb)
  } catch (ex) {
    cb(ex)
    return undefined
  }
}
