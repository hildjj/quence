import l4js from 'log4js'
const log = l4js.getLogger()

export const ADVANCE = 'ADVANCE'
export const MESSAGE = 'MESSAGE'
export const SELF = 'SELF'
export const BLOCK = 'BLOCK'
export const END_BLOCK = 'END_BLOCK'

class Participant {
  constructor(col, nm, desc) {
    this.col = col
    this.nm = nm
    this.desc = desc || nm
  }
}

class Participants {
  constructor() {
    this.map = {}
    this.list = []
    this.length = 0
  }

  find(nm) {
    const p = this.map[nm] || this.add(nm)
    return p.col
  }

  add(nm, desc) {
    let p = this.map[nm]
    if (p) {
      throw new Error(`Duplicate participant: "${nm}"`)
    }
    p = new Participant(this.length++, nm, desc)
    this.list.push(p)
    this.map[nm] = p
    return p
  }

  toJSON() {
    return this.list
  }

  forEach(func, that) {
    this.list.forEach((...args) => {
      func.apply(this, args)
    }, that || this)
  }
}

class Endpoint {
  constructor(nm, col, tm) {
    this.nm = nm
    this.col = col
    this.tm = tm === '' ? null : tm
  }

  compute(diag, start, duration) {
    duration = duration || 0
    const t = typeof start === 'undefined' ? diag.current_time : start
    switch (typeof this.tm) {
      case 'string':
        this.tm = diag.findTime(this.tm)
        break
      case 'number':
        /* No-op */ break
      default:
        this.tm = t + duration
        break
    }
  }

  toString() {
    return this.nm
  }
}

export class Arrow {
  constructor(begin, dash, end) {
    this.begin = begin
    this.dash = dash
    this.end = end
  }

  classes() {
    const ret = []
    if (this.begin === '<') {
      ret.push('closed_back')
    } else if (this.begin === '<<') {
      ret.push('open_back')
    }

    if (this.dash === '--') {
      ret.push('dashed')
    } else {
      ret.push('solid')
    }

    if (this.end === '>') {
      ret.push('closed_forward')
    } else if (this.end === '>>') {
      ret.push('open_forward')
    }

    return ret.join(' ')
  }

  toString() {
    return [this.begin, this.dash, this.end].join('')
  }
}

class Step {
  constructor(line, kind) {
    this._line = line
    this.kind = kind
  }

  compute(diag) {
    // Pure virtual
    log.fatal('Computing step from line:', this._line)
  }
}

class Advance extends Step {
  constructor(line, distance) {
    super(line, ADVANCE)
    this.distance = distance
  }

  compute(diag) {
    diag.current_time += this.distance
  }
}

class Message extends Step {
  // eslint-disable-next-line max-params
  constructor(line, tm, frm, arrow, to, msg, opts) {
    super(line, MESSAGE)
    this.opts = opts || {}
    if (tm !== '') {
      this.timepoint = tm
    }
    this.from = frm
    this.arrow = arrow
    this.classes = arrow.classes()
    this.to = to
    if (msg != null) {
      msg = msg.trim()
      if (msg !== '') {
        this.msg = msg
      }
    }
  }

  compute(diag) {
    if (typeof this.timepoint === 'string') {
      this.tm = diag.addTime(this.timepoint)
    }
    this.from.compute(diag)
    this.to.compute(diag, this.from.tm, this.opts.duration)
    this.msg = diag.autoNumber(this.msg)

    diag.incrTime(this.from.tm, this.to.tm, this.opts.advance)
  }

  toString() {
    return `${this.from} ${this.arrow} ${this.to}: ${this.msg}`
  }
}

class SelfMessage extends Message {
  // eslint-disable-next-line max-params
  constructor(line, tm, frm, arrow, to, msg, opts) {
    super(line, tm, frm, arrow, to, msg, opts)
    this.kind = SELF
  }

  compute(diag) {
    if (typeof this.timepoint === 'string') {
      this.tm = diag.addTime(this.timepoint)
    }
    this.from.compute(diag)
    const dur = Math.max(this.opts.duration || 0, 1)

    this.to.compute(diag, this.from.tm, dur)
    this.msg = diag.autoNumber(this.msg)

    diag.incrTime(this.from.tm, this.to.tm, this.opts.advance)
  }
}

