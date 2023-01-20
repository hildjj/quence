import l4js from 'log4js'
const log = l4js.getLogger()

/**
 * The different kinds of Steps.
 *
 * @enum {string}
 */
export const Kind = {
  ADVANCE: 'ADVANCE',
  MESSAGE: 'MESSAGE',
  SELF: 'SELF',
  BLOCK: 'BLOCK',
  END_BLOCK: 'END_BLOCK',
  NOTE: 'NOTE',
}

class Participant {
  /**
   * Create a Participant
   *
   * @param {number} col Column number
   * @param {string} nm Short name
   * @param {string} [desc] Longer description, defaults to nm
   */
  constructor(col, nm, desc) {
    this.col = col
    this.nm = nm
    this.desc = desc ?? nm
  }
}

class Participants {
  constructor() {
    /**
     * @type {Record<string,Participant>}
     */
    this.map = {}

    /**
     * @type {Participant[]}
     */
    this.list = []
    this.length = 0
  }

  /**
   * Find the column for a given short name.  Creates a new participant
   * if the name does not already exist.
   *
   * @param {string} nm Short name for the participant
   * @returns {number} The column for the given short name
   */
  find(nm) {
    const p = this.map[nm] ?? this.add(nm)
    return p.col
  }

  /**
   * Add a new Participant to the list.
   *
   * @param {string} nm
   * @param {string} [desc]
   * @returns {Participant} The new participant
   * @throws {Error} if participant already exists
   */
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

  /**
   * When converting to JSON, just supply the participant list.
   *
   * @returns {Participant[]}
   */
  toJSON() {
    return this.list
  }

  /**
   * Call a function on each participant.
   *
   * @param {(p: Participant) => void} func function to call
   * @param {any} [that] Object to use as "this" for the function
   */
  forEach(func, that) {
    that = that ?? this
    this.list.forEach((...args) => {
      func.apply(that, args)
    })
  }
}

class Endpoint {
  /**
   * One end of a line.
   *
   * @param {string} nm Name
   * @param {number} col Column
   * @param {string|number} [tm] Timestamp for this endpoint
   */
  constructor(nm, col, tm) {
    this.nm = nm
    this.col = col
    // After compute is run, this should always be a number.
    // TODO: I can't figure out why all of my attempts to make this
    // type safe haven't worked, but it's something about this.tm
    // being set after the constructor but before compute.
    // In the meantime, the TM getter below.
    this.tm = tm === '' ? null : tm
  }

  /**
   * @returns {number}
   */
  get TM() {
    if (typeof this.tm !== 'number') {
      throw new Error(`Order of operations issue with tm: ${this.tm}`)
    }
    return this.tm
  }

  /**
   * Compute the associated timestamp, if needed
   *
   * @param {Diagram} diag
   * @param {number} [start] Start
   * @param {number} [duration=0]
   */
  compute(diag, start, duration = 0) {
    switch (typeof this.tm) {
      case 'string':
        this.tm = diag.findTime(this.tm)
        break
      case 'number':
        // No-op
        break
      default:
        this.tm = (start ?? diag.current_time) + duration
        break
    }
  }

  /**
   * Convert to string.
   *
   * @returns {string}
   */
  toString() {
    return String(this.nm)
  }
}

export class Arrow {
  /**
   * Arrowheads
   *
   * @param {string} begin Either "<", "<<", or ""
   * @param {string} dash Either "-" or "--"
   * @param {string} end Either ">", ">>", or "#"
   */
  constructor(begin, dash, end) {
    this.begin = begin
    this.dash = dash
    this.end = end
  }

  /**
   * Calculates the correct space-separated CSS classes for this line.
   *
   * @returns {string}
   */
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

  /**
   * Converts to string.
   *
   * @returns {string}
   */
  toString() {
    return [this.begin, this.dash, this.end].join('')
  }
}

// Exported for testing
export class Step {
  /**
   * Generic step
   *
   * @param {number} line Line number from the source file
   * @param {Kind} kind What kind of step?
   */
  constructor(line, kind) {
    this._line = line
    this.kind = kind
  }

  /**
   * Compute things about this step once it's in place in the diagram.
   *
   * @param {Diagram} diag
   * @abstract
   */
  compute(diag) {
    log.fatal('Computing step from line:', this._line)
    throw new Error('Pure virtual')
  }
}

class Advance extends Step {
  /**
   * Advance by some amount of time, rather than drawing a line.
   *
   * @param {number} line Line number from the source file
   * @param {number} distance Number of rungs to advance
   */
  constructor(line, distance) {
    super(line, Kind.ADVANCE)
    this.distance = distance
  }

