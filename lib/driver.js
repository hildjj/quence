/* eslint-disable class-methods-use-this */
import * as ast from './ast.js'
import * as pjson from '../package.js'
import {Point, Position} from './point.js'
import l4js from 'log4js'
const log = l4js.getLogger()

export default class Driver {
  /**
   * @param {import('./ast.js').Diagram} diag
   * @param {import('./index.js').DrawOptions} argv
   */
  constructor(diag, argv) {
    this.diag = diag
    this.props = diag.props
    this.top = null
    this.argv = argv
    this.argv.property?.forEach(opt => {
      const [k, v] = opt.split('=').map(s => s.trim())

      /**
       * @type {string|boolean|number}
       */
      let value = v
      if (v === undefined || v === 'true') {
        value = true
      } else if (v === 'false') {
        value = false
      } else if (typeof diag.props[k] === 'number') {
        value = parseInt(v, 10)
        if (Number.isNaN(value)) {
          throw new Error(`"${v}" not a valid number, required for "${k}"`)
        }
      }
      diag.setProp(k, value)
    })

    this.width = this.columnx(diag.parts.length)
    this.height = this.timey(diag.max_time + 5)
  }

  /**
   * @abstract
   */
  clear() {
    // Default is a no-op
  }

  /**
   * @param {string} [name]
   * @returns {any} The group object, specific to driver type
   * @abstract
   */
  draw_group(name) {
    // Default is a no-op
  }

  /**
   * @param {Point} p The center of the text
   * @param {string} str The text
   * @param {string} klass Spaces-separated CSS classes
   * @param {number} [angle] Angle in radians
   * @abstract
   */
  draw_label(p, str, klass, angle) {
    // Default is a no-op
  }

  /**
   * Group some stuff together.  Everything created inside the callback is
   * inside the group.
   *
   * @param {string} name
   * @param {(group: any) => void} func
   */
  group(name, func) {
    const old = this.top
    this.top = this.draw_group(name)

    if (name) {
      log.debug('group:', name)
    }
    func.call(this, this.top)
    this.top = old
  }

  /**
   * Write out the metadata associated with this quence version.
   *
   * @param {typeof pjson} json
   * @abstract
   */
  meta(json) {
    // Pure virtual
    throw new Error('meta() not implemented')
  }

  /**
   * Add a link to the quence home page
   *
   * @param {typeof pjson} json
   * @abstract
   */
  home_link(json) {
    // Pure virtual
    throw new Error('home_link() not implemented')
  }

  /**
   * Draw the diagram to the given stream.
   *
   * @param {import('stream').Writable} outstream
   * @returns {import('stream').Writable} The same outstream
   */
  draw(outstream) {
    this.meta(pjson)
    if (!this.props.no_clear) {
      this.clear()
    }

    if (this.diag.title) {
      this.draw_label(
        new Position(this, (this.diag.parts.length - 1) / 2, -4),
        this.diag.title,
        'title'
      )
    }

    if (!this.props.no_link && !this.argv.nolink) {
      this.home_link(pjson)
    }

    this.group('participants', () => {
      this.diag.parts.forEach((part, i) => {
        this.group(`Paricipant: ${part.desc}`, () => {
          this.draw_label(new Position(this, part.col, -2), part.desc, 'rung_label')
          this.draw_line(
            new Position(this, part.col, -1),
            new Position(this, part.col, this.diag.max_time + 1),
            'rung'
          )
          if (!this.props.no_feet) {
            this.draw_label(
              new Position(this, part.col, this.diag.max_time + 3),
              part.desc,
              'rung_label'
            )
          }
        })
      }, this)
    })

    this.diag.data.forEach(x => {
      switch (x.kind) {
        case ast.Kind.SELF:
          this.draw_self_arrow(/** @type {ast.SelfMessage} */ (x))
          break
        case ast.Kind.MESSAGE:
          this.draw_arrow(/** @type {ast.Message} */ (x))
          break
        case ast.Kind.BLOCK:
          this.draw_block(/** @type {ast.Block} */ (x))
          break
        case ast.Kind.NOTE:
          this.draw_note(/** @type {ast.Note} */ (x))
          break
      }
    }, this)
    return outstream
  }

