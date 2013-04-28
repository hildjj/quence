/* jslint node: true */
'use strict';

var log = require('log4js').getLogger();
var xml = require('XMLBuilder');

function e(name, atts, text) {
  var el = xml.create(name);
  if (atts){
    for (var a in atts) {
      el.att(a, atts[a]);
    }
  }
  if (text) {
    el.text(text);
  }
  return el;
}

exports.draw = function(diag) {
  var label_space_x = 3;
  var label_space_y = -3;

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
        return e;
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

  function midpoint(e1, e2) {
    return pos((e1.col+e2.col)/2, (e1.tm+e2.tm)/2);
  }

  function columnx(col) {
    // TODO: make left margin configurable
    return (col + 0.5) * diag.props.column_width;
  }

  function timey(time) {
    // TODO: make top margin configurable
    return (time + 5) * diag.props.time_height;
  }

  function draw_label(parent, col, time, str) {
    var txt = parent.e('text', {
      "font-size": 15,
      "text-anchor": "middle"
    }, str);
    return pos(col, time).att(txt);
  }

  function draw_rotate_attr(parent, angle, p) {
    return parent.att('transform', 'rotate(' + angle + ', ' + p.x + ', ' + p.y + ')');
  }

  function arrow_head(parent, angle, p, direction) {
    parent.com('arrow');
    var xoffset = diag.props.arrow_head_length * direction * 1.5;
    var line = parent.e('line', {
      width: diag.props.line_width,
      stroke: diag.props.arrow_color
    });
    p.att(line, 1);
    p.adjust(xoffset, -0.7 * diag.props.arrow_head_length).att(line, 2);
    draw_rotate_attr(line, angle, p);

    line = parent.e('line', {
      width: diag.props.line_width,
      stroke: diag.props.arrow_color
    });
    p.att(line, 1);
    p.adjust(xoffset, 0.7 * diag.props.arrow_head_length).att(line, 2);
    draw_rotate_attr(line, angle, p);

    return parent;
  }

  function draw_arrow(parent, e1, e2, str, double_headed) {
    var left;
    var right;
    var text_anchor;
    var text_align;
    var l2r = false;

    // angle = Math.atan2((timey(t2) - timey(t1)) , (columnx(c2) - columnx(c1))) * 180/3.14;
    // TODO (fluffy@cisco.com): This works and atan2 does not. Feel free to fix it.
    var angle = Math.atan((timey(e2.tm) - timey(e1.tm)) / (columnx(e2.col) - columnx(e1.col))) * 180/Math.PI;

    // Basic line
    var line = parent.e('line', {
      width: diag.props.line_width,
      stroke: diag.props.line_color
    });
    pos(e1).att(line, 1);
    pos(e2).att(line, 2);

    // Put into L -> R form
    if (e2.col > e1.col) {
        left = pos(e1);
        right = pos(e2);
        l2r = true;
        text_anchor = left.adjust(label_space_x, label_space_y);
        text_align = "start";
    }
    else {
        left = pos(e2);
        right = pos(e1);
        text_anchor = right.adjust(-1 * label_space_x, label_space_y);
        text_align = "end";
    }

    if (double_headed) {
        text_anchor = midpoint(e1, e2).adjust(0, label_space_y);
        text_align = "middle";
    }

    if (l2r || double_headed) {
      arrow_head(parent, angle, right, -1);
    }

    if (!l2r || double_headed) {
      arrow_head(parent, angle, left, 1);
    }

    if (str) {
      var txt = parent.e('text', {
        "font-size": diag.props.text_size,
        "text-anchor": text_align,
        fill: diag.props.text_color
      }, str);
      text_anchor.att(txt);
      draw_rotate_attr(txt, angle, text_anchor);
    }
    return parent;
  }

  function draw_line(parent, c1, t1, c2, t2) {
    var line = parent.e('line', {
      width: diag.props.line_width,
      stroke: diag.props.line_color
    });
    pos(c1, t1).att(line, 1);
    pos(c2, t2).att(line, 2);
    return line;
  }

  // start drawing
  var root = e('svg', {
    baseProfile: "full",
    xmlns: "http://www.w3.org/2000/svg",
    width: columnx(diag.parts.length),
    height: timey(diag.max_time + 5)
  });

  var meta = root.e('metadata', {
    "xmlns:dc": "http://purl.org/dc/elements/1.1/"
  });
  meta.e('dc:date', null, new Date().toISOString());
  meta.com("Produced by ladder: http://github.com/hildjj/ladder");

  if (diag.title) {
    log.debug("Drawing title");
    draw_label(root, (diag.parts.length-1)/2, -4, diag.title);
  }

  // vertical line per participant
  diag.parts.forEach(function(part, i) {
    log.debug('drawing part', i, part);
    draw_label(root, part.col, -2, part.desc);
    draw_line(root, part.col, -1, part.col, diag.max_time + 1);
    draw_label(root, part.col, diag.max_time + 3, part.desc);
  });

  diag.data.forEach(function(x) {
    if (diag.isMessage(x)) {
      draw_arrow(root, x.from, x.to, x.msg, x.opts.double_headed);
    }
    // TODO: add other types, like self messages, groups, etc.
  });
  return root.end({pretty: true});

};

