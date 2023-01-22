/** @extends Driver<void> */
export default class PDFDriver extends Driver<void> {
    /**
     * @param {import('./ast.js').Diagram} diag
     * @param {import('./index.js').DrawOptions} argv
     */
    constructor(diag: import('./ast.js').Diagram, argv: import('./index.js').DrawOptions);
    styles: {
        text: {
            font: string;
            fontSize: number;
            fillColor: string;
        };
        title: {};
        rung_label: {};
        path: {
            strokeColor: string;
            lineWidth: number;
        };
        rung: {
            strokeColor: string;
            lineWidth: number;
        };
        start: {
            align: string;
        };
        end: {
            align: string;
        };
        center: {
            font: string;
            fontSize: number;
            fillColor: string;
            align: string;
        };
        open: {
            strokeColor: string;
            lineCap: string;
        };
        closed: {
            fillColor: string;
            strokeColor: string;
            drawStyle: string;
        };
        dashed: {
            dash: (number | {
                space: number;
            })[];
        };
        solid: {
            undash: boolean;
        };
        block: {
            strokeColor: string;
            dash: (number | {
                space: number;
            })[];
            lineJoin: string;
        };
        block_tab: {
            fill: string;
            drawStyle: string;
        };
        closed_forward: {};
        open_forward: {};
        closed_back: {};
        open_back: {};
        self: {};
        link: {
            fillColor: string;
            align: string;
        };
        version: {
            fillColor: string;
            align: string;
        };
    };
    path_count: number;
    doc: PDFKit.PDFDocument;
    /**
     * Apply a css-like set of classes to the current document state
     *
     * @param  {String} klasses Space-separated list of class names
     * @return {object} Extra options that can't be set on doc, to
     *     apply to the draw routine that follows.
     */
    style(klasses: string): object;
    /**
     * @param {import('./point.js').Point} p Center bottom of the text
     * @param {string} str
     * @param {PDFKit.Mixins.TextOptions} opts
     * @returns {[number, number]} width, height
     */
    draw_string(p: import('./point.js').Point, str: string, opts?: PDFKit.Mixins.TextOptions): [number, number];
    /**
     * @param {import('./point.js').Point} p Center
     * @param {string} str
     * @param {string} klasses
     * @param {number} theta
     */
    draw_label(p: import('./point.js').Point, str: string, klasses: string, theta: number): void;
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} theta Angle in radians
     * @param {() => void} func All of the things created in the func are
     *   transformed
     */
    transform(x: number, y: number, theta: number, func: () => void): void;
}
import Driver from "./driver.js";
