import {Buffer} from 'buffer';

// Extracted from pdfkit.  The least file system that we can abuse into
// loading some data that was statically bundled by parcel.

function normalizeFilename(fileName) {
  // Hack: Just take the filename, ignore directories.
  const m = String(fileName).match(/[^/]*$/);
  return m ? m[0] : fileName;
}

const fileData = {};

export function readFile() {
  throw new Error('Not implemented');
}

export function readFileSync(fileName, options = {}) {
  const encoding = typeof options === 'string' ? options : options.encoding;
  const virtualFileName = normalizeFilename(fileName);
  const data = fileData[virtualFileName];

  if (data == null) {
    throw new Error(`File '${virtualFileName}' not found in virtual file system`);
  }

  if (encoding) {
    // Return a string
    return typeof data === 'string' ? data : data.toString(encoding);
  }

  return Buffer.from(data, typeof data === 'string' ? 'base64' : undefined);
}

export function writeFileSync(fileName, content) {
  fileData[normalizeFilename(fileName)] = content;
}

export default {
  readFileSync,
  writeFileSync,
};
