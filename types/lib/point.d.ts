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
    col: any;
    time: any;
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
export class Position extends Point {
    constructor(driver: any, col: any, tm: any);
}
