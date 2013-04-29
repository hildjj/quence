/* jslint node: true */
'use strict';

var log = require('log4js').getLogger();
var xml = require('XMLBuilder');
var ast = require('./ast');

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

  function draw_label(parent, p, str) {
    var txt = parent.e('text', {
      "font-size": diag.props.text_size,
      fill: diag.props.text_color
    }, str);
    return p.att(txt);
  }

  function draw_rotate_attr(parent, angle, p) {
    return parent.att('transform', 'rotate(' + angle + ', ' + p.x + ', ' + p.y + ')');
  }

  function arrow_head(parent, angle, p, direction) {
    parent.com('arrow');
    var xoffset = diag.props.arrow_head_length * direction * 1.5;
    var line = parent.e('line', {
      "stroke-linecap": "round",
      width: diag.props.line_width,
      stroke: diag.props.arrow_color
    });
    p.att(line, 1);
    p.adjust(xoffset, -0.7 * diag.props.arrow_head_length).att(line, 2);
    draw_rotate_attr(line, angle, p);

    line = parent.e('line', {
      "stroke-linecap": "round",
      width: diag.props.line_width,
      stroke: diag.props.arrow_color
    });
    p.att(line, 1);
    p.adjust(xoffset, 0.7 * diag.props.arrow_head_length).att(line, 2);
    draw_rotate_attr(line, angle, p);

    return parent;
  }

  function draw_arrow(parent, p1, p2, str, double_headed) {
    var left;
    var right;
    var text_anchor;
    var text_align;
    var l2r = false;

    // angle = Math.atan2((timey(t2) - timey(t1)) , (columnx(c2) - columnx(c1))) * 180/3.14;
    // TODO (fluffy@cisco.com): This works and atan2 does not. Feel free to fix it.
    var angle = Math.atan((p2.y - p1.y) / (p2.x - p1.x)) * 180/Math.PI;

    // Basic line
    var line = draw_line(parent, p1, p2);

    // Put into L -> R form
    if (p2.col > p1.col) {
        left = p1;
        right = p2;
        l2r = true;
        text_anchor = left.adjust(diag.props.label_space_x, diag.props.label_space_y);
        text_align = "start";
    }
    else {
        left = p2;
        right = p1;
        text_anchor = right.adjust(-1 * diag.props.label_space_x, diag.props.label_space_y);
        text_align = "end";
    }

    if (double_headed) {
        text_anchor = midpoint(p1, p2).adjust(0, diag.props.label_space_y);
        text_align = "middle";
    }

    if (l2r || double_headed) {
      arrow_head(parent, angle, right, -1);
    }

    if (!l2r || double_headed) {
      arrow_head(parent, angle, left, 1);
    }

    if (str) {
      var txt = draw_label(parent, text_anchor, str)
        .att("text-anchor", text_align);
      draw_rotate_attr(txt, angle, text_anchor);
    }
    return parent;
  }

  function draw_line(parent, p1, p2) {
    var line = parent.e('line', {
      width: diag.props.line_width,
      stroke: diag.props.line_color
    });
    p1.att(line, 1);
    p2.att(line, 2);
    return line;
  }

  function draw_path(parent, cmds, atts) {
    var path = parent.e('path', atts);
    var d = cmds.map(function(c) {
      if (typeof(c) === 'string') { return c; }
      return "" + c.x + " " + c.y;
    });
    path.att("d", d.join(" "));
    return path;
  }

  function draw_self_arrow(parent, e1, e2, str, double_headed) {
    var p1 = pos(e1);
    var p2 = pos(e2);
    var self_width = diag.props.column_width / 4;
    draw_path(parent, [
      "M", p1,
      "L", p1.adjust(self_width, 0),
      "L", p2.adjust(self_width, 0),
      "L", p2
      ])
      .att("fill", "none")
      .att("stroke", "black");
    arrow_head(parent, 0, p2, 1);

    if (str) {
      var text_anchor = midpoint(p1, p2)
        .adjust(self_width + diag.props.label_space_x, -diag.props.label_space_y);
      var txt = draw_label(parent, text_anchor, str)
        .att("text-anchor", "left");
    }
  }

  var width = columnx(diag.parts.length);
  var height = timey(diag.max_time + 5);

  // start drawing
  var root = e('svg', {
    baseProfile: "full",
    xmlns: "http://www.w3.org/2000/svg",
    width: width,
    height: height
  });

  var meta = root.e('metadata', {
    "xmlns:dc": "http://purl.org/dc/elements/1.1/"
  });
  meta.e('dc:date', null, new Date().toISOString());
  meta.com("Produced by ladder: http://github.com/hildjj/ladder");

  root.e('rect', {
    x: 0,
    y: 0,
    width: width,
    height: height,
    fill: diag.props.background
  });

  if (diag.title) {
    log.debug("Drawing title");
    draw_label(root, pos((diag.parts.length-1)/2, -4), diag.title)
      .att("text-anchor", "middle");
  }

  // vertical line per participant
  diag.parts.forEach(function(part, i) {
    log.debug('drawing part', i, part);
    draw_label(root, pos(part.col, -2), part.desc)
      .att("text-anchor", "middle");
    draw_line(root,  pos(part.col, -1), pos(part.col, diag.max_time + 1));
    draw_label(root, pos(part.col, diag.max_time + 3), part.desc)
      .att("text-anchor", "middle");
  });

  diag.data.forEach(function(x) {
    switch (x.kind) {
      case ast.SELF:
        draw_self_arrow(root, x.from, x.to, x.msg, x.opts.double_headed);
        break;
      case ast.MESSAGE:
        draw_arrow(root, pos(x.from), pos(x.to), x.msg, x.opts.double_headed);
        break;
      case ast.LOOP:
        root.com('Loop: ' + x.msg);
        var pad = (x.depth+1)*5;
        var lt = pos(0, x.start).adjust(-pad, 0);
        draw_path(root, [
          "M", lt.adjust(0, -15),
          "L", lt.adjust(35, -15),
          "L", lt.adjust(35, 0),
          "L", lt,
          "Z"], {fill: "gray"});

        draw_label(root, lt.adjust(5, -4), "loop")
          .att("text-anchor", "left");

        if (x.msg) {
          draw_label(root, lt.adjust(40, -4), x.msg)
            .att("text-anchor", "left");
        }

        var right = diag.parts.length -1; //diag.parts.length - 0.95;
        draw_path(root, [
          "M", lt.adjust(0, -15),
          "L", lt.adjust(35, -15),
          "L", lt.adjust(35, 0),
          "L", pos(right, x.start).adjust(pad, 0),
          "L", pos(right, x.end).adjust(pad, 0),
          "L", pos(0, x.end).adjust(-pad, 0),
          "Z"])
          .att("stroke-linejoin", "round")
          .att("fill", "none")
          .att("stroke", "gray")
          .att("stroke-dasharray", "2, 1");
        break;
    }

    // TODO: add other types, like self messages, groups, etc.
  });
  return root.end({pretty: true});

};

