/**
 * @extends {Driver<Builder>}
 */
export default class SVGDriver extends Driver<import("xmlbuilder2/lib/interfaces.js").XMLBuilder> {
    /**
     * @param {import('./ast.js').Diagram} diag
     * @param {import('./index.js').DrawOptions} argv
     */
    constructor(diag: import('./ast.js').Diagram, argv: import('./index.js').DrawOptions);
    path_count: number;
    /**
     * @type {Builder}
     */
    doc2: Builder;
    /**
     * @type {Builder}
     */
    root: Builder;
    /**
     * @param {string|(string|Point)[]} cmds
     * @param {string} klasses Space-separated CSS classes
     * @returns {any} Ignored
     */
    draw_path(cmds: string | (string | Point)[], klasses: string): any;
}
export type Builder = import('xmlbuilder2/lib/interfaces').XMLBuilder;
import Driver from "./driver.js";
import { Point } from "./point.js";
