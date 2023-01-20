export class Point {
    /**
     * Midway between two points.
     *
     * @param {Point} p1
     * @param {Point} p2
     * @returns {Point}
     */
    static midpoint(p1: Point, p2: Point): Point;
    /**
     * Angle, in radians, between the X axis and the line from p1 to p2.
     *
     * @param {Point} p1
     * @param {Point} p2
     * @returns {number} Angle in radians
     */
    static angle(p1: Point, p2: Point): number;
    /**
     * Create a point
     *
     * @param {number} x
     * @param {number} y
     */
    constructor(x: number, y: number);
    x: number;
    y: number;
    /**
     * @param {string} suffix
     * @returns {string}
     */
    toString(suffix?: string): string;
    /**
     * @param {import('xmlbuilder').XMLElement} el
     * @param {*} suffix
     * @returns
     */
    att(el: import('xmlbuilder').XMLElement, suffix?: any): import("xmlbuilder").XMLElement;
    /**
     * Translate a point by x, y.
     *
     * @param {number} dx
     * @param {number} dy
     * @returns {Point}
     */
    adjust(dx: number, dy: number): Point;
}
/**
 * Position is a point that was identified by a column and time, which is
 * converted to the correct x/y for a diagram.
 */
export class Position extends Point {
    /**
     * @param {import('./driver.js').default} driver
     * @param {number|import('./ast.js').Endpoint} col Column or endpoint
     *   containing both time and column.
     * @param {number} [tm] Time
     */
    constructor(driver: import('./driver.js').default, col: number | import('./ast.js').Endpoint, tm?: number);
    col: number;
    time: number;
}
