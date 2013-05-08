/* jslint node: true */
/* jslint multistr: true */
'use strict';

var log = require('log4js').getLogger();
var ast = require('./ast');
var pjson = require('../package');

function Driver(diag, argv) {
  this.diag = diag;
  this.props = diag.props;
  this.top = null;
  this.argv = argv;

  this.width = this.columnx(diag.parts.length);
  this.height = this.timey(diag.max_time + 5);
  this.doc = this.document();
}
module.exports = Driver;

Driver.prototype.draw_group = function(name) {
  // override if needed
  return null;
};

Driver.prototype.group = function group(name, func) {
  var old = this.top;
  this.top = this.draw_group(name);

  log.debug("group:", name);
  func.call(this, this.top);
  this.top = old;
};

Driver.prototype.meta = function meta(json) {
  // override
};

Driver.prototype.home_link = function home_link(json) {
  // override
};

Driver.prototype.draw = function draw(cb) {
  this.meta(pjson);
  this.clear();

  if (this.diag.title) {
    this.draw_label(this.pos((this.diag.parts.length-1)/2, -4),
                    this.diag.title, "title");
  }

  if (!this.props.no_link && !this.argv.n) {
    this.home_link(pjson);
  }

  this.group("participants", function() {
    this.diag.parts.forEach(function(part, i) {
      this.group("Paricipant: " + part.desc, function() {
        this.draw_label(this.pos(part.col, -2),
                        part.desc,
                        "rung_label");
        this.draw_line(this.pos(part.col, -1),
                       this.pos(part.col, this.diag.max_time + 1),
                       "rung");
        this.draw_label(this.pos(part.col, this.diag.max_time + 3),
                        part.desc,
                        "rung_label");
      });
    }, this);
  });

  this.diag.data.forEach(function(x) {
    switch (x.kind) {
      case ast.SELF:
        this.draw_self_arrow(x);
        break;
      case ast.MESSAGE:
        this.draw_arrow(x);
        break;
      case ast.BLOCK:
        this.draw_block(x);
        break;
    }
  }, this);
  cb(null, this.doc);
};

Driver.prototype.columnx = function columnx(col) {
  // TODO: make left margin configurable
  return (col + 0.5) * this.diag.props.column_width;
};

Driver.prototype.timey = function timey(time) {
  // TODO: make top margin configurable
  return (time + 5) * this.diag.props.time_height;
};

Driver.prototype.posa = function posa(x, y) {
  return {
    x : x,
    y : y,
    toString: function(suff) {
      suff = suff || "";
      return 'x' + suff + '="' + x +
           '" y' + suff + '="' + y + '" ';
    },
    att: function(el, suff) {
      suff = suff || "";
      el.att('x' + suff, x);
      el.att('y' + suff, y);
      return el;
    },
    adjust: function(dx, dy) {
      return posa(x + dx, y + dy);
    }
  };
};

Driver.prototype.pos = function pos(col, tm) {
  if (typeof(tm) === 'undefined') {
    tm = col.tm;
    col = col.col;
  }
  var p = this.posa(this.columnx(col), this.timey(tm));
  p.col = col;
  p.time = tm;
  return p;
};

Driver.prototype.midpoint = function midpoint(p1, p2) {
  return this.posa((p1.x+p2.x)/2, (p1.y+p2.y)/2);
};

// override
Driver.prototype.draw_path = function draw_path(cmds, klasses) {
  var d;
  if (typeof(cmds) === 'string') {
    d = cmds;
  } else {
    d = cmds.map(function(c) {
      if (typeof(c) === 'string') { return c; }
      return "" + c.x + " " + c.y;
    }).join(' ');
  }
  return d;
};

Driver.prototype.draw_line = function draw_line(p1, p2, klass) {
  return this.draw_path([
      "M", p1,
      "L", p2
    ], klass);
};

