export default class SVGDriver extends Driver {
    path_count: number;
    /**
     * @type {xml.XMLElement}
     */
    doc: xml.XMLElement;
    /**
     * @returns {xml.XMLElement}
     */
    document(): xml.XMLElement;
    /**
     * @param {string} [name]
     * @returns {xml.XMLElement}
     */
    draw_group(name?: string): xml.XMLElement;
}
import Driver from "./driver.js";
import * as xml from "xmlbuilder";
