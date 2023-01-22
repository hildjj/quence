import Driver from './driver.js'
import {Point} from './point.js'
import {create} from 'xmlbuilder2'
import fs from 'fs'

/**
 * @typedef {import('xmlbuilder2/lib/interfaces').XMLBuilder} Builder
 */

// Leave this in pre-expanded state, so multiple docs can use it.
let css_cache = null
function expand_cache(props, str) {
  // eslint-disable-next-line prefer-named-capture-group
  return str.replace(/\[([^\]]+)]/g, (m, p1) => props[p1])
}

/**
 * If str is supplied, use that as the CSS template.  Otherwise, read
 * ./svg.css and cache it as the template.  On the web, pass in str to
 * avoid the need for fs hacks.
 *
 * @param {object} props
 * @param {string} [str]
 * @returns {string}
 */
function get_css(props, str) {
  if (str) {
    return expand_cache(props, str)
  } else if (!css_cache) {
    css_cache = fs.readFileSync(new URL('svg.css', import.meta.url), 'utf8')
  }
  return expand_cache(props, css_cache)
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
     * @type {Builder}
     */
    this.doc2 = create()

    /**
     * @type {Builder}
     */
    this.root = this.doc2.ele('@svg', 'svg', {
      'xmlns:xl': 'http://www.w3.org/1999/xlink',
      'baseProfile': 'full',
      'width': this.width,
      'height': this.height,
    })

    /**
     * @type {Builder}
     */
    this.top = this.root
  }

  clear() {
    this.root.ele('rect', {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
      fill: this.props.background,
    })
  }

  /**
   * @param {import('../package.js')} pjson
   */
  meta(pjson) {
    const m = this.root.ele('metadata', {
      'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
    })
    m.ele('dc:date').txt(new Date().toISOString())
    m.com(`Produced by ${pjson.name} v${pjson.version}: ${pjson.homepage}`)

    if (this.diag.title) {
      this.root.ele('title').txt(this.diag.title)
    }
  }

  /**
   * @param {import('../package.js')} pjson
   */
  home_link(pjson) {
    const txt = this.root.ele('text', {class: 'home end'})
    new Point(this.width - 10, this.height - 10).att(txt)
    txt
      .ele('a', {'xl:href': pjson.homepage})
      .ele('tspan', {
        'fill': 'blue',
        'text-decoration': 'underline',
      })
      .txt(pjson.name)
    txt.ele(
      'tspan',
      {fill: this.props.text_color}
    ).txt(`v${pjson.version}`)
  }

  /**
   * @param {import('stream').Writable} outstream
   * @returns {import('stream').Writable}
   */
  draw(outstream) {
    const defs = this.root.ele('defs')

    const css = get_css(this.props, this.argv.CSS)
    defs.ele('style', {type: 'text/css'}).txt(css)
    super.draw(outstream)
    const s = this.root.end({prettyPrint: true})
    outstream.end(s, 'utf8')
    return outstream
  }

  /**
   * @param {string} [name]
   * @returns {Builder}
   */
  draw_group(name) {
    const g = this.top.ele('g')
    if (name) {
      g.ele('desc').txt(name)
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

    const txt = this.top.ele('text', {class: klass}).txt(str)
    if (angle) {
      // !undefined or !0
      angle = angle * 180 / Math.PI
      txt.att('transform', `rotate(${angle}, ${p.x}, ${p.y})`)
    }

    p.att(txt)
  }

  /**
   * @param {string|(string|Point)[]} cmds
   * @param {string} klasses Space-separated CSS classes
   * @returns {any} Ignored
   */
  draw_path(cmds, klasses) {
    // String return of super is only used here
    const d = super.draw_path(cmds, klasses)

    // This return is just to shut up typescript
    return this.top.ele('path', {
      d,
      id: `p_${this.path_count++}`,
      class: klasses,
    })
  }
}