class Block extends Step {
  constructor(line, typ, msg) {
    super(line, BLOCK)
    this.depth = 0
    this.typ = typ
    if (msg !== '') {
      this.msg = msg
    }
  }

  compute(diag) {
    this.start = diag.current_time
    diag.incrTime(this.start, this.start)
  }
}

class End extends Step {
  constructor(line, start) {
    super(line, END_BLOCK)
    this.start = start
  }

  compute(diag) {
    const t = diag.current_time
    this.start.end = t
    diag.incrTime(t, t)
  }
}

export class Diagram {
  constructor() {
    this.parts = new Participants()
    this.timepoints = {}
    this.title = null
    this.data = []
    this.blockStack = []
    this.props = {
      arrow_color: 'black',
      arrow_height: 10,
      arrow_width: 15,
      auto_number: false,
      background: 'white',
      block_tab_fill: 'gray',
      block_stroke: 'gray',
      column_width: 150,
      font: 'Helvetica',
      label_space_x: 3,
      label_space_y: -3,
      line_color: 'black',
      line_width: 1,
      no_clear: false,
      no_feet: false,
      no_link: false,
      rung_color: 'black',
      rung_width: 1,
      text_color: 'black',
      text_size: 13,
      time_height: 20,
    }

    this.current_time = 1
    this.max_time = 0
    this.current_arrow = 0
  }

  setTitle(title) {
    if (this.title !== null) {
      throw new Error(`Title already specified as: "${this.title}"`)
    }
    this.title = title.trim()
  }

  addStep(step) {
    if (!(step instanceof Step)) {
      throw new Error('Can only add steps')
    }
    this.data.push(step)
    return step
  }

  addAdvance(line, distance) {
    return this.addStep(new Advance(line, distance))
  }

  addEndpoint(nm, tm) {
    return new Endpoint(nm, this.parts.find(nm), tm)
  }

  // eslint-disable-next-line max-params
  addMessage(line, tm, frm, arrow, to, msg, opts) {
    let m = null
    if (frm.nm === to.nm) {
      m = new SelfMessage(line, tm, frm, arrow, to, msg, opts)
    } else {
      m = new Message(line, tm, frm, arrow, to, msg, opts)
    }
    return this.addStep(m)
  }

  addBlock(line, typ, msg) {
    const block = new Block(line, typ, msg)
    this.blockStack.forEach((b, i) => {
      b.depth = Math.max(this.blockStack.length - i, b.depth)
    }, this)
    this.blockStack.push(block)
    return this.addStep(block)
  }

  endBlock(line) {
    const start = this.blockStack.pop()
    if (!start) {
      throw new Error(`Unmatched end on line: ${line}`)
    }
    this.addStep(new End(line, start))
  }

  setProp(nm, val) {
    log.debug('Setting property:', nm, val)
    if (val === '') {
      val = true
    } else if (typeof val === 'string') {
      val = val.trim()
    }
    if (this.props[nm] === undefined) {
      throw new Error(`Unknown property: ${nm}`)
    }
    this.props[nm] = val
  }

  compute() {
    switch (this.blockStack.length) {
      case 0:
        break
      case 1:
        throw new Error(
          `Unended block start: ${JSON.stringify(this.blockStack[0])}`
        )
      default:
        throw new Error(
          `Unended block starts: ${JSON.stringify(this.blockStack)}`
        )
    }
    this.data.forEach(d => {
      d.compute(this)
    }, this)
  }

  addTime(tm) {
    if (Object.prototype.hasOwnProperty.call(this.timepoints, tm)) {
      throw new Error(`Duplicate timepoint: "${tm}"`)
    }
    const t = this.current_time
    this.timepoints[tm] = t
    return t
  }

  findTime(tm) {
    const t = this.timepoints[tm]
    if (typeof t === 'undefined') {
      throw new Error(`Unknown timepoint: "${tm}"`)
    }
    return t
  }

  incrTime(start, end, increment) {
    const later_time = Math.max(start, end)
    this.max_time = Math.max(this.current_time, later_time)
    this.current_time = later_time + (increment || 1)
  }

  autoNumber(str) {
    if (this.props.auto_number) {
      return (`[${this.current_arrow++}] ${str || ''}`).trim()
    }
    return str
  }
}