  /**
   * @param {Diagram} diag
   */
  compute(diag) {
    diag.current_time += this.distance
  }
}

export class Note extends Step {
  /**
   * Add a note next to a participant line.
   *
   * @param {number} line Line number from the source file
   * @param {Endpoint} from Where the note originates
   * @param {string} msg The message text
   */
  constructor(line, from, msg) {
    super(line, Kind.NOTE)
    this.from = from
    this.msg = msg
    if (msg != null) {
      msg = msg.trim()
      if (msg !== '') {
        this.msg = msg
      }
    }
  }

  /**
   * @param {Diagram} diag
   */
  compute(diag) {
    this.from.compute(diag)
    this.msg = diag.autoNumber(this.msg)
    diag.incrTime(this.from.TM, this.from.TM, 1)
  }
}

/**
 * @typedef {object} MessageProperties
 * @property {number} [advance=1]
 * @property {number} [duration=1]
 */

export class Message extends Step {
  /**
   * @param {number} line Line number from the source file
   * @param {string} tm
   * @param {Endpoint} frm
   * @param {Arrow} arrow
   * @param {Endpoint} to
   * @param {string} msg
   * @param {MessageProperties} [opts]
   */
  // eslint-disable-next-line max-params
  constructor(line, tm, frm, arrow, to, msg, opts) {
    super(line, Kind.MESSAGE)

    /**
     * @type {MessageProperties}
     */
    this.opts = opts ?? {}
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

  /**
   * @param {Diagram} diag
   */
  compute(diag) {
    if (typeof this.timepoint === 'string') {
      this.tm = diag.addTime(this.timepoint)
    }
    this.from.compute(diag)
    this.to.compute(diag, this.from.TM, this.opts.duration)
    this.msg = diag.autoNumber(this.msg)

    diag.incrTime(this.from.TM, this.to.TM, this.opts.advance)
  }

  toString() {
    return `${this.from} ${this.arrow} ${this.to}: ${this.msg}`
  }
}

export class SelfMessage extends Message {
  /**
   * @param {number} line Line number from the source file
   * @param {string} tm
   * @param {Endpoint} frm
   * @param {Arrow} arrow
   * @param {Endpoint} to
   * @param {string} msg
   * @param {object} [opts]
   */
  // eslint-disable-next-line max-params
  constructor(line, tm, frm, arrow, to, msg, opts) {
    super(line, tm, frm, arrow, to, msg, opts)
    this.kind = Kind.SELF
  }

  /**
   * @param {Diagram} diag
   */
  compute(diag) {
    if (typeof this.timepoint === 'string') {
      this.tm = diag.addTime(this.timepoint)
    }
    this.from.compute(diag)
    const dur = Math.max(this.opts.duration ?? 0, 1)

    this.to.compute(diag, this.from.TM, dur)
    this.msg = diag.autoNumber(this.msg)

    diag.incrTime(this.from.TM, this.to.TM, this.opts.advance)
  }
}

export class Block extends Step {
  /**
   * @param {number} line Line number from the source file
   * @param {"loop"|"opt"} typ Type of block
   * @param {string} msg Associated message
   */
  constructor(line, typ, msg) {
    super(line, Kind.BLOCK)
    this.depth = 0
    this.typ = typ
    this.msg = (msg === '') ? null : msg

    /**
     * @type {number|null}
     */
    this.start = null

    /**
     * @type {number|null}
     */
    this.end = null
  }

  /**
   * @param {Diagram} diag
   */
  compute(diag) {
    this.start = diag.current_time
    diag.incrTime(this.start, this.start)
  }
}

class BlockEnd extends Step {
  /**
   * End of a block
   *
   * @param {number} line Line number from the source file
   * @param {Block} start Time where the block started
   */
  constructor(line, start) {
    super(line, Kind.END_BLOCK)
    this.start = start
  }

