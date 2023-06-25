/**
 * Is the given output type supported?
 *
 * @param {string} output_type
 * @returns {boolean}
 */
export function supported(output_type: string): boolean;
/**
 * @typedef {object} DrawOptions
 * @property {keyof outputs} output Desired output type.
 * @property {string} [fileName] The filename that the text was read from.
 * @property {string[]} [property] Extra diagram properties from command line
 * @property {string} [CSS] Ensure CSS file isn't read, use this text instead.
 * @property {boolean} [nolink=false] Do not put Quence link in the output.
 */
/**
 *
 * @param {string} input
 * @param {keyof outputs|DrawOptions} argv
 * @param {import('stream').Writable} outstream
 * @returns {import('stream').Writable}
 */
export function draw(input: string, argv: keyof {
    js: typeof json;
    json: typeof json;
    pdf: typeof pdf;
    svg: typeof svg;
} | DrawOptions, outstream: import('stream').Writable): import('stream').Writable;
export { SyntaxError } from "./grammar.js";
export const VALID_OUTPUTS: string[];
export type DrawOptions = {
    /**
     * Desired output type.
     */
    output: keyof {
        js: typeof json;
        json: typeof json;
        pdf: typeof pdf;
        svg: typeof svg;
    };
    /**
     * The filename that the text was read from.
     */
    fileName?: string;
    /**
     * Extra diagram properties from command line
     */
    property?: string[];
    /**
     * Ensure CSS file isn't read, use this text instead.
     */
    CSS?: string;
    /**
     * Do not put Quence link in the output.
     */
    nolink?: boolean;
};
import json from './JSONDriver.js';
import pdf from './PDFDriver.js';
import svg from './SVGDriver.js';