Driver.prototype.draw_block = function draw_block(block) {
  var pad = (block.depth+1)*5 + (this.props.rung_width / 2);
  var lt = this.pos(0, block.start).adjust(-pad, 0);
  this.group(block.typ + ': ' + block.msg, function() {
    this.draw_path([
      "M", lt.adjust(0, -15),
      "L", lt.adjust(35, -15),
      "L", lt.adjust(35, 0),
      "L", lt,
      "Z"], "block_tab");

    this.draw_label(lt.adjust(5, -2), block.typ, "start");

    if (block.msg) {
      this.draw_label(lt.adjust(40, -2), block.msg, "start");
    }

    var right = this.diag.parts.length - 1;
    this.draw_path([
      "M", lt.adjust(0, -15),
      "L", lt.adjust(35, -15),
      "L", lt.adjust(35, 0),
      "L", this.pos(right, block.start).adjust(pad, 0),
      "L", this.pos(right, block.end).adjust(pad, 0),
      "L", this.pos(0, block.end).adjust(-pad, 0),
      "Z"], "block");
  });
};

Driver.prototype.draw_self_arrow = function draw_self_arrow(start) {
  var p1 = this.pos(start.from);
  var p2 = this.pos(start.to);
  var self_width = this.props.column_width / 4;
  var half_rung = this.props.rung_width/2;
  var begin_adj = 0;

  if (start.arrow.begin) {
    begin_adj = 1;
  }
  this.group('message: ' + start, function() {
    this.draw_path([
      "M", p1.adjust(half_rung+begin_adj,0),
      "L", p1.adjust(self_width, 0),
      "L", p2.adjust(self_width, 0),
      "L", p2.adjust(half_rung+1, 0)
      ], start.arrow.classes() + " self");

    this.arrow_head(p2.adjust(half_rung,0), Math.PI, start.arrow.end);
    if (start.arrow.begin) {
      this.arrow_head(p1.adjust(half_rung,0), Math.PI, start.arrow.begin);
    }

    if (start.msg) {
      var text_anchor = this.midpoint(p1, p2)
        .adjust(self_width + this.props.label_space_x, -this.props.label_space_y);
      this.draw_label(text_anchor, start.msg, "start");
    }
  });
};

Driver.prototype.transform = function transform(x, y, theta, func) {
  throw new Error("transform not implemented");
};

Driver.prototype.arrow_head = function arrow_head(p, theta, type) {
  this.transform(p.x, p.y, theta, function(){
    if ((type === '>') || (type === '<')) {
      this.draw_path("M -10 4 L -1 0 L -10 -4 L -9 0 Z", "closed");
    } else {
      this.draw_path("M -10 4 L -1 0 L -10 -4", "open");
    }
  });
  return this.doc;
};

Driver.prototype.draw_arrow = function draw_arrow(msg) {
  var p1 = this.pos(msg.from);
  var p2 = this.pos(msg.to);
  var half_rung = this.props.rung_width/2;

  var begin_adj = 0;
  var end_adj;
  var end_angle;
  var text_anchor;
  var text_align;

  // Bring each end of the line to the edge of the rung
  if (p2.col > p1.col) {
    // left-to-right
    p1 = p1.adjust( half_rung, 0);
    p2 = p2.adjust(-half_rung, 0);
    end_adj = -1;
    // move over from the left a little
    text_align = 'start';
    text_anchor = p1.adjust(this.props.label_space_x, 0);
    end_angle = 0;
  } else {
    // right-to-left
    p1 = p1.adjust(-half_rung, 0);
    p2 = p2.adjust( half_rung, 0);
    end_adj = 1;
    // move over from the right a little
    text_align = "end";
    text_anchor = p1.adjust(-this.props.label_space_x, 0);
    end_angle = Math.PI;
  }

  if (msg.arrow.begin) {
    begin_adj = 1;
    text_align = "center";
    text_anchor = this.midpoint(p1, p2);
  }

  var rangle = Math.atan((p2.y - p1.y) / (p2.x - p1.x));

  this.draw_line(p1.adjust(begin_adj*Math.cos(rangle), begin_adj*Math.sin(rangle)),
                 p2.adjust(end_adj*Math.cos(rangle),   end_adj*Math.sin(rangle)),
                 msg.arrow.classes());

  this.arrow_head(p2, rangle+end_angle, msg.arrow.end);

  if (msg.arrow.begin) {
    this.arrow_head(p1, rangle + Math.PI, msg.arrow.begin);
  }

  if (msg.msg) {
    this.draw_label(text_anchor, msg.msg, text_align, rangle);
  }
};

