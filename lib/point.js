export class Point {
  /**
   * Create a point
   *
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    if (x == null || typeof x !== 'number' || Number.isNaN(x)) {
      throw new RangeError(`x is invalid "${x}"`)
    }
    if (y == null || typeof y !== 'number' || Number.isNaN(y)) {
      throw new RangeError(`y is invalid "${y}"`)
    }
    this.x = x
    this.y = y
  }

  /**
   * Midway between two points.
   *
   * @param {Point} p1
   * @param {Point} p2
   * @returns {Point}
   */
  static midpoint(p1, p2) {
    return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2)
  }

  /**
   * Angle, in radians, between the X axis and the line from p1 to p2.
   *
   * @param {Point} p1
   * @param {Point} p2
   * @returns {number} Angle in radians
   */
  static angle(p1, p2) {
    // This should use atan2, but that would require other changes.
    const dx = p2.x - p1.x
    if (dx === 0) {
      return Math.PI / 2
    }
    return Math.atan((p2.y - p1.y) / (p2.x - p1.x))
  }

  /**
   * @param {string} suffix
   * @returns {string}
   */
  toString(suffix = '') {
    return `x${suffix}="${this.x}" y${suffix}="${this.y}" `
  }

  /**
   * @param {import('xmlbuilder2/lib/interfaces').XMLBuilder} el
   * @param {*} suffix
   * @returns
   */
  att(el, suffix = '') {
    el.att(`x${suffix}`, String(this.x))
    el.att(`y${suffix}`, String(this.y))
    return el
  }

  /**
   * Translate a point by x, y.
   *
   * @param {number} dx
   * @param {number} dy
   * @returns {Point}
   */
  adjust(dx, dy) {
    return new Point(this.x + dx, this.y + dy)
  }
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
  constructor(driver, col, tm) {
    if (typeof col === 'object') {
      ({TM: tm, col} = col)
    }
    super(driver.columnx(col), driver.timey(tm))
    this.col = col
    this.time = tm
  }
}
