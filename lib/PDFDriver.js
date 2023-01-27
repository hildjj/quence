import Driver from './driver.js'
import PDF from 'pdfkit'
import {Point} from './point.js'

/** @extends Driver<void> */
export default class PDFDriver extends Driver {
  /**
   * @param {import('./ast.js').Diagram} diag
   * @param {import('./index.js').DrawOptions} argv
   */
  constructor(diag, argv) {
    super(diag, argv)
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
    this.doc = new PDF({size: [this.width, this.height]})
  }

  /**
   * Apply a css-like set of classes to the current document state
   *
   * @param  {String} klasses Space-separated list of class names
   * @return {object} Extra options that can't be set on doc, to
   *     apply to the draw routine that follows.
   */
  style(klasses) {
    const extras = {}
    if (klasses) {
      klasses.split(' ').forEach(klass => {
        const style = this.styles[klass]
        if (!style) {
          throw new Error(`Unknown class: "${klass}"`)
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

  /**
   * @param {import('stream').Writable} outstream
   * @returns {import('stream').Writable}
   */
  draw(outstream) {
    this.doc.pipe(outstream, {end: true})
    super.draw(outstream)
    this.doc.end()
    return outstream
  }

  clear() {
    this.doc.rect(0, 0, this.width, this.height).fill(this.props.background)
  }

  /**
   * @param {import('../package.js')} pjson
   */
  meta(pjson) {
    if (this.diag.title) {
      this.doc.info.Title = this.diag.title
    }
    this.doc.info.Creator = `${pjson.name}: ${pjson.homepage}`
  }

  /**
   * @param {import('../package.js')} pjson
   */
  home_link(pjson) {
    this.doc.save()
    let p = new Point(this.width, this.height).adjust(-5, -5)

    const [w] = this.draw_string(p, `v${pjson.version}`, this.style('version'))
    p = p.adjust(-w - 3, 0)
    const extra = {
      ...this.style('link'),
      link: pjson.homepage,
      underline: true,
      wordCount: 1,
      textWidth: this.doc.widthOfString(pjson.name),
    }
    this.draw_string(p, pjson.name, extra)
    this.doc.restore()
  }

  /**
   * @param {import('./point.js').Point} p Center bottom of the text
   * @param {string} str
   * @param {PDFKit.Mixins.TextOptions} opts
   * @returns {[number, number]} width, height
   */
  draw_string(p, str, opts = {}) {
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
    p = p.adjust(dx, -h - 3) // Make this more like SVG

    this.doc.text(str, p.x, p.y, opts)
    if (opts.link) {
      this.doc.link(p.x, p.y, w, h, opts.link)
    }
    return [w, h]
  }

  /**
   * @param {import('./point.js').Point} p Center
   * @param {string} str
   * @param {string} klasses
   * @param {number} theta
   */
  draw_label(p, str, klasses, theta) {
    if (!str || str.length === 0) {
      return
    }
    const angle = Point.deg(theta)
    this.doc.save()
    if (angle) {
      this.doc.rotate(angle, {origin: [p.x, p.y]})
    }
    this.draw_string(p, str, this.style(`text ${klasses}`))
    this.doc.restore()
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} theta Angle in radians
   * @param {() => void} func All of the things created in the func are
   *   transformed
   */
  transform(x, y, theta, func) {
    this.doc.save()
    if (x || y) {
      this.doc.translate(x, y)
    }
    if (theta) {
      // Clockwise in degrees
      const angle = Point.deg(theta)
      this.doc.rotate(angle, {origin: [0, 0]})
    }
    func.call(this)
    this.doc.restore()
  }

  /**
   * @param {string|(string|import('./point.js').Point)[]} cmds
   * @param {string} klasses
   */
  draw_path(cmds, klasses) {
    const d = super.draw_path(cmds, klasses)

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
    return ''
  }
}
