/* eslint-disable no-invalid-this */
'use strict'

const log = require('log4js').getLogger()
const ast = require('./ast')
const pjson = require('../package')

module.exports = class Driver {
  constructor(diag, argv) {
    this.diag = diag
    this.props = diag.props
    this.top = null
    this.argv = argv

    this.width = this.columnx(diag.parts.length)
    this.height = this.timey(diag.max_time + 5)
    this.doc = this.document()
  }

  // eslint-disable-next-line class-methods-use-this
  draw_group(name) {
    // Override if needed
    return null
  }

  group(name, func) {
    const old = this.top
    this.top = this.draw_group(name)

    if (name) {
      log.debug('group:', name)
    }
    func.call(this, this.top)
    this.top = old
  }

  // eslint-disable-next-line class-methods-use-this
  meta(json) {
    // Override
  }

  // eslint-disable-next-line class-methods-use-this
  home_link(json) {
    // Override
  }

  draw(cb) {
    this.meta(pjson)
    if (!this.props.no_clear) {
      this.clear()
    }

    if (this.diag.title) {
      this.draw_label(
        this.pos((this.diag.parts.length - 1) / 2, -4),
        this.diag.title,
        'title'
      )
    }

    if (!this.props.no_link && !this.argv.n) {
      this.home_link(pjson)
    }

    this.group('participants', function() {
      this.diag.parts.forEach(function(part, i) {
        this.group(`Paricipant: ${part.desc}`, function() {
          this.draw_label(this.pos(part.col, -2), part.desc, 'rung_label')
          this.draw_line(
            this.pos(part.col, -1),
            this.pos(part.col, this.diag.max_time + 1),
            'rung'
          )
          if (!this.props.no_feet) {
            this.draw_label(
              this.pos(part.col, this.diag.max_time + 3),
              part.desc,
              'rung_label'
            )
          }
        })
      }, this)
    })

    this.diag.data.forEach(function(x) {
      switch (x.kind) {
        case ast.SELF:
          this.draw_self_arrow(x)
          break
        case ast.MESSAGE:
          this.draw_arrow(x)
          break
        case ast.BLOCK:
          this.draw_block(x)
          break
      }
    }, this)
    cb(null, this.doc)
  }

  columnx(col) {
    // TODO: make left margin configurable
    return (col + 0.5) * this.diag.props.column_width
  }

  timey(time) {
    // TODO: make top margin configurable
    return (time + 5) * this.diag.props.time_height
  }

  posa(x, y) {
    const that = this
    return {
      x,
      y,
      toString(suff) {
        suff = suff || ''
        return `x${suff}="${x}" y${suff}="${y}" `
      },
      att(el, suff) {
        suff = suff || ''
        el.att(`x${suff}`, x)
        el.att(`y${suff}`, y)
        return el
      },
      adjust(dx, dy) {
        return that.posa(x + dx, y + dy)
      },
    }
  }

  pos(col, tm) {
    if (typeof tm === 'undefined') {
      ({tm, col} = col)
    }
    const p = this.posa(this.columnx(col), this.timey(tm))
    p.col = col
    p.time = tm
    return p
  }

  midpoint(p1, p2) {
    return this.posa((p1.x + p2.x) / 2, (p1.y + p2.y) / 2)
  }

  // Override
  // eslint-disable-next-line class-methods-use-this
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

  draw_line(p1, p2, klass) {
    return this.draw_path(['M', p1, 'L', p2], klass)
  }

  draw_block(block) {
    const pad = ((block.depth + 1) * 5) + (this.props.rung_width / 2)
    const lt = this.pos(0, block.start).adjust(-pad, 0)
    this.group(`${block.typ}: ${block.msg}`, function() {
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
          this.pos(right, block.start).adjust(pad, 0),
          'L',
          this.pos(right, block.end).adjust(pad, 0),
          'L',
          this.pos(0, block.end).adjust(-pad, 0),
          'Z',
        ],
        'block'
      )
    })
  }

  draw_self_arrow(start) {
    const p1 = this.pos(start.from)
    const p2 = this.pos(start.to)
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
    this.group(`message: ${start}`, function() {
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
        const text_anchor = this.midpoint(p1, p2).adjust(
          self_width + this.props.label_space_x,
          -this.props.label_space_y
        )
        this.draw_label(text_anchor, start.msg, 'start')
      }
    })
  }

  // eslint-disable-next-line class-methods-use-this
  transform(x, y, theta, func) {
    throw new Error('transform not implemented')
  }

  arrow_head(p, theta, type) {
    this.transform(p.x, p.y, theta, function() {
      if (type === '>' || type === '<') {
        this.draw_path('M -10 4 L -1 0 L -10 -4 L -9 0 Z', 'closed')
      } else if (type === '#') {
        this.draw_path('M -10 4 L -1 -4', 'open')
        this.draw_path('M -10 -4 L -1 4', 'open')
      } else {
        this.draw_path('M -10 4 L -1 0 L -10 -4', 'open')
      }
    })
    return this.doc
  }

  draw_arrow(msg) {
    let p1 = this.pos(msg.from)
    let p2 = this.pos(msg.to)
    const half_rung = this.props.rung_width / 2

    let begin_adj = 0
    let end_adj = 0
    let end_angle = 0
    let text_anchor = 0
    let text_align = 0
    const l2r = p2.col > p1.col

    if (msg.arrow.end === '#') {
      p2 = this.midpoint(p1, p2)
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
      text_anchor = this.midpoint(p1, p2)
    }

    const rangle = Math.atan((p2.y - p1.y) / (p2.x - p1.x))

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
      this.draw_label(text_anchor, msg.msg, text_align, rangle)
    }
  }
}
