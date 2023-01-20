export default class PDFDriver extends Driver {
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
     * @returns {PDF}
     */
    document(): PDFKit.PDFDocument;
    /**
     * @param {import('./point.js').Point} p
     * @param {string} str
     * @param {object} opts
     * @returns {[number, number]}
     */
    draw_string(p: import('./point.js').Point, str: string, opts: object): [number, number];
    /**
     * @param {import('./point.js').Point} p Center
     * @param {string} str
     * @param {string} klasses
     * @param {number} theta
     */
    draw_label(p: import('./point.js').Point, str: string, klasses: string, theta: number): void;
}
import Driver from "./driver.js";