  /**
   * @param {Diagram} diag
   */
  compute(diag) {
    const t = diag.current_time
    this.start.end = t
    diag.incrTime(t, t)
  }
}

export class Diagram {
  constructor() {
    this.parts = new Participants()

    /**
     * @type {Record<string, number>}
     */
    this.timepoints = {}

    /**
     * @type {string}
     */
    this.title = null

    /**
     * @type {Step[]}
     */
    this.data = []

    /**
     * @type {Block[]}
     */
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

  /**
   * @param {string} title
   */
  setTitle(title) {
    if (this.title !== null) {
      throw new Error(`Title already specified as: "${this.title}"`)
    }
    this.title = title.trim()
  }

  /**
   * @template {Step} T
   * @param {T} step
   * @returns {T}
   */
  addStep(step) {
    if (!(step instanceof Step)) {
      throw new Error('Can only add steps')
    }
    this.data.push(step)
    return step
  }

  /**
   * @param {number} line Line number from the source file
   * @param {number} distance Number of rungs to advance
   * @returns {Advance}
   */
  addAdvance(line, distance) {
    return this.addStep(new Advance(line, distance))
  }

  /**
   *
   * @param {number} line Line number from the source file
   * @param {Endpoint} from Where to put the note
   * @param {string} msg The note text
   * @returns {Note}
   */
  addNote(line, from, msg) {
    return this.addStep(new Note(line, from, msg))
  }

  /**
   * @param {string} nm Name
   * @param {string|number} [tm] Timepoint
   * @returns {Endpoint}
   */
  addEndpoint(nm, tm) {
    return new Endpoint(nm, this.parts.find(nm), tm)
  }

  /**
   * Add a message from one endpoint throun an arrow to another endpoint,
   * perhaps with a message and some options.
   *
   * @param {number} line Line number from the source file
   * @param {string} tm
   * @param {Endpoint} frm
   * @param {Arrow} arrow
   * @param {Endpoint} to
   * @param {string} msg
   * @param {object} [opts]
   * @returns
   */
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

  /**
   * Start a new block at the current time.
   *
   * @param {number} line Line number from the source file
   * @param {"loop"|"opt"} typ Type of block
   * @param {string} msg Associated message
   * @returns {Block} The created block
   */
  addBlock(line, typ, msg) {
    const block = new Block(line, typ, msg)
    this.blockStack.forEach((b, i) => {
      b.depth = Math.max(this.blockStack.length - i, b.depth)
    }, this)
    this.blockStack.push(block)
    return this.addStep(block)
  }

  /**
   * End the current block at the current time.
   *
   * @param {number} line Line number from the source file
   * @throws {Error} on unmatched end block
   */
  endBlock(line) {
    const start = this.blockStack.pop()
    if (!start) {
      throw new Error(`Unmatched end on line: ${line}`)
    }
    this.addStep(new BlockEnd(line, start))
  }

  /**
   * Is this a valid property name?
   *
   * @param {string} nm
   * @returns {boolean}
   */
  validProp(nm) {
    return this.props[nm] !== undefined
  }

  /**
   * Set a property
   *
   * @param {string} nm Property name
   * @param {string|boolean|number|null} val Value
   * @throws {Error} on unknown property name
   */
  setProp(nm, val) {
    log.debug('Setting property:', nm, val)
    if (val === '') {
      val = true
    } else if (typeof val === 'string') {
      val = val.trim()
    }
    if (this.props[nm] === undefined) {
      throw new Error(`Unknown property: "${nm}"`)
    }
    this.props[nm] = val
  }

  /**
   * @param {Diagram} diag
   */
  compute(diag) {
    // Ensure there is nothing left on the block stack
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

  /**
   * Remember the current time with a given name.
   *
   * @param {string} tm The name to remember
   * @returns {number} The current time
   * @throws {Error} on duplicate timepoint name
   */
  addTime(tm) {
    if (Object.prototype.hasOwnProperty.call(this.timepoints, tm)) {
      throw new Error(`Duplicate timepoint: "${tm}"`)
    }
    const t = this.current_time
    this.timepoints[tm] = t
    return t
  }

  /**
   * Find a timepoint by name
   *
   * @param {string} tm
   * @returns {number}
   * @throws {Error} on unknown timepoint
   */
  findTime(tm) {
    const t = this.timepoints[tm]
    if (typeof t === 'undefined') {
      throw new Error(`Unknown timepoint: "${tm}"`)
    }
    return t
  }

  /**
   * Set the current time to max(start, end)+increment.
   *
   * @param {number} start
   * @param {number} end
   * @param {number} [increment=1]
   */
  incrTime(start, end, increment = 1) {
    const later_time = Math.max(start, end)
    this.max_time = Math.max(this.current_time, later_time)
    this.current_time = later_time + increment
  }

  /**
   * Add a number to the beginning of the string, if we are auto-numbering.
   *
   * @param {string} str
   * @returns {string} Possibly modified string
   */
  autoNumber(str) {
    if (this.props.auto_number) {
      return (`[${this.current_arrow++}] ${str ?? ''}`).trim()
    }
    return str
  }
}
