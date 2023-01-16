import Driver from './driver.js'
import fs from 'fs'
import l4js from 'log4js'
import xml from 'xmlbuilder'
const log = l4js.getLogger()

// Leave this in pre-expanded state, so multiple docs can use it.
let css_cache = null
function expand_cache(props) {
  // eslint-disable-next-line prefer-named-capture-group
  return css_cache.replace(/\[([^\]]+)]/g, (m, p1) => props[p1])
}

function get_css(props, cb) {
  if (css_cache) {
    cb(null, expand_cache(props))
    return
  }

  fs.readFile(
    new URL('svg.css', import.meta.url),
    {encoding: 'utf8'},
    (er, data) => {
      if (er) {
        log.error(er)
        cb(er)
        return
      }
      css_cache = data
      cb(null, expand_cache(props))
    }
  )
}

export default class SVGDriver extends Driver {
  constructor(...args) {
    super(...args)
    this.path_count = 0
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

  home_link(pjson) {
    const txt = this.doc.e('text', {
      'text-anchor': 'end',
    })
    this.posa(this.width, this.height).att(txt)
    txt.e('a', {'xl:href': pjson.homepage}).e(
      'tspan',
      {
        'baseline-shift': '100%',
        'fill': 'blue',
        'text-decoration': 'underline',
      },
      pjson.name
    )
    txt.e(
      'tspan',
      {
        'fill': this.props.text_color,
        'baseline-shift': '100%',
      },
      `v${pjson.version}`
    )
  }

  draw(outstream, cb) {
    const defs = this.doc.e('defs')

    get_css(this.props, (er, css) => {
      if (er) {
        cb.call(this, er)
        return
      }
      defs.e('style', {type: 'text/css'}, css)
      Driver.prototype.draw.call(this, err => {
        if (err) {
          cb.call(this, err)
          return
        }
        const s = this.doc.end({pretty: true})
        outstream.write(s, 'utf8')
        cb.call(this, null)
      })
    })
  }

  draw_group(name) {
    const g = this.top.e('g')
    if (name) {
      g.e('desc', name)
    }
    return g
  }

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

  draw_label(p, str, klass, angle) {
    if (!str || str.length === 0) {
      return null
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

    return p.att(txt)
  }

  draw_path(cmds, klasses) {
    const d = Driver.prototype.draw_path.call(this, cmds, klasses)

    return this.top.e('path', {
      d,
      id: `p_${this.path_count++}`,
      class: klasses,
    })
  }
}
