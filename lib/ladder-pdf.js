/* jslint node: true */
/* jslint multistr: true */
'use strict';

var util = require('util');

var log = require('log4js').getLogger();
var pdf = require('pdfkit');

var Driver = require('./driver');

function PDFDriver(diag) {
  Driver.call(this, diag);
  var p = this.props;
  this.styles = {
    text: {
      fontSize: p.text_size,
      fillColor: p.text_color
    },
    title: {
      fontSize: p.text_size,
      fillColor: p.text_color
    },
    rung_label: {
      fontSize: p.text_size,
      fillColor: p.text_color
    },
    rung: {
      strokeColor: p.rung_color,
      lineWidth: p.rung_width
    },
    start: {
      fontSize: p.text_size,
      fillColor: p.text_color,
      align: 'left'
    },
    end: {
      fontSize: p.text_size,
      fillColor: p.text_color,
      align: 'right'
    },
    center: {
      fontSize: p.text_size,
      fillColor: p.text_color,
      align: 'center'
    },
    open: {
      strokeColor: p.arrow_color,
      lineCap: 'round'
    },
    closed: {
      fillColor: p.arrow_color,
      strokeColor: p.arrow_color,
      drawStyle: "fillAndStroke"
    },
    dashed: {
      strokeColor: p.line_color,
      lineWidth: p.line_width,
      dash: [6, {space: 2}]
    },
    solid: {
      strokeColor: p.line_color,
      lineWidth: p.line_width,
      undash: true
    },
    block: {
      strokeColor: p.block_stroke,
      dash: [2, {space:1}],
      lineJoin: "round"
    },
    block_tab: {
      fill: p.block_tab_fill,
      drawStyle: "fill"
    },
    closed_forward: {
    },
    open_forward: {
    },
    closed_back: {
    },
    open_back: {
    },
    self: {
    },
    link: {
      fillColor: "blue",
      align: "end",
      underline: "blue"
    },
    version: {
      fillColor: p.text_color,
      align: "end"
    }
  };

  this.path_count = 0;
}
util.inherits(PDFDriver, Driver);
module.exports = PDFDriver;

/**
 * Apply a css-like set of classes to the current document state
 * @param  {String} klasses Space-separated list of class names
 * @return {Object} Extra options that can't be set on doc, to
 *     apply to the draw routine that follows.
 */
PDFDriver.prototype.style = function style(klasses) {
  var extras = {};
  if (klasses) {
    var that = this;
    klasses.split(' ').forEach(function(klass) {
      var style = that.styles[klass];
      if (!style) {
        log.warn("Unknown class:", klass);
        return;
      }
      Object.keys(style).forEach(function(key) {
        var val = style[key];
        if (key in that.doc) {
          if (Array.isArray(val)) {
            that.doc[key].apply(that.doc, val);
          } else {
            that.doc[key].call(that.doc, val);
          }
        } else {
          extras[key] = val;
        }
      });
    });
  }
  return extras;
};

PDFDriver.prototype.draw = function draw(cb) {
  var that = this;
  Driver.prototype.draw.call(this, function(er) {
    if (er) {
      cb(er);
    }
    else
    {
      that.doc.output(function(s) {
        cb(null, new Buffer(s, 'binary'));
      });
    }
  });
};

PDFDriver.prototype.clear = function clear() {
  this.doc.rect(0,0,this.width,this.height).fill(this.props.background);
};

PDFDriver.prototype.document = function document() {
  return new pdf({size: [this.width, this.height]});
};

PDFDriver.prototype.meta = function meta(pjson) {
  if (this.diag.title) {
    this.doc.info.Title = this.diag.title;
  }
  this.doc.info.Creator = "ladder: " + pjson.homepage;
};

PDFDriver.prototype.home_link = function home_link(pjson) {
  // TODO: move up into the driver.
  this.doc.save();
  var p = this.posa(this.width, this.height).adjust(-5,-5);

  var wh = this.draw_string(p, 'v' + pjson.version, this.style("version"));
  p = p.adjust(-wh[0]-3, 0);
  var extra = this.style("link");
  extra.link = pjson.homepage;
  this.draw_string(p, pjson.homepage, extra);
  this.doc.restore();
};

PDFDriver.prototype.draw_string = function draw_string(p, str, opts)
{
  opts = opts || {};
  var align = opts.align || "center";

  var w = this.doc.widthOfString(str);
  var h = this.doc.currentLineHeight();
  var dx = 0;
  switch (align) {
    case "center": dx = -w/2; break;
    case "end":
    case "right": dx = -w; break;
  }
  p = p.adjust(dx, -h);

  this.doc.text(str, p.x, p.y, opts);
  if (opts.underline) {
    this.doc.underline(p.x, p.y, w, h, {color: opts.underline});
  }
  if (opts.link) {
    this.doc.link(p.x, p.y, w, h, opts.link);
  }
  return [w, h];
};

PDFDriver.prototype.draw_label = function draw_label(p, str, klasses, theta) {
  if (!str || str.length === 0) {
    return null;
  }
  var angle = (360 - (theta*180/Math.PI)) % 360;
  this.doc.save();
  if (angle) {
    this.doc.rotate(angle,  {origin: [p.x, p.y]});
  }
  this.draw_string(p, str, this.style(klasses));
  this.doc.restore();
  return this.doc;
};

PDFDriver.prototype.transform = function transform(x, y, theta, func) {
  this.doc.save();
  if (x || y) {
    this.doc.translate(x, y);
  }
  if (theta) {
    // clockwise in degrees
    var angle = (360 - (theta*180/Math.PI)) % 360;
    this.doc.rotate(angle, {origin: [0,0]});
  }
  func.call(this);
  this.doc.restore();
};

PDFDriver.prototype.draw_path = function draw_path(cmds, klasses) {
  var d = Driver.prototype.draw_path.call(this, cmds, klasses);

  this.doc.save();
  var extra = this.style(klasses) || {};
  this.doc.path(d);
  switch (extra.drawStyle)
  {
    case "fill": this.doc.fill(); break;
    case "fillAndStroke": this.doc.fillAndStroke(); break;
    default: this.doc.stroke(); break;
  }
  this.doc.restore();
  return this.doc;
};
