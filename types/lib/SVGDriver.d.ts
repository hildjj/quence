export default class SVGDriver extends Driver {
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
     * @type {Builder}
     */
    top: Builder;
    /**
     * @param {string} [name]
     * @returns {Builder}
     */
    draw_group(name?: string): Builder;
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
