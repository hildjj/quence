/* jslint node: true */
'use strict';

var util = require("util");
var log = require('log4js').getLogger();

var ADVANCE   = exports.ADVANCE   = 'ADVANCE';
var MESSAGE   = exports.MESSAGE   = 'MESSAGE';
var SELF      = exports.SELF      = 'SELF';
var BLOCK     = exports.BLOCK     = 'BLOCK';
var END_BLOCK = exports.END_BLOCK = 'END_BLOCK';

function Participant(col, nm, desc) {
  this.col = col;
  this.nm = nm;
  this.desc = desc || nm;
}

function Participants() {
  var map  = {};
  var list = [];
  this.length = 0;

  this.find = function(nm) {
    var p = map[nm] || this.add(nm);
    return p.col;
  };

  this.add = function(nm, desc) {
    var p = map[nm];
    if (p) {
     throw new Error("Duplicate participant:" + nm);
    }
    p = new Participant(this.length++, nm, desc);
    list.push(p);
    map[nm] = p;
    return p;
  };

  this.toJSON = function() {
    return list;
  };

  this.forEach = function(func, that) {
    list.forEach(function() {
      func.apply(this, arguments);
    }, that || this);
  };
}

function Endpoint(nm, col, tm) {
  this.nm = nm;
  this.col = col;
  this.tm = (tm === '') ? null : tm;
}

Endpoint.prototype.compute = function(diag, start, duration) {
  duration = duration || 0;
  var t = (typeof(start) == 'undefined') ? diag.current_time : start;
  switch (typeof(this.tm)) {
    case 'string': this.tm = diag.findTime(this.tm); break;
    case 'number': /* no-op */ break;
    default: this.tm = t + duration; break;
  }
};

Endpoint.prototype.toString = function() {
  return this.nm;
};

function Arrow(begin, dash, end) {
  this.begin = begin;
  this.dash = dash;
  this.end = end;
}

Arrow.prototype.classes = function() {
  var ret = [];
  if (this.begin === '<') {
    ret.push("closed_back");
  } else if (this.begin === '<<') {
    ret.push("open_back");
  }

  if (this.dash === "--") {
    ret.push('dashed');
  } else {
    ret.push('solid');
  }

  if (this.end === '>') {
    ret.push("closed_forward");
  } else if (this.end === '>>') {
    ret.push("open_forward");
  }

  return ret.join(' ');
};

Arrow.prototype.toString = function() {
  return [this.begin, this.dash, this.end].join('');
};

exports.Arrow = Arrow;

function Step(line, kind) {
  this._line = line;
  this.kind = kind;
}

Step.prototype.compute = function(diag) {
  // pure virtual
  log.fatal('Computing step from line:', this._line);
};

function Advance(line, distance) {
  Step.call(this, line, ADVANCE);
  this.distance = distance;
}

util.inherits(Advance, Step);

Advance.prototype.compute = function(diag) {
  diag.current_time += this.distance;
};

function Message(line, tm, from, arrow, to, msg, opts) {
  Step.call(this, line, MESSAGE);
  this.opts = opts || {};
  if (tm !== '') {
    this.timepoint = tm;
  }
  this.from = from;
  this.arrow = arrow;
  this.classes = arrow.classes();
  this.to = to;
  msg = msg.trim();
  if (msg !== '') {
    this.msg = msg;
  }
}
util.inherits(Message, Step);

Message.prototype.compute = function(diag) {
  if (typeof(this.timepoint) === 'string') {
    this.tm = diag.addTime(this.timepoint);
  }
  this.from.compute(diag);
  this.to.compute(diag, this.from.tm, this.opts.duration);
  this.msg = diag.autoNumber(this.msg);

  diag.incrTime(this.from.tm, this.to.tm, this.opts.advance);
};

Message.prototype.toString = function() {
  return "" + this.from + " " + this.arrow + " " + this.to + ": " + this.msg;
};

function SelfMessage(line, tm, from, arrow, to, msg, opts) {
  Message.call(this, line, tm, from, arrow, to, msg, opts);
  this.kind = SELF;
}
util.inherits(SelfMessage, Message);

SelfMessage.prototype.compute = function(diag) {
  if (typeof(this.timepoint) === 'string') {
    this.tm = diag.addTime(this.timepoint);
  }
  this.from.compute(diag);
  var dur = Math.max(this.opts.duration || 0, 1);

  this.to.compute(diag, this.from.tm, dur);
  this.msg = diag.autoNumber(this.msg);

  diag.incrTime(this.from.tm, this.to.tm, this.opts.advance);
};