  /**
   * Get the x coordinate associated with a given column.
   *
   * @param {number} col
   * @returns {number} x
   */
  columnx(col) {
    // TODO: make left margin configurable
    return (col + 0.5) * this.diag.props.column_width
  }

  /**
   * Get the y coordinate associated with a given timestamp.  Negative numbers
   * are valid for headers, titile, etc.
   *
   * @param {number} time
   * @returns {number} x
   */
  timey(time) {
    // TODO: make top margin configurable
    return (time + 5) * this.diag.props.time_height
  }

  /**
   * @param {string|(string|Point)[]} cmds
   * @param {string} klasses
   * @virtual
   */
  draw_path(cmds, klasses) {
    let d = null
    if (typeof cmds === 'string') {
      d = cmds
    } else {
      d = cmds
        .map(c => {
          if (typeof c === 'string') {
            return c
          }
          return `${c.x} ${c.y}`
        })
        .join(' ')
    }
    return d
  }

  /**
   * Draw a line from p1 to p2.
   *
   * @param {Point} p1
   * @param {Point} p2
   * @param {string} klass CSS classes, space-separated
   */
  draw_line(p1, p2, klass) {
    this.draw_path(['M', p1, 'L', p2], klass)
  }

  /**
   * @param {ast.Block} block
   */
  draw_block(block) {
    const pad = ((block.depth + 1) * 5) + (this.props.rung_width / 2)
    const lt = new Position(this, 0, block.start).adjust(-pad, 0)
    this.group(`${block.typ}: ${block.msg}`, () => {
      this.draw_path(
        [
          'M',
          lt.adjust(0, -15),
          'L',
          lt.adjust(35, -15),
          'L',
          lt.adjust(35, 0),
          'L',
          lt,
          'Z',
        ],
        'block_tab'
      )

      this.draw_label(lt.adjust(5, -2), block.typ, 'start')

      if (block.msg) {
        this.draw_label(lt.adjust(40, -2), block.msg, 'start')
      }

      const right = this.diag.parts.length - 1
      this.draw_path(
        [
          'M',
          lt.adjust(0, -15),
          'L',
          lt.adjust(35, -15),
          'L',
          lt.adjust(35, 0),
          'L',
          new Position(this, right, block.start).adjust(pad, 0),
          'L',
          new Position(this, right, block.end).adjust(pad, 0),
          'L',
          new Position(this, 0, block.end).adjust(-pad, 0),
          'Z',
        ],
        'block'
      )
    })
  }

  /**
   * @param {ast.Note} note
   */
  draw_note(note) {
    const p = new Position(this, note.from)
    let adjust_dir = 1
    let align = 'start'

    if (note.from.col === this.diag.parts.length - 1) {
      adjust_dir = -1
      align = 'end'
    }

    this.draw_label(p.adjust(adjust_dir * (3 + (this.props.rung_width / 2)),
      this.diag.props.time_height / 4), note.msg, align)
  }

