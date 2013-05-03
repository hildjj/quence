/* jslint node: true */
/* jslint multistr: true */
'use strict';

var log = require('log4js').getLogger();
var ast = require('./ast');
var pjson = require('../package');
var pdf = require('pdfkit');

exports.draw = function(diag, cb) {
  var width = columnx(diag.parts.length);
  var height = timey(diag.max_time + 5);

  log.debug("height:", height, "width:", width);
  var doc = new pdf({size: [width, height]});
  doc.rect(0,0,width,height).fill(diag.props.background);

  function columnx(col) {
    // TODO: make left margin configurable
    return (col + 0.5) * diag.props.column_width;
  }

  function timey(time) {
    // TODO: make top margin configurable
    return (time + 5) * diag.props.time_height;
  }

  function posa(x, y) {
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
  }

  function pos(col, tm) {
    if (typeof(tm) === 'undefined') {
      tm = col.tm;
      col = col.col;
    }
    var p = posa(columnx(col), timey(tm));
    p.col = col;
    p.time = tm;
    return p;
  }

  function midpoint(p1, p2) {
    return posa((p1.x+p2.x)/2, (p1.y+p2.y)/2);
  }

  function draw_string(p, str, align, opts)
  {
    align = align || "center";
    opts = opts || {};

    var w = doc.widthOfString(str);
    var h = doc.currentLineHeight();
    var dx = 0;
    switch (align) {
      case "center": dx = -w/2; break;
      case "end":
      case "right": dx = -w; break;
    }
    p = p.adjust(dx, -h);

    doc.text(str, p.x, p.y, {align: align});
    if (opts.underline) {
      doc.underline(p.x, p.y, w, h, {color: opts.underline});
    }
    if (opts.link) {
      doc.link(p.x, p.y, w, h, opts.link);
    }
    return [w, h];
  }

  function draw_label(p, str, align) {
    if (!str || str.length === 0) {
      return null;
    }
    doc.save();
    doc.fillColor(diag.props.text_color);
    draw_string(p, str, align);
    doc.restore();
    return doc;
  }

  function draw_path(cmds) {
    var d = cmds.map(function(c) {
      if (typeof(c) === 'string') { return c; }
      return "" + c.x + " " + c.y;
    });
    return doc.path( d.join(" "));
  }

  function draw_line(p1, p2) {
    return doc.moveTo(p1.x, p1.y).lineTo(p2.x, p2.y);
  }

  function arrow_head(p, angle, type) {
    doc.save();

    doc.translate(p.x, p.y);
    if (angle !== 0) {
      doc.rotate(angle, {origin:[0,0]});
    }
    if ((type === '>') || (type === '<')) {
      doc.fillColor(diag.props.arrow_color);
      doc.path("M -10 4 L -1 0 L -10 -4 L -9 0 Z")
        .fillAndStroke(diag.props.arrow_color, diag.props.arrow_color);
    } else {
      doc.lineCap('round');
      doc.path("M -10 4 L -1 0 L -10 -4").stroke(diag.props.arrow_color);
    }
    doc.restore();
  }

  function draw_arrow(msg) {
    log.debug('msg:', msg.msg);
    doc.save();
    var p1 = pos(msg.from);
    var p2 = pos(msg.to);
    var begin_adj = 0;
    var end_adj = 0;

    if (msg.arrow.begin) {
      begin_adj = 1;
    }

    if (p2.col > p1.col) {
      p1 = p1.adjust(diag.props.rung_width/2, 0);
      p2 = p2.adjust(-diag.props.rung_width/2, 0);
      end_adj = -1;
    } else {
      p2 = p2.adjust(diag.props.rung_width/2, 0);
      p1 = p1.adjust(-diag.props.rung_width/2, 0);
      end_adj = 1;
    }


    var text_anchor;
    var text_align = 'start';

    var rangle = Math.atan((p2.y - p1.y) / (p2.x - p1.x));
    var angle = -rangle * 180/Math.PI;
    doc.save();
    draw_line(p1.adjust(begin_adj*Math.cos(rangle),begin_adj*Math.sin(rangle)), p2.adjust(end_adj*Math.cos(rangle),end_adj*Math.sin(rangle)));
    if (msg.arrow.dash === '--') {
      doc.dash(6, {space: 2});
    }
    doc.stroke(diag.props.line_color);
    doc.restore();

    if (msg.arrow.begin) {
      text_anchor = midpoint(p1, p2);
      text_align = "center";
      arrow_head(p1, angle-180, msg.arrow.begin);
      arrow_head(p2, angle, msg.arrow.end);
    }
    else if (p2.x < p1.x) {
      text_anchor = p1.adjust(-diag.props.label_space_x, 0);
      text_align = "end";
      arrow_head(p2, angle-180, msg.arrow.end);
    } else {
      text_anchor = p1.adjust(diag.props.label_space_x, 0);
      arrow_head(p2, angle, msg.arrow.end);
    }

    if (msg.msg) {

      // angle = Math.atan2((timey(t2) - timey(t1)) , (columnx(c2) - columnx(c1))) * 180/3.14;
      // TODO (fluffy@cisco.com): This works and atan2 does not. Feel free to fix it.
      // TODO: use path following instead of JavaScript math.
      if (angle !== 0) {
        doc.rotate(angle, {origin: [text_anchor.x, text_anchor.y]});
      }
      var txt = draw_label(text_anchor, msg.msg, text_align);
    }
    doc.restore();
  }

  function draw_self_arrow(start) {
    var p1 = pos(start.from).adjust(diag.props.rung_width/2, 0);
    var p2 = pos(start.to).adjust(diag.props.rung_width/2, 0);
    var self_width = diag.props.column_width / 4;

    doc.save();

    draw_path([
      "M", p1,
      "L", p1.adjust(self_width, 0),
      "L", p2.adjust(self_width, 0),
      "L", p2
      ]);
    if (start.arrow.dash === '--') {
      doc.dash(6, {space: 2});
    }
    doc.stroke(diag.props.line_color);
    doc.restore();

    if (start.arrow.begin) {
      arrow_head(p1, -180, start.arrow.begin);
    }
    arrow_head(p2, -180, start.arrow.end);

    if (start.msg) {
      var text_anchor = midpoint(p1, p2)
        .adjust(self_width + diag.props.label_space_x, doc.currentLineHeight()/2);
      var txt = draw_label(text_anchor, start.msg, "start");
    }
  }

  function draw_loop(loop) {
    var pad = (loop.depth+1)*5;
    var lt = pos(0, loop.start).adjust(-pad, 0);

    doc.save();
    draw_path([
      "M", lt.adjust(0, -13),
      "L", lt.adjust(35, -13),
      "L", lt.adjust(35, 0),
      "L", lt,
      "Z"]).fill(diag.props.block_tab_fill);

    draw_label(lt.adjust(5, -1), "loop", "start");

    if (loop.msg) {
      draw_label(lt.adjust(40, -1), loop.msg, "start");
    }

    var right = diag.parts.length - 1;

    doc.lineJoin('round');
    draw_path([
      "M", lt.adjust(0, -13),
      "L", lt.adjust(35, -13),
      "L", lt.adjust(35, 0),
      "L", pos(right, loop.start).adjust(pad, 0),
      "L", pos(right, loop.end).adjust(pad, 0),
      "L", pos(0, loop.end).adjust(-pad, 0),
      "Z"]).dash(2, {space: 1}).stroke();

    doc.restore();
  }

  // start drawing

  if (diag.title) {
    log.debug("Drawing title:", diag.title);
    doc.info.Title = diag.title;
    doc.info.Creator = "ladder: " + pjson.homepage;
    draw_label(pos((diag.parts.length-1)/2, -4), diag.title);
  }

  doc.save();
  doc.lineWidth(diag.props.rung_width);
  diag.parts.forEach(function(part, i) {
    log.debug('drawing part', i, part);
    draw_label(pos(part.col, -2), part.desc);
    draw_line(pos(part.col, -1), pos(part.col, diag.max_time + 1)).stroke(diag.props.rung_color);
    draw_label(pos(part.col, diag.max_time + 3), part.desc);
  });
  doc.restore();

  diag.data.forEach(function(x) {
    switch (x.kind) {
      case ast.SELF:
        draw_self_arrow(x);
        break;
      case ast.MESSAGE:
        draw_arrow(x);
        break;
      case ast.LOOP:
        draw_loop(x);
        break;
    }
  });

  if (!diag.props.no_link) {
    doc.save();
    var p = posa(width, height).adjust(-5,-5);
    doc.fillColor(diag.props.text_color);
    var wh = draw_string(p, 'v' + pjson.version, 'end');
    p = p.adjust(-wh[0]-3, 0);
    doc.fillColor('blue');
    draw_string(p, pjson.homepage, 'end', {
      underline: "blue",
      link: pjson.homepage});
    doc.restore();
  }

  doc.output(function(s) {
    cb(null, new Buffer(s, 'binary'));
  });
  return doc;
};