function Block(line, typ, msg) {
  Step.call(this, line, BLOCK);
  this.depth = 0;
  this.typ = typ;
  if (msg !== '') {
    this.msg = msg;
  }
}
util.inherits(Block, Step);

Block.prototype.compute = function(diag) {
  this.start = diag.current_time;
  diag.incrTime(this.start, this.start);
};

function End(line, start) {
  Step.call(this, line, END_BLOCK);
  this.start = start;
}
util.inherits(End, Step);

End.prototype.compute = function(diag) {
  var t = diag.current_time;
  this.start.end = t;
  diag.incrTime(t, t);
};

function Diagram() {
  this.parts = new Participants();
  this.timepoints = {};
  this.title = null;
  this.data = [];
  this.blockStack = [];
  this.props = {
    arrow_color: "black",
    arrow_height: 10,
    arrow_width: 15,
    auto_number: false,
    background: "white",
    block_tab_fill: "gray",
    block_stroke: "gray",
    column_width: 150,
    font: "Helvetica",
    label_space_x: 3,
    label_space_y: -3,
    line_color: "black",
    line_width: 1,
    no_clear: false,
    no_feet: false,
    no_link: false,
    rung_color: "black",
    rung_width: 1,
    text_color: "black",
    text_size: 13,
    time_height: 20
  };

  this.current_time = 1;
  this.max_time = 0;
  this.current_arrow = 0;
}

Diagram.prototype.setTitle = function setTitle(title) {
  if (this.title !== null) {
    throw new Error("Title already specified as: " + this.title);
  }
  this.title = title.trim();
};

Diagram.prototype.addStep = function addStep(step) {
  if (!(step instanceof Step)) {
    throw new Error("Can only add steps");
  }
  this.data.push(step);
  return step;
};

Diagram.prototype.addAdvance = function addAdvance(line, distance) {
  return this.addStep(new Advance(line, distance));
};

Diagram.prototype.addEndpoint = function addEndpoint(nm, tm) {
  return new Endpoint(nm, this.parts.find(nm), tm);
};

Diagram.prototype.addMessage = function addMessage(line, tm, from, arrow, to, msg, opts) {
  var m;
  if (from.nm === to.nm) {
    m = new SelfMessage(line, tm, from, arrow, to, msg, opts);
  } else {
    m = new Message(line, tm, from, arrow, to, msg, opts);
  }
  return this.addStep(m);
};

Diagram.prototype.addBlock = function addBlock(line, typ, msg) {
  var block = new Block(line, typ, msg);
  this.blockStack.forEach(function(b, i) {
    b.depth = Math.max(this.blockStack.length-i, b.depth);
  }, this);
  this.blockStack.push(block);
  return this.addStep(block);
};

Diagram.prototype.endBlock = function endBlock(line) {
  var start = this.blockStack.pop();
  if (!start) {
    throw new Error("Unmatched end on line: " + line);
  }
  this.addStep(new End(line, start));
};

Diagram.prototype.setProp = function setProp(nm, val) {
  log.debug("Setting property:", nm, val);
  if (val === '') {
    val = true;
  }
  else if (typeof(val) === 'string') {
    val = val.trim();
  }
  this.props[nm] = val;
};

Diagram.prototype.compute = function compute() {
  switch (this.blockStack.length) {
    case 0: break;
    case 1: throw new Error("Unended block start:" + JSON.stringify(this.blockStack[0]));
    default: throw new Error("Unended block starts:" + JSON.stringify(this.blockStack));
  }
  this.data.forEach(function(d) {
    d.compute(this);
  }, this);
};

Diagram.prototype.addTime = function addTime(tm) {
  if (this.timepoints.hasOwnProperty(tm)) {
    throw new Error('Duplicate timepoint: ' + tm);
  }
  var t = this.timepoints[tm] = this.current_time;
  return t;
};

Diagram.prototype.findTime = function findTime(tm) {
  var t = this.timepoints[tm];
  if (typeof(t) === 'undefined') {
    throw new Error("Unknown timepoint: " + tm);
  }
  return t;
};

Diagram.prototype.incrTime = function incrTime(start, end, increment) {
  var later_time = Math.max(start, end);
  this.max_time = Math.max(this.current_time, later_time);
  this.current_time = later_time + (increment || 1);
};

Diagram.prototype.autoNumber = function autoNumber(str) {
  if (this.props.auto_number) {
    return ("[" + (this.current_arrow++) + "] " + (str || "")).trim();
  }
  return str;
};

exports.Diagram = Diagram;
