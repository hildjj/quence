import * as fs from 'fs'
import * as xml from 'xmlbuilder'
import Driver from './driver.js'
import {Point} from './point.js'

// Leave this in pre-expanded state, so multiple docs can use it.
let css_cache = null
function expand_cache(props) {
  // eslint-disable-next-line prefer-named-capture-group
  return css_cache.replace(/\[([^\]]+)]/g, (m, p1) => props[p1])
}

/**
 * @param {object} props
 * @param {string} [str]
 * @returns {string}
 */
function get_css(props, str) {
  if (str) {
    css_cache = str
  } else if (!css_cache) {
    css_cache = fs.readFileSync(new URL('svg.css', import.meta.url), 'utf8')
  }
  return expand_cache(props)
}

export default class SVGDriver extends Driver {
  /**
   * @param {import('./ast.js').Diagram} diag
   * @param {import('./index.js').DrawOptions} argv
   */
  constructor(diag, argv) {
    super(diag, argv)
    this.path_count = 0

    /**
     * @type {xml.XMLElement}
     */
    this.doc = this.document()
  }

  clear() {
    this.doc.e('rect', {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
      fill: this.props.background,
    })
  }

  /**
   * @returns {xml.XMLElement}
   */
  document() {
    const root = xml.create('svg')
    root.a('baseProfile', 'full')
    root.a('xmlns', 'http://www.w3.org/2000/svg')
    root.a('xmlns:xl', 'http://www.w3.org/1999/xlink')
    root.a('width', this.width)
    root.a('height', this.height)
    this.top = root
    return root
  }

  /**
   * @param {import('../package.js')} pjson
   */
  meta(pjson) {
    const m = this.doc.e('metadata', {
      'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
    })
    m.e('dc:date', null, new Date().toISOString())
    m.com(`Produced by ${pjson.name}: ${pjson.homepage}`)
    if (this.diag.title) {
      this.doc.e('title', this.diag.title)
    }
  }

  /**
   * @param {import('../package.js')} pjson
   */
  home_link(pjson) {
    const txt = this.doc.e('text', {class: 'home end'})
    new Point(this.width - 10, this.height - 10).att(txt)
    txt.e('a', {'xl:href': pjson.homepage}).e(
      'tspan',
      {
        'fill': 'blue',
        'text-decoration': 'underline',
      },
      pjson.name
    )
    txt.e(
      'tspan',
      {fill: this.props.text_color},
      `v${pjson.version}`
    )
  }

  /**
   * @param {import('stream').Writable} outstream
   * @returns {import('stream').Writable}
   */
  draw(outstream) {
    const defs = this.doc.e('defs')

    const css = get_css(this.props, this.argv.CSS)
    defs.e('style', {type: 'text/css'}, css)
    super.draw(outstream)
    const s = this.doc.end({pretty: true})
    outstream.end(s, 'utf8')
    return outstream
  }

  /**
   * @param {string} [name]
   * @returns {xml.XMLElement}
   */
  draw_group(name) {
    const g = this.top.e('g')
    if (name) {
      g.e('desc', name)
    }
    return g
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} theta Angle in radians
   * @param {() => void} func All of the things created in the func are
   *   transformed
   */
  transform(x, y, theta, func) {
    const tform = []
    if (x || y) {
      tform.push(`translate(${x}, ${y})`)
    }
    if (theta) {
      const ang = theta * 180 / Math.PI
      tform.push(`rotate(${ang})`)
    }
    if (tform.length > 0) {
      this.group(null, g => {
        g.att('transform', tform.join(', '))
        func.call(this, g)
      })
    } else {
      func.call(this, this.top)
    }
  }

  /**
   * @param {Point} p The center of the text
   * @param {string} str The text
   * @param {string} klass Spaces-separated CSS classes
   * @param {number} [angle] Angle in radians
   */
  draw_label(p, str, klass, angle) {
    if (!str || str.length === 0) {
      return
    }

    // TODO:
    // <switch>
    //   <foreignObject x="5" y="5" width="520" height="45" >
    //     <p xmlns="http://www.w3.org/1999/xhtml"
    //        style="font-family:DejaVu Sans; font-size:13px;
    //               font-weight: bold; text-align:center">that is that</p>
    //   </foreignObject>
    //   <text font-size="13" text-anchor="middle"
    //         font-family="DejaVu Sans" fill="black" x="225"
    //         y="20">that is that</text>
    // </switch>

    const txt = this.top.e('text', {class: klass}, str)
    if (angle) {
      // !undefined or !0
      angle = angle * 180 / Math.PI
      txt.att('transform', `rotate(${angle}, ${p.x}, ${p.y})`)
    }

    p.att(txt)
  }

  /**
   * @param {string|(string|Point)[]} cmds
   * @param {string} klasses
   * @returns {string}
   */
  draw_path(cmds, klasses) {
    const d = super.draw_path(cmds, klasses)

    return this.top.e('path', {
      d,
      id: `p_${this.path_count++}`,
      class: klasses,
    })
  }
}
