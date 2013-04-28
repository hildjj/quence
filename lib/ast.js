/* jslint node: true */
'use strict';

var util = require("util");
var log = require('log4js').getLogger();

var ARROW   = exports.ARROW   = 'ARROW';
var DARROW  = exports.DARROW  = 'DARROW';
var NOTE    = exports.NOTE    = 'NOTE';
var ADVANCE = exports.ADVANCE = 'ADVANCE';

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

  this.forEach = function(func) {
    list.forEach(function() {
      func.apply(this, arguments);
    }, this);
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

function Step(line) {
  this._line = line;
}

Step.prototype.compute = function(diag) {
  // pure virtual
  log.fatal('Computing step from line:', this._line);
};

function Advance(line, distance) {
  Step.call(this, line);
  this.distance = distance;
}

util.inherits(Advance, Step);

Advance.prototype.compute = function(diag) {
  diag.current_time += this.distance;
};

function Message(line, tm, from, arrow, to, msg, opts) {
  Step.call(this, line);
  this.opts = opts || {};
  if (tm !== '') {
    this.timepoint = tm;
  }
  this.from = from;
  this.arrow = arrow;
  if (this.arrow === DARROW) {
    this.opts.double_headed = true;
  }
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

function SelfMessage(line, tm, from, arrow, to, msg, opts) {
  Message.call(this, line, tm, from, arrow, to, msg, opts);
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


function Diagram() {
  this.parts = new Participants();
  this.timepoints = {};
  this.title = null;
  this.data = [];
  this.props = {
    column_width: 150,
    time_height: 20,
    arrow_head_length: 7,
    arrow_color: "black",
    line_color: "black",
    line_width: 1,
    text_color: "black",
    text_size: 15,
    auto_number: false,
    label_space_x: 3,
    label_space_y: -3
  };

  this.current_time = 1;
  this.max_time = 0;
  this.current_arrow = 0;
}

Diagram.prototype.setTitle = function(title) {
  if (this.title !== null) {
    throw new Error("Title already specified as: " + this.title);
  }
  this.title = title;
};

Diagram.prototype.addStep = function(step) {
  if (!(step instanceof Step)) {
    throw new Error("Can only add steps");
  }
  this.data.push(step);
  return step;
};

Diagram.prototype.addAdvance = function(line, distance) {
  return this.addStep(new Advance(line, distance));
};

Diagram.prototype.addEndpoint = function(nm, tm) {
  return new Endpoint(nm, this.parts.find(nm), tm);
};

Diagram.prototype.addMessage = function(line, tm, from, arrow, to, msg, opts) {
  var m;
  if (from.nm === to.nm) {
    m = new SelfMessage(line, tm, from, arrow, to, msg, opts);
  } else {
    m = new Message(line, tm, from, arrow, to, msg, opts);
  }
  return this.addStep(m);
};

Diagram.prototype.setProp = function(nm, val) {
  if (val === '') {
    val = true;
  }
  else if (typeof(val) === 'string') {
    val = val.trim();
  }
  this.props[nm] = val;
};

Diagram.prototype.compute = function() {
  var that = this;
  this.data.forEach(function(d) {
    d.compute(that);
  });
};

Diagram.prototype.addTime = function(tm) {
  if (this.timepoints.hasOwnProperty(tm)) {
    throw new Error('Duplicate timepoint: ' + tm);
  }
  var t = this.timepoints[tm] = this.current_time;
  return t;
};

Diagram.prototype.findTime = function(tm) {
  var t = this.timepoints[tm];
  if (typeof(t) === 'undefined') {
    throw new Error("Unknown timepoint: " + tm);
  }
  return t;
};

Diagram.prototype.incrTime = function(start, end, increment) {
  var later_time = Math.max(start, end);
  this.max_time = Math.max(this.current_time, later_time);
  this.current_time = later_time + (increment || 1);
};

Diagram.prototype.autoNumber = function(str) {
  if (this.props.auto_number) {
    return "" + (this.current_arrow++) + ". " + (str || "");
  }
  return str;
};

Diagram.prototype.isMessage = function(m) {
  return m instanceof Message;
};

Diagram.prototype.isSelfMessage = function(m) {
  return m instanceof SelfMessage;
};

exports.Diagram = Diagram;
