/**
 * @template [T=object]
 */
export default class Driver<T = any> {
    /**
     * @param {import('./ast.js').Diagram} diag
     * @param {import('./index.js').DrawOptions} argv
     */
    constructor(diag: import('./ast.js').Diagram, argv: import('./index.js').DrawOptions);
    diag: ast.Diagram;
    props: {
        arrow_color: string;
        arrow_height: number;
        arrow_width: number;
        auto_number: boolean;
        background: string;
        block_tab_fill: string;
        block_stroke: string;
        column_width: number;
        font: string;
        label_space_x: number;
        label_space_y: number;
        line_color: string;
        line_width: number;
        no_clear: boolean;
        no_feet: boolean;
        no_link: boolean;
        rung_color: string;
        rung_width: number;
        text_color: string;
        text_size: number;
        time_height: number;
    };
    /** @type {T} */
    top: T;
    argv: import("./index.js").DrawOptions;
    width: number;
    height: number;
    /**
     * @abstract
     */
    clear(): void;
    /**
     * @param {string} [name]
     * @returns {T} The group object, specific to driver type
     * @abstract
     */
    draw_group(name?: string): T;
    /**
     * @param {Point} p The center of the text
     * @param {string} str The text
     * @param {string} klass Spaces-separated CSS classes
     * @param {number} [angle] Angle in radians
     * @abstract
     */
    draw_label(p: Point, str: string, klass: string, angle?: number): void;
    /**
     * Group some stuff together.  Everything created inside the callback is
     * inside the group.
     *
     * @param {string} name
     * @param {(group: T) => void} func
     */
    group(name: string, func: (group: T) => void): void;
    /**
     * Write out the metadata associated with this quence version.
     *
     * @param {typeof pjson} json
     * @abstract
     */
    meta(json: typeof pjson): void;
    /**
     * Add a link to the quence home page
     *
     * @param {typeof pjson} json
     * @abstract
     */
    home_link(json: typeof pjson): void;
    /**
     * Draw the diagram to the given stream.
     *
     * @param {import('stream').Writable} outstream
     * @returns {import('stream').Writable} The same outstream
     */
    draw(outstream: import('stream').Writable): import('stream').Writable;
    /**
     * Get the x coordinate associated with a given column.
     *
     * @param {number} col
     * @returns {number} x
     */
    columnx(col: number): number;
    /**
     * Get the y coordinate associated with a given timestamp.  Negative numbers
     * are valid for headers, titile, etc.
     *
     * @param {number} time
     * @returns {number} x
     */
    timey(time: number): number;
    /**
     * @param {string|(string|Point)[]} cmds
     * @param {string} klasses
     * @virtual
     */
    draw_path(cmds: string | (string | Point)[], klasses: string): string;
    /**
     * Draw a line from p1 to p2.
     *
     * @param {Point} p1
     * @param {Point} p2
     * @param {string} klass CSS classes, space-separated
     */
    draw_line(p1: Point, p2: Point, klass: string): void;
    /**
     * @param {ast.Block} block
     */
    draw_block(block: ast.Block): void;
    /**
     * @param {ast.Note} note
     */
    draw_note(note: ast.Note): void;
    /**
     * @param {ast.SelfMessage} start
     */
    draw_self_arrow(start: ast.SelfMessage): void;
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} theta Angle in radians
     * @param {(t: T) => void} func All of the things created in the func are
     *   transformed
     * @abstract
     */
    transform(x: number, y: number, theta: number, func: (t: T) => void): void;
    /**
     * @param {Point} p Position of the point of the arrow
     * @param {number} theta Angle in Radians
     * @param {string} type Arrowhead type, e.g. ">"
     */
    arrow_head(p: Point, theta: number, type: string): void;
    /**
     * @param {ast.Message} msg
     */
    draw_arrow(msg: ast.Message): void;
}
import * as ast from "./ast.js";
import { Point } from "./point.js";
import * as pjson from "../package.js";
