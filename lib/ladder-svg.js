/* jslint node: true */
/* jslint multistr: true */
'use strict';

var log = require('log4js').getLogger();
var xml = require('XMLBuilder');
var ast = require('./ast');
var pjson = require('../package');

// old, fields...
function extend() {
  var old = arguments[0];
  if (!old) {
    old = {};
  }
  for (var i=0; i<arguments.length; i++) {
    var g = arguments[i];
    if (g) {
      for (var a in g) {
        old[a] = g[a];
      }
    }
  }
  return old;
}

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

  function draw_label(parent, p, str, align, atts) {
    if (!str || str.length === 0) {
      return null;
    }
    align = align || "middle";
    var txt = parent.e('text', extend({
      "text-anchor": align
    }, atts), str);
    return p.att(txt);
  }

  function draw_rotate_attr(parent, angle, p) {
    return parent.att('transform', 'rotate(' + angle + ', ' + p.x + ', ' + p.y + ')');
  }

  var path_count = 0;
  function draw_path(parent, cmds, atts) {
    var path = parent.e('path', atts);
    path.att("id", "p_" + path_count++);
    var d = cmds.map(function(c) {
      if (typeof(c) === 'string') { return c; }
      return "" + c.x + " " + c.y;
    });
    path.att("d", d.join(" "));
    return path;
  }

  function draw_line(parent, p1, p2, atts) {
    var line = draw_path(parent, [
        "M", p1,
        "L", p2
      ], atts);
    return line;
  }

  function draw_arrow(parent, msg) {
    var p1 = pos(msg.from);
    var p2 = pos(msg.to);

    var text_anchor;
    var text_align = 'start';

    var g = parent.e('g');
    g.e('desc', null, 'message: ' + msg);

    if (msg.arrow.begin) {
      text_anchor = midpoint(p1, p2).adjust(0, diag.props.label_space_y);
      text_align = "middle";
    }
    else if (p2.col < p1.col) {
      text_anchor = p1.adjust(-1 * diag.props.label_space_x, diag.props.label_space_y);
      text_align = "end";
    } else {
      text_anchor = p1.adjust(diag.props.label_space_x, diag.props.label_space_y);
      text_align = "start";
    }

    var line = draw_line(g, p1, p2, {class: msg.arrow.classes()});
    if (msg.msg) {
      var txt = draw_label(g, text_anchor, msg.msg, text_align);

      // angle = Math.atan2((timey(t2) - timey(t1)) , (columnx(c2) - columnx(c1))) * 180/3.14;
      // TODO (fluffy@cisco.com): This works and atan2 does not. Feel free to fix it.
      // TODO: use path following instead of JavaScript math.
      var angle = Math.atan((p2.y - p1.y) / (p2.x - p1.x)) * 180/Math.PI;
      if (angle !== 0) {
        draw_rotate_attr(txt, angle, text_anchor);
      }
    }

    return g;
  }

  function draw_self_arrow(parent, start) {
    var p1 = pos(start.from);
    var p2 = pos(start.to);
    var self_width = diag.props.column_width / 4;
    var g = parent.e('g');

    g.e('desc', null, 'message: ' + start);

    draw_path(g, [
      "M", p1,
      "L", p1.adjust(self_width, 0),
      "L", p2.adjust(self_width, 0),
      "L", p2
      ], {class: start.arrow.classes() + " self"});

    if (start.msg) {
      var text_anchor = midpoint(p1, p2)
        .adjust(self_width + diag.props.label_space_x, -diag.props.label_space_y);
      var txt = draw_label(g, text_anchor, start.msg, "start");
    }
  }

  function draw_loop(parent, loop) {
    var pad = (loop.depth+1)*5;
    var lt = pos(0, loop.start).adjust(-pad, 0);
    var g = root.e('g');
    g.e('desc', null, 'Loop: ' + loop.msg);

    draw_path(g, [
      "M", lt.adjust(0, -15),
      "L", lt.adjust(35, -15),
      "L", lt.adjust(35, 0),
      "L", lt,
      "Z"], {
        class: "block_tab"
      });

    draw_label(g, lt.adjust(5, -4), "loop", "start");

    if (loop.msg) {
      draw_label(g, lt.adjust(40, -4), loop.msg, "start");
    }

    var right = diag.parts.length -1; //diag.parts.length - 0.95;
    draw_path(g, [
      "M", lt.adjust(0, -15),
      "L", lt.adjust(35, -15),
      "L", lt.adjust(35, 0),
      "L", pos(right, loop.start).adjust(pad, 0),
      "L", pos(right, loop.end).adjust(pad, 0),
      "L", pos(0, loop.end).adjust(-pad, 0),
      "Z"], {
        class: "block"
      });
    return g;
  }

  // start drawing
  var width = columnx(diag.parts.length);
  var height = timey(diag.max_time + 5);

  var root = e('svg', {
    baseProfile: "full",
    xmlns: "http://www.w3.org/2000/svg",
    "xmlns:xl": "http://www.w3.org/1999/xlink",
    width: width,
    height: height
  });

  var meta = root.e('metadata', {
    "xmlns:dc": "http://purl.org/dc/elements/1.1/"
  });
  meta.e('dc:date', null, new Date().toISOString());
  meta.com("Produced by ladder: " + pjson.homepage);

  var defs = root.e('defs');
  defs.e('marker', {
      id: "startMarker",
      viewBox: "0 0 10 10",
      refX: "0",
      refY: "5",
      markerUnits: "strokeWidth",
      orient: "auto",
      markerWidth: diag.props.arrow_width,
      markerHeight: diag.props.arrow_height
    })
    .e('path', {
      class: 'closed',
      d: "M 10 0 L 0 5 L 10 10 L 9 5 Z"
    });
  defs.e('marker', {
      id: "endMarker",
      viewBox: "0 0 10 10",
      refX: "10",
      refY: "5",
      markerUnits: "strokeWidth",
      orient: "auto",
      markerWidth: diag.props.arrow_width,
      markerHeight: diag.props.arrow_height
    })
    .e('path', {
      class: 'closed',
      d: "M 0 0 L 10 5 L 0 10 L 1 5 Z"
    });
  defs.e('marker', {
      id: "startMarkerOpen",
      viewBox: "0 0 10 10",
      refX: "0",
      refY: "5",
      markerUnits: "strokeWidth",
      orient: "auto",
      markerWidth: diag.props.arrow_width,
      markerHeight: diag.props.arrow_height
    })
    .e('path', {
      class: 'open',
      d: "M 10 0 L 0 5 L 10 10"
    });
  defs.e('marker', {
      id: "endMarkerOpen",
      viewBox: "0 0 10 10",
      refX: "10",
      refY: "5",
      markerUnits: "strokeWidth",
      orient: "auto",
      markerWidth: diag.props.arrow_width,
      markerHeight: diag.props.arrow_height
    })
    .e('path', {
      class: 'open',
      d: "M 0 0 L 10 5 L 0 10"
    });


  defs.e('style', {type:"text/css"}, "\n\
      text {\n\
        font-size: " + diag.props.text_size + "px;\n\
        font-family: " + diag.props.font + ";\n\
        fill: " + diag.props.text_color + ";\n\
      }\n\
      path {\n\
        stroke: " + diag.props.line_color + ";\n\
        stroke-width: " + diag.props.line_width + ";\n\
      }\n\
      path.block_tab {\n\
        fill: " + diag.props.block_tab_fill + ";\n\
        stroke: none;\n\
      }\n\
      path.block {\n\
        fill: none;\n\
        stroke: " + diag.props.block_stroke + ";\n\
        stroke-dasharray: 2, 1;\n\
        stroke-linejoin: round;\n\
      }\n\
      path.self {\n\
        fill: none;\n\
      }\n\
      path.dashed {\n\
        stroke-dasharray: 6, 2;\n\
      }\n\
      path.closed_forward {\n\
        marker-end: url(#endMarker);\n\
      }\n\
      path.open_forward {\n\
        marker-end: url(#endMarkerOpen);\n\
      }\n\
      path.closed_back {\n\
        marker-start: url(#startMarker);\n\
      }\n\
      path.open_back {\n\
        marker-start: url(#startMarkerOpen);\n\
      }\n\
      path.both {\n\
        marker-start: url(#startMarker);\n\
        marker-end: url(#endMarker);\n\
      }\n\
      path.rung {\n\
        stroke: " + diag.props.rung_color + ";\n\
        stroke-width: " + diag.props.rung_width + ";\n\
      }\n\
      marker path.closed {\n\
        fill: " + diag.props.arrow_color + ";\n\
        stroke: none;\n\
      }\n\
      marker path.open {\n\
        stroke: " + diag.props.arrow_color + ";\n\
        fill: none;\n\
      }\n\
    ");

  root.e('rect', {
    x: 0,
    y: 0,
    width: width,
    height: height,
    fill: diag.props.background
  });

  if (!diag.props.no_link) {
    var txt = root.e('text', {
      "text-anchor": "end"
    });
    posa(width, height).att(txt);
    txt.e('a', {"xl:href": pjson.homepage})
      .e('tspan', {
        "baseline-shift": "100%",
        fill: "blue",
        "text-decoration": "underline"
      }, pjson.homepage);
    txt.e('tspan', {
      fill: diag.props.text_color,
      "baseline-shift": "100%"
    }, "v" + pjson.version);
  }

  if (diag.title) {
    log.debug("Drawing title:", diag.title);
    root.e('title', null, diag.title);

// TODO:
// <switch>
//   <foreignObject x="5" y="5" width="520" height="45" >
//     <p xmlns="http://www.w3.org/1999/xhtml" style="font-family:DejaVu Sans; font-size:13px; font-weight: bold; text-align:center">that is that</p>
//   </foreignObject>
//   <text font-size="13" text-anchor="middle" font-family="DejaVu Sans" fill="black" x="225" y="20">that is that</text>
// </switch>
    draw_label(root, pos((diag.parts.length-1)/2, -4), diag.title);
  }

  var g = root.e('g');
  g.e('desc', null, 'vertical line per participant');

  diag.parts.forEach(function(part, i) {
    log.debug('drawing part', i, part);
    draw_label(g, pos(part.col, -2), part.desc);
    draw_line(g,  pos(part.col, -1), pos(part.col, diag.max_time + 1), {
      class: "rung"
    });
    draw_label(g, pos(part.col, diag.max_time + 3), part.desc);
  });

  diag.data.forEach(function(x) {
    switch (x.kind) {
      case ast.SELF:
        draw_self_arrow(root, x);
        break;
      case ast.MESSAGE:
        draw_arrow(root, x);
        break;
      case ast.LOOP:
        draw_loop(root, x);
        break;
    }

    // TODO: add other types, like self messages, groups, etc.
  });
  return root.end({pretty: true});

};

