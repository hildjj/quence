/* jslint node: true */
/* jslint multistr: true */
'use strict';

var fs = require('fs');
var util = require('util');

var log = require('log4js').getLogger();
var xml = require('XMLBuilder');

var Driver = require('./driver');

function SVGDriver(diag) {
  Driver.call(this, diag);
  this.path_count = 0;
}
util.inherits(SVGDriver, Driver);
module.exports = SVGDriver;

SVGDriver.prototype.marker = function marker(parent, id, refx, path, klass) {
  parent.e('marker', {
      id: id,
      viewBox: "0 0 10 10",
      refX: refx,
      refY: "5",
      markerUnits: "strokeWidth",
      orient: "auto",
      markerWidth: this.props.arrow_width,
      markerHeight: this.props.arrow_height
    })
    .e('path', {
      class: klass,
      d: path
    });
};

SVGDriver.prototype.clear = function clear() {
  this.doc.e('rect', {
    x: 0,
    y: 0,
    width: this.width,
    height: this.height,
    fill: this.props.background
  });
};

SVGDriver.prototype.document = function document() {
  var root = xml.create('svg');
  root.a("baseProfile", "full");
  root.a("xmlns", "http://www.w3.org/2000/svg");
  root.a("xmlns:xl", "http://www.w3.org/1999/xlink");
  root.a("width", this.width);
  root.a("height", this.height);
  this.top = root;
  return root;
};

SVGDriver.prototype.meta = function meta(pjson) {
  var m = this.doc.e('metadata', {
    "xmlns:dc": "http://purl.org/dc/elements/1.1/"
  });
  m.e('dc:date', null, new Date().toISOString());
  m.com("Produced by ladder: " + pjson.homepage);
  if (this.diag.title) {
    this.doc.e('title', this.diag.title);
  }
};

// leave this in pre-expanded state, so multiple docs can use it.
var css_cache = null;
function expand_cache(props) {
  return css_cache.replace(/\[([^\]]+)]/g, function(m, p1) {
    return props[p1];
  });
}

function get_css(props, cb) {
  if (css_cache) {
    cb(null, expand_cache(props));
    return;
  }

  fs.readFile(__dirname + "/svg.css", {encoding: 'utf8'}, function(er, data) {
    if (er) {
      log.error(er);
      cb(er);
      return;
    }
    css_cache = data;
    cb(null, expand_cache(props));
  });
}

SVGDriver.prototype.home_link = function home_link(pjson) {
    var txt = this.doc.e('text', {
      "text-anchor": "end"
    });
    this.posa(this.width, this.height).att(txt);
    txt.e('a', {"xl:href": pjson.homepage})
      .e('tspan', {
        "baseline-shift": "100%",
        fill: "blue",
        "text-decoration": "underline"
      }, pjson.homepage);
    txt.e('tspan', {
      fill: this.props.text_color,
      "baseline-shift": "100%"
    }, "v" + pjson.version);
};

SVGDriver.prototype.draw = function draw(cb) {
  var defs = this.doc.e('defs');

  var that = this;
  get_css(this.props, function(er, css) {
    if (er) { cb.call(that, er); return; }
    defs.e('style', {type:"text/css"}, css);
    Driver.prototype.draw.call(that, function(er) {
      if (er) { cb.call(that, er); return; }

      cb.call(that, null, that.doc.end({pretty: true}));
    });
  });
};

SVGDriver.prototype.draw_group = function(name) {
  var g = this.top.e('g');
  if (name) {
    g.e('desc', name);
  }
  return g;
};

Driver.prototype.transform = function transform(x, y, theta, func) {
  var tform = [];
  if (x || y) {
    tform.push("translate("+x+", "+y+")");
  }
  if (theta) {
    var ang = theta*180/Math.PI;
    tform.push("rotate("+ang+")");
  }
  if (tform.length > 0) {
    var that = this;
    this.group(null, function(g) {
      g.att("transform", tform.join(', '));
      func.call(that, g);
    });
  }
  else {
    func.call(this, this.top);
  }
};

SVGDriver.prototype.draw_label = function draw_label(p, str, klass, angle) {
  if (!str || str.length === 0) {
    return null;
  }

// TODO:
// <switch>
//   <foreignObject x="5" y="5" width="520" height="45" >
//     <p xmlns="http://www.w3.org/1999/xhtml" style="font-family:DejaVu Sans; font-size:13px; font-weight: bold; text-align:center">that is that</p>
//   </foreignObject>
//   <text font-size="13" text-anchor="middle" font-family="DejaVu Sans" fill="black" x="225" y="20">that is that</text>
// </switch>

  var txt = this.top.e('text', {class: klass}, str);
  if (angle) { // !undefined or !0
    angle = angle * 180 / Math.PI;
    txt.att('transform', 'rotate(' + angle + ', ' + p.x + ', ' + p.y + ')');
  }

  return p.att(txt);
};

SVGDriver.prototype.draw_path = function draw_path(cmds, klasses) {
  var d = Driver.prototype.draw_path.call(this, cmds, klasses);

  return this.top.e('path', {
    d: d,
    id: "p_" + this.path_count++,
    class: klasses
  });
};
