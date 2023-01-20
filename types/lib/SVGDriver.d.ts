export default class SVGDriver extends Driver {
    path_count: number;
    doc: xml.XMLElement;
    /** @type {xml.XMLElement} */
    top: xml.XMLElement;
    /**
     * @param {string} [name]
     * @returns {xml.XMLElement}
     */
    draw_group(name?: string): xml.XMLElement;
    /**
     * @param {string|(string|Point)[]} cmds
     * @param {string} klasses Space-separated CSS classes
     * @returns {any} Ignored
     */
    draw_path(cmds: string | (string | Point)[], klasses: string): any;
}
import Driver from "./driver.js";
import xml from "xmlbuilder";
import { Point } from "./point.js";
