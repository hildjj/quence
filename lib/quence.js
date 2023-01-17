import json from './JSONDriver.js'
import {parse} from './grammar.js'
import pdf from './PDFDriver.js'
import svg from './SVGDriver.js'

export {SyntaxError} from './grammar.js'

const outputs = {
  js: json,
  json,
  pdf,
  svg,
}

export function supported(output_type) {
  return Object.prototype.hasOwnProperty.call(outputs, output_type)
}

export function draw(input, argv, outstream) {
  return new Promise((resolve, reject) => {
    if (typeof argv === 'string') {
      argv = {o: argv}
    }
    const output_type = argv.o
    if (!supported(output_type)) {
      reject(new Error(`Invalid output type: "${output_type}"`))
      return
    }
    const Driver = outputs[output_type]
    const parsed = parse(input, {
      grammarSource: argv.fileName,
    })
    const driver = new Driver(parsed, argv)
    driver.draw(outstream, er => {
      if (er) {
        reject(er)
      } else {
        resolve(outstream)
      }
    })
  })
}
