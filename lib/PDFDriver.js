import Driver from './driver.js'
import PDF from 'pdfkit'
import l4js from 'log4js'
const log = l4js.getLogger()

export default class PDFDriver extends Driver {
  constructor(...args) {
    super(...args)
    const p = this.props
    this.styles = {
      text: {
        font: p.font,
        fontSize: p.text_size,
        fillColor: p.text_color,
      },
      title: {},
      rung_label: {},
      path: {
        strokeColor: p.line_color,
        lineWidth: p.line_width,
      },
      rung: {
        strokeColor: p.rung_color,
        lineWidth: p.rung_width,
      },
      start: {
        align: 'left',
      },
      end: {
        align: 'right',
      },
      center: {
        font: p.font,
        fontSize: p.text_size,
        fillColor: p.text_color,
        align: 'center',
      },
      open: {
        strokeColor: p.arrow_color,
        lineCap: 'round',
      },
      closed: {
        fillColor: p.arrow_color,
        strokeColor: p.arrow_color,
        drawStyle: 'fillAndStroke',
      },
      dashed: {
        dash: [6, {space: 2}],
      },
      solid: {
        undash: true,
      },
      block: {
        strokeColor: p.block_stroke,
        dash: [2, {space: 1}],
        lineJoin: 'round',
      },
      block_tab: {
        fill: p.block_tab_fill,
        drawStyle: 'fill',
      },
      closed_forward: {},
      open_forward: {},
      closed_back: {},
      open_back: {},
      self: {},
      link: {
        fillColor: 'blue',
        align: 'end',
      },
      version: {
        fillColor: p.text_color,
        align: 'end',
      },
    }

    this.path_count = 0
  }

  /**
   * Apply a css-like set of classes to the current document state
   * @param  {String} klasses Space-separated list of class names
   * @return {Object} Extra options that can't be set on doc, to
   *     apply to the draw routine that follows.
   */
  style(klasses) {
    const extras = {}
    if (klasses) {
      klasses.split(' ').forEach(klass => {
        const style = this.styles[klass]
        if (!style) {
          log.warn('Unknown class:', klass)
          return
        }
        Object.keys(style).forEach(key => {
          const val = style[key]
          if (key in this.doc) {
            if (Array.isArray(val)) {
              this.doc[key](...val)
            } else {
              this.doc[key](val)
            }
          } else {
            extras[key] = val
          }
        })
      })
    }
    return extras
  }

  // Note that the stream will not be done writing when the callback
  // fires.  For files, that's what we want.  Listen for the `finish`
  // event on outstream if you want to know when it's done.
  draw(outstream, cb) {
    this.doc.pipe(outstream, {end: true})
    super.draw(er => {
      if (er == null) {
        this.doc.end()
        cb(null)
      } else {
        cb(er)
      }
    })
  }

  clear() {
    this.doc.rect(0, 0, this.width, this.height).fill(this.props.background)
  }

  document() {
    return new PDF({size: [this.width, this.height]})
  }

  meta(pjson) {
    if (this.diag.title) {
      this.doc.info.Title = this.diag.title
    }
    this.doc.info.Creator = `${pjson.name}: ${pjson.homepage}`
  }

  home_link(pjson) {
    // TODO: move up into the driver.
    this.doc.save()
    let p = this.posa(this.width, this.height).adjust(-5, -5)

    const wh = this.draw_string(p, `v${pjson.version}`, this.style('version'))
    p = p.adjust(-wh[0] - 3, 0)
    const extra = {
      ...this.style('link'),
      link: pjson.homepage,
      underline: 'blue',
      wordCount: 1,
      textWidth: this.doc.widthOfString(pjson.name),
    }
    this.draw_string(p, pjson.name, extra)
    this.doc.restore()
  }

  draw_string(p, str, opts) {
    opts = opts || {}
    const align = opts.align || 'center'
    opts.lineBreak = false

    const w = this.doc.widthOfString(str)
    const h = this.doc.currentLineHeight()
    let dx = 0
    switch (align) {
      case 'center':
        dx = -w / 2
        break
      case 'end':
      case 'right':
        dx = -w
        break
    }
    p = p.adjust(dx, -h)

    this.doc.text(str, p.x, p.y, opts)
    if (opts.underline) {
      this.doc.underline(
        p.x,
        p.y,
        w,
        h,
        {color: opts.underline, ...opts}
      )
    }
    if (opts.link) {
      this.doc.link(p.x, p.y, w, h, opts.link)
    }
    return [w, h]
  }

  draw_label(p, str, klasses, theta) {
    if (!str || str.length === 0) {
      return null
    }
    const angle = theta * 180 / Math.PI % 360
    this.doc.save()
    if (angle) {
      this.doc.rotate(angle, {origin: [p.x, p.y]})
    }
    this.draw_string(p, str, this.style(`text ${klasses}`))
    this.doc.restore()
    return this.doc
  }

  transform(x, y, theta, func) {
    this.doc.save()
    if (x || y) {
      this.doc.translate(x, y)
    }
    if (theta) {
      // Clockwise in degrees
      const angle = theta * 180 / Math.PI % 360
      this.doc.rotate(angle, {origin: [0, 0]})
    }
    func.call(this)
    this.doc.restore()
  }

  draw_path(cmds, klasses) {
    const d = Driver.prototype.draw_path.call(this, cmds, klasses)

    this.doc.save()
    const extra = this.style(`path ${klasses}`) || {}
    this.doc.path(d)
    switch (extra.drawStyle) {
      case 'fill':
        this.doc.fill()
        break
      case 'fillAndStroke':
        this.doc.fillAndStroke()
        break
      default:
        this.doc.stroke()
        break
    }
    this.doc.restore()
    return this.doc
  }
}