  /**
   * @param {ast.SelfMessage} start
   */
  draw_self_arrow(start) {
    const p1 = new Position(this, start.from)
    const p2 = new Position(this, start.to)
    let end = p2
    const self_width = this.props.column_width / 4
    const half_rung = this.props.rung_width / 2
    let begin_adj = 0
    let end_adj = 1
    if (start.arrow.begin) {
      begin_adj = 1
    }

    if (start.arrow.end === '#') {
      end = p2.adjust(self_width / 2, 0)
      end_adj *= 5
    }
    this.group(`message: ${start}`, () => {
      this.draw_path(
        [
          'M',
          p1.adjust(half_rung + begin_adj, 0),
          'L',
          p1.adjust(self_width, 0),
          'L',
          p2.adjust(self_width, 0),
          'L',
          end.adjust(half_rung + end_adj, 0),
        ],
        `${start.arrow.classes()} self`
      )

      this.arrow_head(end.adjust(half_rung, 0), Math.PI, start.arrow.end)
      if (start.arrow.begin) {
        this.arrow_head(p1.adjust(half_rung, 0), Math.PI, start.arrow.begin)
      }

      if (start.msg) {
        const text_anchor = Point.midpoint(p1, p2).adjust(
          self_width + this.props.label_space_x,
          -this.props.label_space_y
        )
        this.draw_label(text_anchor, start.msg, 'start')
      }
    })
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} theta Angle in radians
   * @param {() => void} func All of the things created in the func are
   *   transformed
   * @abstract
   */
  transform(x, y, theta, func) {
    // Pure virtual
    throw new Error('transform() not implemented')
  }

  /**
   * @param {Point} p Position of the point of the arrow
   * @param {number} theta Angle in Radians
   * @param {string} type Arrowhead type, e.g. ">"
   */
  arrow_head(p, theta, type) {
    this.transform(p.x, p.y, theta, () => {
      if (type === '>' || type === '<') {
        this.draw_path('M -10 4 L -1 0 L -10 -4 L -9 0 Z', 'closed')
      } else if (type === '#') {
        this.draw_path('M -10 4 L -1 -4', 'open')
        this.draw_path('M -10 -4 L -1 4', 'open')
      } else {
        this.draw_path('M -10 4 L -1 0 L -10 -4', 'open')
      }
    })
  }

  /**
   * @param {ast.Message} msg
   */
  draw_arrow(msg) {
    let p1 = new Position(this, msg.from)
    let p2 = new Position(this, msg.to)
    const half_rung = this.props.rung_width / 2

    let begin_adj = 0
    let end_adj = 0
    let end_angle = 0
    let text_anchor = null
    let text_align = ''
    const l2r = p2.col > p1.col

    if (msg.arrow.end === '#') {
      p2 = Point.midpoint(p1, p2)
    }

    // Bring each end of the line to the edge of the rung
    if (l2r) {
      // Left-to-right
      p1 = p1.adjust(half_rung, 0)
      p2 = p2.adjust(-half_rung, 0)
      end_adj = -1

      // Move over from the left a little
      text_align = 'start'
      text_anchor = p1.adjust(this.props.label_space_x, 0)
      end_angle = 0
    } else {
      // Right-to-left
      p1 = p1.adjust(-half_rung, 0)
      p2 = p2.adjust(half_rung, 0)
      end_adj = 1

      // Move over from the right a little
      text_align = 'end'
      text_anchor = p1.adjust(-this.props.label_space_x, 0)
      end_angle = Math.PI
    }
    if (msg.arrow.end === '#') {
      end_adj *= 5
    }

    if (msg.arrow.begin) {
      begin_adj = 1
      text_align = 'center'
      text_anchor = Point.midpoint(p1, p2)
    }

    const rangle = Point.angle(p1, p2)

    this.draw_line(
      p1.adjust(begin_adj * Math.cos(rangle), begin_adj * Math.sin(rangle)),
      p2.adjust(end_adj * Math.cos(rangle), end_adj * Math.sin(rangle)),
      msg.arrow.classes()
    )

    this.arrow_head(p2, rangle + end_angle, msg.arrow.end)

    if (msg.arrow.begin) {
      this.arrow_head(p1, rangle + Math.PI, msg.arrow.begin)
    }

    if (msg.msg) {
      // Ooch this up a few pixels, because baseline-offset doesn't work
      // anymore.  There's certainly a CSS way to do this.
      this.draw_label(text_anchor.adjust(0, -2), msg.msg, text_align, rangle)
    }
  }
}
