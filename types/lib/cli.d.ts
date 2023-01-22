/**
 * Main CLI entry point.
 *
 * @param {string[]} [args] Defaults to process.argv
 * @param {TestingOptions} [testing] stdio streams for testing
 * @returns {Promise<void[]>}
 */
export function main(args?: string[], testing?: TestingOptions): Promise<void[]>;
export type StdIO = {
    stdin: import('stream').Readable;
    stdout: import('stream').Writable;
    stderr: import('stream').Writable;
};
export type TestingOptions = Partial<StdIO>;
