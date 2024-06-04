/**
 * @author Mobile.Lab (http://mlearner.com)
 **/

require('../libs/base64');
require('../libs/canvg');
require('./path-data-polyfill'); // SVG API not implemented in major browsers

var breadboardComm      = require('./svg_view_comm');

window.breadboardSVGView = {
  "options" : {
    "rootpath" : "",
    "magnifier" : {
      "time": 400,
      "size": 60,
      "zoom": 2,
      "offset": {
        "x": 80,
        "y": 80
      }
    },
    "fixedCircuit": false
  },
  "util" : {}
};

// window["breadboardSVGView"].connectionMade = function(component, location) {
//   console.log('Received: connect, component|' + component + '|' + location);
// };

// window["breadboardSVGView"].connectionBroken = function(component, location) {
//   console.log('Received: disconnect, component|' + component + '|' + location);
// };

// window["breadboardSVGView"].probeAdded = function(meter, color, location) {
//   console.log('Received: connect, ' + meter + '|probe|' + color + '|' + location);
// };

// window["breadboardSVGView"].probeRemoved = function(meter, color) {
//   console.log('Received: disconnect, ' + meter + '|probe|' + color);
// };

// window["breadboardSVGView"].dmmDialMoved = function(value) {
//   console.log('Received: multimeter_dial >> ' + value);
// };

/**
 * breadboard # util # require
 * >> loading required resources
 **/

(function($, board) {
  $window = $(window);

  board.util.require = function(files, callback) {
    return new LoadingStack(files, callback).load();
  };

  var LoadingStack = function(files, callback) {
    // callback function
    this.callback = callback;
    // downloaded resources
    this.resources = {};
    // main stack of loading files
    this.stack = files;
    // counter of loaded files
    this.loaded = 0;
  };

  LoadingStack.prototype.success = function() {
    if (++this.loaded == this.stack.length) {
      this.callback(this.resources);
    }
  };

  LoadingStack.prototype.attachData = function(file, data) {
    file = file.substring(file.lastIndexOf('\/') + 1, file.lastIndexOf('.'));
    this.resources[file] = data;
  };

  LoadingStack.prototype.load = function() {
    var f;
    for (var i = this.stack.length; i--; ) {
      f = this.stack[i];
      this["load" + f.toUpperCase().substring( f.lastIndexOf('.') + 1 )](f);
    }
  };

  LoadingStack.prototype.loadJS = function(file) {
    file = board.options.rootpath + file;

    $.getScript(file, function(stack) {
      return function() {
        stack.success();
      };
    }(this)).fail(function() {
      console.log("# [error] (while requiring) failed load/compile javascript file: " + file);
    });
  };

  LoadingStack.prototype.loadCSS = function(file) {
    file = board.options.rootpath + file;

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = file;
    document.head.appendChild(link);

    this.success();
  };

  LoadingStack.prototype.loadSVG = function(file) {
    this.loadResource(file);
  };

  LoadingStack.prototype.loadResource = function(file) {
    file = board.options.rootpath + file;

    $.ajax({
      "url" : file,
      "type" : "GET",
      "dataType" : "html",
      "success" : function(stack) {
        return function(data) {
          stack.attachData(file, data);
          stack.success();
        };
      }(this),
      "error" : function() {
        console.log("# [error] (while requiring) failed load resource file: " + file);
      }
    });
  };

})(jQuery, window.breadboardSVGView);

/**
 * breadboardView # board
 * >> create board object with API
 **/

(function($, board) {

  // global link to common SVG-jQuery object
  var paper = null;

  // altough this doesn't work on laptop touch screens it does work on tablets
  var touch = !!('ontouchstart' in document.documentElement);

  // unify events for jQuery .on() handlers
  var _mousedown = 'touchstart mousedown';
  var _mousemove = 'touchmove mousemove';
  var _mouseup = 'touchend mouseup';
  var _mouseover = 'mouseover';
  var _mouseout = 'mouseout';

  var options = board.options;

  // object contains electronic and test equipment
  var equipment = function() {
  };
  // object contains components added to breadboard
  var component = function() {
  };
  // parts of more complex components on breadboard(need only for building)
  var primitive = function() {
  };
  // board constructor
  var CircuitBoard = function(id) {
    this.workbenchController = require('../controllers/workbench-controller');

    var self = this;
    // link to main holder
    this.holder = $('.' + id).html('').append(
      SVGStorage.create('board')
    ).addClass('circuit-board');
    this.holder.h = this.holder.height();
    this.holder.w = this.holder.width();

    this.workspace = this.holder.find("[item=components]");
    this.holes = {
      'row' : {}
    };
    // model of links to components by id and as the array
    this.component = {};
    this.itemslist = [];

    // create model of holes
    var p = SVGStorage.point(), bbox, matrix, elem, name;
    this.holder.find("[hole]").first().each(function() {
      bbox = this.getBBox();
      p.x = bbox.x + bbox.width / 2;
      p.y = bbox.y + bbox.height / 2;
    }).end().each(function() {
      matrix = this.getCTM();
      elem = $(this);
      name = elem.attr("hole");
      elem = new CircuitBoardHole(elem);
      elem.center = p.matrixTransform(matrix);
      if (!self.holes.row[elem.y]) {
        self.holes.row[elem.y] = {};
      }
      self.holes.row[elem.y][elem.x] = elem;
      self.holes[name] = elem;
    });
    this.holes.find = findNearestHole;

    // multimeter (DMM)
    this.multimeter = null;
    // battery
    this.battery = null;
    // probes
    this.probes = [];

    // init all leads draggable
    primitive.prototype.initLeadDraggable(this);
    // init all probes draggable
    primitive.prototype.initProbeDraggable(this);
    // init all components draggable
    primitive.prototype.initComponentDraggable(this);

    this.lastClick = 0;
  };

  CircuitBoard.prototype.bindClickFunction = function(view, obj, func) {
    view.bind("contextmenu click", function(evt) {
      var now = (new Date()).getTime(),
          // fix for double-click events breaking in Chrome 54.0.2840.71 (https://www.pivotaltracker.com/story/show/133182959)
          triggerEvent = (evt.type == "contextmenu") || (now - this.lastClick <= 250);
      this.lastClick = now;
      if (triggerEvent) {
        obj[func]($(this).attr("uid"));
      }
      evt.preventDefault();
      return false;
    });
  };

  CircuitBoard.prototype.sendEventToModel = function(evName, params) {
    breadboardComm[evName](this.workbenchController, params[0], params[1], params[2]);
  };

  CircuitBoard.prototype.addComponent = function(elem) {
    this.component[elem.UID] = new component[elem.type](elem, this.holes, this);
    this.component[elem.UID].type = elem.type;
    this.component[elem.UID].id = elem.UID;
    this.itemslist.push(this.component[elem.UID]);
    this.workspace.append(this.component[elem.UID].view);
    this.component[elem.UID].image = new SVGImage(this, elem.UID);

    if (this.rightClickFunction) {
      this.bindClickFunction(this.component[elem.UID].view, this.rightClickObj, this.rightClickFunction);
    }
  };

  CircuitBoard.prototype.changeResistorColors = function(id, colors) {
    this.component[id].changeColors(colors);
  };

  CircuitBoard.prototype.removeComponent = function(id) {
    if (!this.component[id]) return;
    this.component[id].hole[0].disconnected();
    this.component[id].hole[1].disconnected();
    this.component[id].view.remove();
    this.component[id] = null;
    for (var i = this.itemslist.length; i--; ) {
      if (this.itemslist[i].id === id) {
        this.itemslist.splice(i, 1);
      }
    }
  };

  CircuitBoard.prototype.setRightClickFunction = function(obj, func) {
    this.rightClickObj = obj;
    this.rightClickFunction = func;
    for (var uid in this.component) {
      this.bindClickFunction(this.component[uid].view, obj, func);
    }
  };

  CircuitBoard.prototype.addDMM = function(params) {
    if (!this.multimeter) {
      this.multimeter = new equipment.multimeter(this, params);
      this.probes.push(this.multimeter.probe.black);
      this.probes.push(this.multimeter.probe.red);
    }
    this.multimeter.probe.black.view.show();
    this.multimeter.probe.red.view.show();
    this.multimeter.mmbox.view.show();
    this.setDMMText('  0.0 0');
  };

  CircuitBoard.prototype.hideDMMText = function() {
    if (this.multimeter) {
      for (var i = this.multimeter.mmbox.screen.length; i--; ) {
        this.multimeter.mmbox.screen[i].setAttribute('visibility', 'hidden');
      }
    }
  };

  CircuitBoard.prototype.setDMMText = function(text) {
    if (this.multimeter) {
      for (var i = text.length; i--; ) {
        var val = '#:dmm-digit-' + text.charAt(i);
        this.multimeter.mmbox.screen[i].setAttribute('xlink:href', val);
      }
    }
  };

  CircuitBoard.prototype.removeDMM = function() {
    if (this.multimeter) {
      this.multimeter.probe.black.view.hide();
      this.multimeter.probe.red.view.hide();
      this.multimeter.mmbox.view.hide();
    }
  };

  CircuitBoard.prototype.addBattery = function(connections) {
    var type = "battery";

    if (!this.battery) {
      this.battery = new equipment.battery(this, connections);
      this.workspace.append(this.battery.view);
      this.itemslist.push(this.battery);

      this.component[type] = this.battery;
      this.battery.type = type;
      this.battery.image = new SVGImage(this, type);
    }

    this.battery.btbox.view.show();

    this.battery.pts[0].connected();
    this.battery.pts[1].connected();
  };

  CircuitBoard.prototype.removeBattery = function() {
    if (this.battery) {
      this.battery.btbox.view.hide();
      // this.battery.blackWire.hide();
      // this.battery.redWire.hide();

      this.battery.pts[0].disconnected();
      this.battery.pts[1].disconnected();
    }
  };

  CircuitBoard.prototype.addOScope = function(params) {
    if (!this.oscope) {
      this.oscope = new equipment.oscope(this, params);
      this.probes.push(this.oscope.probe.yellow);
      this.probes.push(this.oscope.probe.pink);
    }
    this.oscope.probe.yellow.view.show();
    this.oscope.probe.pink.view.show();
  };

  CircuitBoard.prototype.removeOScope = function() {
    if (this.oscope) {
      this.oscope.probe.yellow.view.hide();
      this.oscope.probe.pink.view.hide();
    }
  };

  CircuitBoard.prototype.toFront = function(component) {
    var self = this, redrawId;
    // resolve crash in Google Chrome by changing environment
    setTimeout(function() {
      var i = component.view.index();
      if (component.view[0].ownerSVGElement.suspendRedraw) { // IE9 out
        redrawId = component.view[0].ownerSVGElement.suspendRedraw(50);
      }
      // use prepend to avoid crash in iOS
      self.workspace.prepend(component.view.parent().children(':gt(' + i + ')'));
      if (component.view[0].ownerSVGElement.unsuspendRedraw) { // IE9 out
        component.view[0].ownerSVGElement.unsuspendRedraw(redrawId);
      }
    }, 50);
  };

  CircuitBoard.prototype.initMagnifier = function() {
    var brd = this, x, y, t, hole, show_magnifier = false, time;

    var holder = brd.holder, active = false, svghead;
    var dx, dy, z, r, pi2, wm, hm, wb, hb, sh, pos, old;

    time = board.options.magnifier.time;
    hole = SVGStorage.hole;
    svghead = SVGStorage.info.svghead;
    dx = board.options.magnifier.offset.x;
    dy = board.options.magnifier.offset.y;
    z = board.options.magnifier.zoom;
    r = board.options.magnifier.size;
    hm = holder.h * z;
    wm = holder.w * z;
    sh = 60 * z;
    hb = hm - sh;
    wb = wm;

    // not active components buffer
    var comp = context2d();
    comp.canvas.height = hm;
    comp.canvas.width = wm;

    pi2 = Math.PI * 2;
    z--; // for event;

    var magnifier = $('<canvas class="magnifier">').attr({
      'height': holder.h + 'px',
      'width': holder.w + 'px'
    }).appendTo(holder);

    var ctx = magnifier[0].getContext('2d'), buff, lead, elem;

    // create buff image of background and holes
    buff = context2d();
    buff.canvas.height = hm;
    buff.canvas.width = wm;
    buff.fillStyle = '#999181';
    buff.rect(0, 0, wb, sh);
    buff.fill();
    buff.drawImage(SVGStorage.defs[':bg-green-board'], 0, sh, wb, hb);
    buff.drawSvg( SVGStorage.info.svghole, 0, 0, wm, hm );
    buff.fill();
    //window.document.body.appendChild(ctx.canvas);

    // set default style for canvas context2d object

    var magnify = function (evt) {
      pos = getCoords(evt.originalEvent, holder);
      if (active && ((pos.x != old.x) || (pos.y != old.y))) {
        magnifier.show();
        magnifier.draw();
        old = pos;
      }
    };
    var drop = function (evt) {
      if (active) {
        show_magnifier = false;
        magnifier.hide();
        active = false;
        lead = null;
        elem = null;
      }
      $window.off(_mousemove, magnify);
      $window.off(_mouseup, drop);
    };

    holder.on(_mousedown, function(evt) {
      lead = $(evt.target).data('primitive-lead') || null;
      if (lead) {
        elem = brd.component[lead.name];
        comp.update(elem);
        old = pos = getCoords(evt.originalEvent, holder);
        magnifier.draw();
        active = true;
        show_magnifier = true;
        setTimeout(function() {
          if (show_magnifier) {
            magnifier.show();
          }
        }, time);
        $window.on(_mousemove, magnify);
        $window.on(_mouseup, drop);
      }
      evt.preventDefault();
    });

    ctx.font = "bold 16px Arial";

    magnifier.draw = function() {
      ctx.save();
      ctx.clearRect(0, 0, holder.w, holder.h);

      ctx.beginPath();
      ctx.arc(pos.x-dx, pos.y-dy, r, 0, pi2, false);
      ctx.closePath();
      ctx.fill();
      ctx.clip();

      x = -z*pos.x - dx;
      y = -z*pos.y - dy;

      ctx.drawImage(buff.canvas, x, y, wm, hm);
      if (brd.hole_target) {
        ctx.save();
        t = brd.hole_target.view[0].getCTM();
        ctx.translate(x, y);
        ctx.scale(z + 1, z + 1);
        ctx.transform(t.a, t.b, t.c, t.d, t.e, t.f);
        for (var i = 0, l = hole.length; i < l; i++) {
          ctx.fillStyle = hole[i].c;
          ctx.beginPath();
          ctx.arc(hole[i].x, hole[i].y, hole[i].r, 0, pi2, false);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.drawImage(comp.canvas, x, y, wm, hm);
      ctx.drawImage(elem.image.update(), x, y, wm, hm);

      ctx.restore();
      ctx.save();
      ctx.strokeStyle = '#3c3c3c';
      ctx.shadowColor = '#000000';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pos.x-dx, pos.y-dy, r, 0, pi2, false);
      ctx.closePath();
      ctx.stroke();
      if (brd.hole_target) {
        ctx.save();
        ctx.fillStyle = "#00ff00";
        ctx.fillText(brd.hole_target.name, pos.x - r - dx, pos.y - r - dy);
        ctx.restore();
      }
      ctx.restore();

    };

    comp.update = function(elem) {
      this.clearRect(0, 0, wm, hm);
      for (var i = 0, l = brd.itemslist.length; i < l; i++) {
        if (brd.itemslist[i] != elem ) {
          this.drawImage(brd.itemslist[i].image.cnv.canvas, 0, 0, wm, hm);
        }
      }
      for (var p = 0, d = brd.probes.length; p < d; p++ ) {
        this.drawImage(brd.probes[p].image.cnv.canvas, 0, 0, wm, hm);
      }
    };

    // debugging
    //comp.update();
    //comp.canvas.style.border = '1p solir red';
    //document.body.appendChild(comp.canvas);
  };

  CircuitBoard.prototype.setTooltipPosition = function(position) {
    // noop - leaving this in for now as older Teaching Teamwork code calls this
  };

  CircuitBoard.prototype.showTooltip = function(uid, $tipPane) {
    var $comp        = this.component[uid].view,
        holderOffset = this.holder.offset(),
        compOffset   = $comp.offset(),
        compCTM      = $comp[0].getCTM(),
        compWidth    = $comp[0].getBoundingClientRect().width * compCTM.a,  // need to scale the width to the containing SVG
        top          = compOffset.top - holderOffset.top,
        left         = compOffset.left - holderOffset.left,
        divId        = "tooltip_" + uid,
        $tooltip,
        tipWidth,
        tipHeight;

    // don't allow multiple tootips to show for the same component (double click events were adding 2x tooltips)
    if ($("#" + divId).length > 0) {
      return;
    }

    // wrap pane in bubble pane and then empty pane (for mouseout)
    $tooltip = $("<div id='" + divId + "'>").append(
      $("<div class='speech-bubble'>").append($tipPane)
    );
    this.holder.append($tooltip);
    tipWidth = $tipPane.width();
    tipHeight = $tipPane.height();

    left = left + ((tipWidth - compWidth) / 2);
    top  = top - tipHeight - 30; // 30 is height of triangle plus some margin

    // HACK: Firefox does not report the .offset() calls the same as Chrome and IE so manually adjust them
    if (typeof InstallTrigger !== 'undefined') {
      left += (tipWidth / 1.5);
      top += tipHeight * 1.5;
    }

    $tooltip.css({
      position: "absolute",
      left:     left,
      top:      top,
      zIndex:   1000
    });

    // delete on mouseout
    $tooltip.on('mouseleave', function(){
      $tooltip.fadeOut( function() { $(this).remove(); });
    });
  };

  var SVGImage = function(brd, uid) {
    this.comp = brd.component[uid];
    this.brd = brd;
    // main model
    this.view = this.comp.element.view;
    this.cnv = context2d();
    this.ctx = context2d();

    // calc most used variables
    this.ozoom = 1 / board.options.magnifier.zoom;
    this.zoom = board.options.magnifier.zoom;
    this.w = this.brd.holder.w * this.zoom;
    this.h = this.brd.holder.h * this.zoom;

    // set dimention (w * h) for canvas
    this.cnv.canvas.height = this.ctx.canvas.height = this.h;
    this.cnv.canvas.width = this.ctx.canvas.width = this.w;

    // add pattern image of element
    SVGImage[this.comp.type].call(this);

    this.update();
  };

  SVGImage.prototype.update = function() {
    var ctx = this.cnv, elem = this.comp, path, trns, p, l, i;

  // clear context, common part
    this.cnv.clearRect(0, 0, this.w, this.h);
    this.cnv.save();
  // set zoom transform, common part
    this.cnv.scale(this.zoom, this.zoom);

  // draw leads, common part
    for (i = elem.leads.length; i--; ) {
      path = elem.leads[i].state.path;
      trns = path[0].getCTM();
      for (p = 0, l = path.length; p < l; p++) {
        SVGImage.draw_path.call(this, ctx, path[p], trns);
      }
    }

  // draw connector, common part
    path = elem.connector.view.path;
    for (p = 0, l = path.length; p < l; p++) {
      trns =  path[p].getCTM();
      SVGImage.draw_path.call(this, ctx, path[p], trns);
    }

  // draw pattern, spetial part
    this.cnv.save();
    // set reversed transforms
    this.cnv.transform(0.05, 0, 0, 0.05, 0, -50);
    this.cnv.transform(0.8, 0, 0, 0.8, 0, 0);
    // set real transform

    var t = this.view.attr('transform');
    // fix bug in IE with transforms
    t = t.replace(/\) rotate/g,')#rotate')
      .replace(/ /g,',').replace(/#/, ' ');
    t = t.split(' ');
    var t1 = getTransform(t[0]);
    var t2 = getTransform(t[1]);
    this.cnv.translate(t1[0], t1[1]);
    this.cnv.translate(t2[1], t2[2]);
    this.cnv.rotate(t2[0]*Math.PI/180);
    this.cnv.translate(-t2[1], -t2[2]);
    // set reversed spetial transform
    this.cnv.translate(-5000, -5000);
    // set other reversed transforms
    this.cnv.transform(1.25, 0, 0, 1.25, 0, 0);
    this.cnv.transform(20, 0, 0, 20, 0, 1000);
    this.cnv.scale(this.ozoom, this.ozoom);
    // draw pattern element
    if ((this.w > 0) && (this.h > 0)) {
      this.cnv.drawImage(this.ctx.canvas, 0, 0, this.w, this.h);
    }
    // restore context
    this.cnv.restore();

    // debugging
    //this.cnv.canvas.style.border = "1px solid blue";
    //document.body.appendChild(this.cnv.canvas);

    this.cnv.restore();
    return this.cnv.canvas;
  };

  SVGImage.wire = function(elem) {
    // Nothing to do
  };

  SVGImage.battery = function(elem) {
    // Nothing to do
  };

  SVGImage.capacitor = function(elem) {
    var path = this.comp.element.view.path;

    // set zoom transform
    this.ctx.scale(this.zoom, this.zoom);
    // set transform from svg (just copy by hand)
    this.ctx.transform(0.05, 0, 0, 0.05, 0, -50);
    this.ctx.transform(0.8, 0, 0, 0.8, 0, 0);
    // set spetial transform, to make element visible on canvas
    this.ctx.translate(5000, 5000);
    // set this element group transform
    var t = getTransform(this.view.children().first().attr('transform'));
    this.ctx.transform(t[0], t[1], t[2], t[3], t[4], t[5]);

    path = this.view.path;
    for (var p = 0, l = path.length; p < l; p++) {
      SVGImage.draw_path.call(this, this.ctx, path[p]);
    }

    // debugging
    //this.ctx.canvas.style.border = "1px solid red";
    //document.body.appendChild(this.ctx.canvas);
  };

  SVGImage.inductor = function(elem) {
    var path = this.comp.element.view.path, g, t;

    // set zoom transform
    this.ctx.scale(this.zoom, this.zoom);
    // set transform from svg (just copy by hand)
    this.ctx.transform(0.05, 0, 0, 0.05, 0, -50);
    this.ctx.transform(0.8, 0, 0, 0.8, 0, 0);
    // set spetial transform, to make element visible on canvas
    this.ctx.translate(5000, 5000);
    // set this element group transform

    g = this.view.children();
    t = getTransform(g.attr('transform'));
    this.ctx.transform(t[0], t[1], t[2], t[3], t[4], t[5]);

    g = this.view.children().children().not('[type="label"]');
    for (var i = 0, l = g.length; i< l; i++) {
      t = getTransform(g[i].getAttribute('transform'));
      this.ctx.save();
      this.ctx.transform(t[0], t[1], t[2], t[3], t[4], t[5]);
      path = $(g[i]).children()[0];
      SVGImage.draw_path.call(this, this.ctx, path);
      this.ctx.restore();
    }

    // debugging
    //this.ctx.canvas.style.border = "1px solid red";
    //document.body.appendChild(this.ctx.canvas);
  };

  SVGImage.resistor = function(elem) {
    var g, u, t, i, l;

    // set zoom transform
    this.ctx.scale(this.zoom, this.zoom);
    // set transform from svg (just copy by hand)
    this.ctx.transform(0.05, 0, 0, 0.05, 0, -50);
    this.ctx.transform(0.8, 0, 0, 0.8, 0, 0);
    // set spetial transform, to make element visible on canvas
    this.ctx.translate(5000, 5000);
    // set this element group transform

    this.ctx.transform(15, 0, 0, 15, 0, 150);
    this.ctx.scale(0.6, 0.6);

    g = this.view.children().children().not('[type="label"]');

    u = g.children('use').not('[type="hint"]');
    this.ctx.save();
    this.ctx.translate(-94, -32);
    for (i = 0, l = u.length; i< l; i++) {
      SVGImage.draw_use.call(this, this.ctx, u[i]);
    }
    this.ctx.restore();

    g = g.children('g');
    for (i = 0, l = g.length; i< l; i++) {
      this.ctx.save();

      g[i] = $(g[i]);

      t = g[i].attr('transform');
      // fix bug in IE with transforms
      t = t.replace(/\) rotate/g,')#rotate')
        .replace(/ /g,',').replace(/#/, ' ');
      t = t.split(' ');
      var t1 = getTransform(t[0]);
      this.ctx.translate(t1[0], t1[1]);
      if (t[1]) {
        var t2 = getTransform(t[1]);
        this.ctx.scale(t2[0], t2[1]);
      }
      u = g[i].children()[0];
      SVGImage.draw_use.call(this, this.ctx, u);
      this.ctx.restore();
    }

    // debugging
    //this.ctx.canvas.style.border = "1px solid red";
    //document.body.appendChild(this.ctx.canvas);
  };

  SVGImage.probe = function(brd, elem) {
    // main model
    this.view = elem.view;
    this.cnv = context2d();
    this.ctx = context2d();

    // calc most used variables
    this.ozoom = 1 / board.options.magnifier.zoom;
    this.zoom = board.options.magnifier.zoom;
    this.w = brd.holder.w * this.zoom;
    this.h = brd.holder.h * this.zoom;

    // set dimention (w * h) for canvas
    this.cnv.canvas.height = this.ctx.canvas.height = this.h;
    this.cnv.canvas.width = this.ctx.canvas.width = this.w;

    // add pattern image of element
    SVGImage.probe.template.call(this);

    // update
    this.update();
  };

  SVGImage.probe.prototype.update = function() {
    // clear context, common part
    this.cnv.clearRect(0, 0, this.w, this.h);
    this.cnv.save();

    // set real transforms
    this.cnv.scale(this.zoom, this.zoom);
    this.cnv.transform(0.05, 0, 0, 0.05, 0, -100);
    var t = this.view.attr('transform');
    if (t) {
      t = getTransform(t);
      this.cnv.translate(t[0], t[1]);
    }

    t = this.view.children().attr('transform');
    if (t) {
      t = getTransform(t);
      this.cnv.translate(t[0], t[1]);
    }

    t = this.view.children().children().attr('transform');
    t = getTransform(t);

    // set reversed transforms
    this.cnv.translate(this.rt[0], this.rt[1]);
    this.cnv.transform(20, 0, 0, 20, 0, 2000);
    this.cnv.scale(this.ozoom, this.ozoom);

    // draw template image
    if ((this.w > 0) && (this.h > 0)) {
      this.cnv.drawImage(this.ctx.canvas, 0, 0, this.w, this.h);
    }

    // debugging
    //this.cnv.canvas.style.border = "1px solid blue";
    //document.body.appendChild(this.cnv.canvas);

    this.cnv.restore();
    return this.cnv.canvas;
  };

  SVGImage.probe.template = function() {
    var t = this.view.attr('transform-full-visibility');
    t = getTransform(t);

    this.ctx.save();
    // add pattern image of element
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.transform(0.05, 0, 0, 0.05, 0, -100);
    this.ctx.translate(t[0], t[1]);

    // draw all elements, skip type="initial". used as (0, 0)
    this.view.children().children().each(
      SVGImage.probe.template_draw(this.ctx)
    );
    this.ctx.restore();

    // save reversed transform, for update
    this.rt = [-t[0], -t[1]];

    // debugging
    //this.ctx.canvas.style.border = "1px solid blue";
    //document.body.appendChild(this.ctx.canvas);
  };

  SVGImage.probe.template_draw = function(ctx) {
    return function() {
      var elem = $(this), name = this.nodeName.toLowerCase();
      if (name == 'g') {
        ctx.save();
        var t = this.getAttribute('transform');
        if (t) {

          t = getTransform(t);
          ctx.transform(t[0], t[1], t[2], t[3], t[4], t[5]);
        }
        //console.log('g >> ', this.getAttribute('transform'));
        elem.children().each(
          SVGImage.probe.template_draw(ctx)
        );
        ctx.restore();
      } else
      if (name == 'path') {
        //console.log('path >> ', this.getAttribute('transform'))
        SVGImage.draw_path(ctx, this);
      }
    };
  };

  SVGImage.draw_use = function(ctx, use, trn) {
    ctx.save();

    if (trn) {
      ctx.transform(trn.a, trn.b, trn.c, trn.d, trn.e, trn.f);
    }

    var xlink = use.getAttribute('xlink:href').replace('#','');
    var img = SVGStorage.defs[xlink];
    var x = parseInt(use.getAttribute('x'), 10);
    var y = parseInt(use.getAttribute('y'), 10);
    var ox = parseInt(img.ox, 10);
    var oy = parseInt(img.oy, 10);

    ctx.drawImage(img, x + ox, y + oy, img.width, img.height);

    ctx.restore();
  };

  SVGImage.draw_path = function(ctx, path, trn) {
    ctx.save();

    if (trn) {
      ctx.transform(trn.a, trn.b, trn.c, trn.d, trn.e, trn.f);
    }

    var str_lj = path.getAttribute('stroke-linejoin') || false;
    var str_lc = path.getAttribute('stroke-linecap') || false;
    var str_w = parseInt(path.getAttribute('stroke-width'), 10);
    var str_c = path.getAttribute('stroke');
    var fill = path.getAttribute('fill'), f;

    if (str_c) {ctx.strokeStyle = str_c;}
    if (str_w) {ctx.lineWidth = str_w;}
    if (str_lj) {ctx.lineJoin = str_lj;}
    if (str_lc) {ctx.lineCap = str_lc;}

    ctx.beginPath();

    var segs = path.getPathData();
    console.log(segs.length)
    for (var i = 0; i < segs.length; i++) {
      var seg = segs[i];
      var c = seg.type;
      if (c == "M") {
        let x,y = seg.values;
        ctx.moveTo(x, y);
      } else
      if (c == "L") {
        let x,y = seg.values;
        ctx.lineTo(x, y);
      } else
      if (c == "Q") {
        let x1,y1,x,y = seg.values;
        ctx.quadraticCurveTo(x1, y1, x, y);
      } else
      if (c == "A") {
        let rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y = seg.values
       ctx.arc(x - rx, y, seg.rx, 0, Math.PI * 2, true);
      } else
      if (c == "Z") {
        ctx.closePath();
      }
    }

    if (str_c) {ctx.stroke();}

    if (fill && fill != 'none') {
      if (fill.substring(0,3) == 'url') {
        fill = fill.replace(/url\(/gm,'');
        fill = fill.replace(/\)/gm,'');
        f = this.brd.holder.find(fill);
        SVGImage["draw_"+ f[0].nodeName.toLowerCase()](ctx, f);
      } else {
        ctx.fillStyle = fill;
        ctx.fill();
      }
    }

    ctx.restore();
  };

  SVGImage.draw_lineargradient = function(ctx, f) {
    var x1 = parseFloat(f.attr('x1'), 10);
    var y1 = parseFloat(f.attr('y1'), 10);
    var x2 = parseFloat(f.attr('x2'), 10);
    var y2 = parseFloat(f.attr('y2'), 10);

    var trn = (f[0].getAttribute('gradientTransform') || '')
         .replace(/\)/,'').replace(/matrix\(/,'').split(' ');

    ctx.save();

    if (trn) {
      ctx.transform(
        parseFloat(trn[0], 10), parseFloat(trn[1], 10),
        parseFloat(trn[2], 10), parseFloat(trn[3], 10),
        parseFloat(trn[4], 10), parseFloat(trn[5], 10)
      );
    }

    var grad = ctx.createLinearGradient(x1, y1, x2, y2);

    var s = f.children('stop'), i, l;
    for (i = 0, l = s.length; i < l; i++) {
      grad.addColorStop(
        parseFloat(s[i].getAttribute('offset'), 10) ,
        s[i].getAttribute('stop-color-rgba')
      );
    }

    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  };

  SVGImage.draw_radialgradient = function(ctx, f) {
    var fx = parseFloat(f.attr('fx'), 10);
    var fy = parseFloat(f.attr('fy'), 10);
    var cx = parseFloat(f.attr('cx'), 10);
    var cy = parseFloat(f.attr('cy'), 10);
    var r = parseFloat(f.attr('r'), 10);
    var trn = (f[0].getAttribute('gradientTransform') || '')
         .replace(/\)/,'').replace(/matrix\(/,'').split(' ');

    ctx.save();

    if (trn) {
      ctx.transform(
        parseFloat(trn[0], 10), parseFloat(trn[1], 10),
        parseFloat(trn[2], 10), parseFloat(trn[3], 10),
        parseFloat(trn[4], 10), parseFloat(trn[5], 10)
      );
    }

    var grad = ctx.createRadialGradient(fx, fy, 0, cx, cy, r);

    var s = f.children('stop'), i, l;
    for (i = 0, l = s.length; i < l; i++) {
      grad.addColorStop(
        parseFloat(s[i].getAttribute('offset'), 10) ,
        s[i].getAttribute('stop-color-rgba')
      );
    }

    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  };

  // holes constructor

  var CircuitBoardHole = function(elem) {
    this.name = elem.attr('hole');
    this.x = parseInt(elem.attr("transform").match(/(-?\d+\.\d+)|-?\d+/g)[4], 10);
    this.y = parseInt(elem.attr("transform").match(/(-?\d+\.\d+)|-?\d+/g)[5], 10);
    this.num = (elem.attr("xlink:href") == "#$:hole_connected") ? 1 : 0;
    this.view = elem;
  };

  CircuitBoardHole.prototype.connected = function() {
    this.num++;
    this.view.attr("xlink:href", "#$:hole_connected");
    return this;
  };

  CircuitBoardHole.prototype.disconnected = function() {
    if (--this.num === 0) {
      this.view.attr("xlink:href", "#$:hole_not_connected");
    }
    return this;
  };

  CircuitBoardHole.prototype.highlight = function() {
    this.view.attr("xlink:href", "#$:hole_highlighted");
    return this;
  };

  CircuitBoardHole.prototype.unhighlight = function() {
    var pref = (this.num) ? '' : '_not';
    this.view.attr("xlink:href", "#$:hole" + pref + "_connected");
    return this;
  };

  /* === #equipments begin === */

  equipment.multimeter = function(board, params) {
    this.mmbox = new primitive.mmbox(board, params);
    this.probe = {
      "black" : new primitive.probe(board, {
        'connection' : (params.black) ? params.black.connection : false,
        'draggable' : (params.black) ? params.black.draggable : false,
        'color' : 'black',
        'name' : 'dmm'
      }),
      "red" : new primitive.probe(board, {
        'connection' : (params.red) ? params.red.connection : false,
        'draggable' : (params.red) ? params.red.draggable : false,
        'color' : 'red',
        'name' : 'dmm'
      })
    };
  };

  equipment.oscope = function(board, params) {
    this.probe = {
      "yellow" : new primitive.probe(board, {
        'connection' : (params.yellow) ? params.yellow.connection : false,
        'draggable' : (params.yellow) ? params.yellow.draggable : false,
        'color' : 'yellow',
        'name' : 'oscope'
      }),
      "pink" : new primitive.probe(board, {
        'connection' : (params.pink) ? params.pink.connection : false,
        'draggable' : (params.pink) ? params.pink.draggable : false,
        'color' : 'pink',
        'name' : 'oscope'
      })
    };
  };

  equipment.battery = function(board, connections) {
    this.view = SVGStorage.create('group').attr({
      'component' : 'battery'
    });

    // main model
    this.btbox = new primitive.btbox(board);

    var loc = connections.split(',');
    this.pts = [board.holes[loc[0]], board.holes[loc[1]]];

    // create leads

    this.leads = addLeads(this.pts, [300, 45], loc, 'battery', false, board);

    // create wires
    this.wires = [
      new primitive.battery_wire('black', this.pts[0]),
      new primitive.battery_wire('red', this.pts[1])
    ];

    this.view.append(this.wires[0].view, this.wires[1].view);
    this.view.append(this.leads[0].view, this.leads[1].view);

    // model for SVGImage
    this.connector = {"view": this.wires[0].view};
    this.element = {"view": this.wires[0].view};
    this.connector.view.path = this.view.children('g:lt(2)').find('path');

  };

  /* === #equipments end === */

  /* === #components begin === */

  component.prototype.init = function(params, holes, board) {
    var loc = params.connections.split(',');
    this.pts = [holes[loc[0]], holes[loc[1]]];
    this.angle = getAngleBetwPoints(this.pts);
    this.leads = addLeads(this.pts, getDegsFromRad(this.angle), loc, params.UID, params.draggable, board);
    this.view = SVGStorage.create('group').attr({
      'component' : params.type,
      'uid' : params.UID
    });
    this.hole = [this.pts[0].connected(), this.pts[1].connected()];
  };

  component.wire = function(params, holes, board) {
    component.prototype.init.call(this, params, holes, board);
    var color = params.color || "rgb(173,1,1)";
    this.element = new primitive.connector(this.pts, this.angle, [color, color]);
    this.connector = this.element;
    this.view.append(this.element.view, this.leads[0].view, this.leads[1].view);
    // add event handler for draggable
    component.prototype.drag.call(this, params.draggable, params.type);
  };

  component.inductor = function(params, holes, board) {
    component.prototype.init.call(this, params, holes, board);
    this.connector = new primitive.connector(this.pts, this.angle, ['rgb(108,27,13)', 'rgb(185,77,42)']);
    this.element = new primitive.inductor(this.pts, this.angle, params.label);
    this.view.append(this.connector.view, this.leads[0].view, this.leads[1].view, this.element.view);
    // add event handler for draggable
    component.prototype.drag.call(this, params.draggable);
  };

  component.resistor = function(params, holes, board) {

    component.prototype.init.call(this, params, holes, board);
    this.connector = new primitive.connector(this.pts, this.angle);
    this.element = new primitive.resistor(this.pts, this.angle, params.label, params.color);
    this.view.append(this.leads[0].view, this.leads[1].view, this.connector.view, this.element.view);
    // add event handler for draggable
    component.prototype.drag.call(this, params.draggable);

    if (board.workbenchController.workbench.interface.hideResistorBands) {
      bands = this.view.find('[type^=band]');
      bands.each(function(i) {
        $(this).attr('visibility', 'hidden');
      });
    }

    this.changeColors = function(colors) {
      bands = this.view.find('[type^=band]');
      bands.each(function(i) {
        if (i != (colors.length - 1)) {
          $(this).attr('xlink:href', '#:$:band-s-' + colors[i]);
        } else {
          $(this).attr('xlink:href', '#:$:band-b-' + colors[i]);
        }
      });
      tooltips = this.view.find('[tooltip^=band]');
      tooltips.each(function(i) {
        $(this).attr('xlink:href', '#:$:resistor-hint-' + colors[i]);
      });
    };
  };

  component.capacitor = function(params, holes, board) {
    component.prototype.init.call(this, params, holes, board);
    var color = params.color || "rgb(255,0,0)";
    this.connector = new primitive.connector(this.pts, this.angle);
    this.element = new primitive.capacitor(this.pts, this.angle, params.label, color);
    this.view.append(this.leads[0].view, this.leads[1].view, this.connector.view, this.element.view);
    // add event handler for draggable
    component.prototype.drag.call(this, params.draggable);
  };

  component.prototype.drag = function(draggable, type) {
    if (draggable) {
      var self = this;
      this.x = 0;
      this.y = 0;
      if (type == 'wire') {
        this.view.find('[drag=area]').attr('display', 'inline');
      }
      this.element.view.on(_mousedown, function(evt) {
        self.element.view.data('component', self);
        evt._target = this;
        evt.originalEvent._target = this;
      });
    }
  };

  /* === #components end === */

  /* === #primitive begin === */

  primitive.prototype.initComponentDraggable = function(board) {
    var component, s_pos, c_pos, x = 0, y = 0, coeff = 25, dx, dy;
    var l1, l2, ho1, ho2, hn1, hn2, c, deg, angle;
    var hi1, hi2;
    var p1 = {
      x : 0,
      y : 0
    }, p2 = {
      x : 0,
      y : 0
    }, pts = [p2, p1];

    if (options.fixedCircuit) {
      return;
    }

    var drag = function (evt) {
      if (component) {
        c_pos = getCoords(evt.originalEvent, board.holder);
        dx = c_pos.x - s_pos.x;
        dy = c_pos.y - s_pos.y;
        x = component.x + dx * coeff;
        y = component.y + dy * coeff;
        // update view of component
        component.view.attr('transform', 'translate(' + x + ',' + y + ')');
        // highlight nearest holes
        p1.x = l1.x + dx * coeff;
        p1.y = l1.y + dy * coeff;
        p2.x = l2.x + dx * coeff;
        p2.y = l2.y + dy * coeff;
        hn1 = board.holes.find(p1);
        hn2 = board.holes.find(p2);
        if (hi1 || hi2) {
          hi1.disconnected().highlight();
          hi2.disconnected().highlight();
          hi1 = hi2 = null;
          // sent event to model
          if (l1.state != l1.view_d) {
            l1.board.sendEventToModel("connectionBroken", [l1.name, l1.hole]);
          }
          if (l2.state != l2.view_d) {
            l2.board.sendEventToModel("connectionBroken", [l2.name, l2.hole]);
          }
        }
        if (hn1 != ho1) {
          ho1.unhighlight();
          ho1 = hn1.highlight();
        }
        if (hn2 != ho2) {
          ho2.unhighlight();
          ho2 = hn2.highlight();
        }
      }
    };
    var drop = function (evt) {
      if (component) {
        // snap to nearest holes
        component.hole[0] = hn1;
        component.hole[1] = hn2;
        l1.hole = hn1.name;
        l2.hole = hn2.name;
        component.x = 0;
        component.y = 0;
        // update all primitives
        p1.x = l1.x = hn1.x;
        p1.y = l1.y = hn1.y;
        p2.x = l2.x = hn2.x;
        p2.y = l2.y = hn2.y;
        // update view
        hn1.unhighlight();
        hn2.unhighlight();
        if (!hi1) {
          hn1.connected();
          l1.connect();
        }
        if (!hi2) {
          hn2.connected();
          l2.connect();
        }
        updateComponentView();
        // reset temp variables
        component = null;
        hn1 = null;
        hn2 = null;
      }
      $window.off(_mousemove, drag);
      $window.off(_mouseup, drop);
    };

    board.holder.on(_mousedown, function(evt) {
      component = $(evt._target).data('component') || null;
      if (component) {
        s_pos = getCoords(evt.originalEvent, board.holder);

        l1 = component.leads[0];
        l2 = component.leads[1];

        p1.x = l1.x;
        p1.y = l1.y;
        p2.x = l2.x;
        p2.y = l2.y;

        ho1 = component.hole[0].highlight();
        ho2 = component.hole[1].highlight();
        hi1 = hn1 = ho1;
        hi2 = hn2 = ho2;

        board.toFront(component);
        evt.preventDefault();

        $window.on(_mousemove, drag);
        $window.on(_mouseup, drop);
      }
    });

    var updateComponentView = function() {
      c = {
        x : (p1.x + p2.x) / 2,
        y : (p1.y + p2.y) / 2
      };
      angle = getDegsFromRad(getAngleBetwPoints(pts));
      deg = (angle > 90 || angle < -90) ? (angle + 180) : angle;
      // update view of primitives
      component.view.removeAttr('transform');
      l1.view.attr('transform', 'translate(' + l1.x + ',' + l1.y + ') rotate(' + angle + ',130,130)');
      l2.view.attr('transform', 'translate(' + l2.x + ',' + l2.y + ') rotate(' + angle + ',130,130)');
      component.element.view.attr('transform', 'translate(' + c.x + ',' + c.y + ') rotate(' + deg + ',132.5,132.5)');
      setConnectorView(component.connector.view, pts, angle);
      component.image.update();
    };

  };

  primitive.prototype.initLeadDraggable = function(board) {
    var lead_this, lead_pair, component, coeff = 25;
    // coeff = 1 / (0.05*0.8)
    var s_pos, c_pos, dx, dy, pts, angle, c;
    var p1 = {
      x : 0,
      y : 0
    }, p2 = {
      x : 0,
      y : 0
    }, deg, hi, ho, hn;

    if (options.fixedCircuit) {
      return;
    }

    var drag = function (evt) {
      if (lead_this) {
        // calc move params
        c_pos = getCoords(evt.originalEvent, board.holder);
        dx = c_pos.x - s_pos.x;
        dy = c_pos.y - s_pos.y;
        p1.x = lead_this.x + dx * coeff;
        p1.y = lead_this.y + dy * coeff;
        // update view of component
        updateComponentView();
        // update flag for hover events
        lead_this.isDragged = true;
        // find the nearest hole
        hn = board.holes.find(p1);
        board.hole_target = hn;
        if (hi) {
          hi.disconnected().highlight();
          hi = null;
          // sent event to model
          if (lead_this.state != lead_this.view_d) {
            lead_this.board.sendEventToModel("connectionBroken", [lead_this.name, lead_this.hole]);
          }
        }
        if (hn != ho) {
          ho.unhighlight();
          ho = hn.highlight();
        }
      }
    };
    var drop = function (evt) {
      if (lead_this) {
        lead_this.isDragged = false;
        lead_this.x = p1.x = hn.x;
        lead_this.y = p1.y = hn.y;
        lead_this.hole = hn.name;
        component.hole[0] = board.holes[lead_this.hole];
        component.hole[1] = board.holes[lead_pair.hole];
        updateComponentView();
        hn.unhighlight();
        if (!hi) {
          lead_this.connect();
          hn.connected();
        }
        // reset temp links
        hn = null;
        ho = null;
        lead_this = null;
        lead_pair = null;
      }
      if ($(evt.originalEvent.target).data('component-lead')) {
        var name = $(evt.originalEvent.target).data('component-lead');
        board.component[name].image.update();
      }
      $window.off(_mousemove, drag);
      $window.off(_mouseup, drop);
    };

    board.holder.on(_mousedown, function(evt) {
      lead_this = $(evt.target).data('primitive-lead') || null;
      if (lead_this) {
        lead_this.isDragged = false;
        component = board.component[lead_this.name];
        lead_pair = findLeadPair(component, lead_this);
        hi = board.holes.find(lead_this).highlight();
        hn = ho = hi;
        s_pos = getCoords(evt, board.holder);
        p2.x = lead_pair.x;
        p2.y = lead_pair.y;
        pts = (lead_this.orientation == 1) ? [p1, p2] : [p2, p1];
        evt.preventDefault();
        $window.on(_mousemove, drag);
        $window.on(_mouseup, drop);
      }
    });

    var updateComponentView = function() {
      lead_this.arrow.hide();
      c = {
        x : (p1.x + p2.x) / 2,
        y : (p1.y + p2.y) / 2
      };
      angle = getDegsFromRad(getAngleBetwPoints(pts));
      deg = (angle > 90 || angle < -90) ? (angle + 180) : angle;
      // update view of primitives
      lead_this.view.attr('transform', 'translate(' + p1.x + ',' + p1.y + ') rotate(' + angle + ',130,130)');
      lead_pair.view.attr('transform', 'translate(' + p2.x + ',' + p2.y + ') rotate(' + angle + ',130,130)');
      component.element.view.attr('transform', 'translate(' + c.x + ',' + c.y + ') rotate(' + deg + ',132.5,132.5)');
      setConnectorView(component.connector.view, pts, angle);
    };

  };

  primitive.lead = function(type, pos, angle, draggable) {
    var lead = SVGStorage.create('lead').clone(), self = this;
    this.view_d = lead.find('[type="disconnected"]').hide();
    this.view_d.path = this.view_d.find('[type="wire"]>path');
    this.view_c = lead.find('[type="connected"]').show();
    this.view_c.path = this.view_c.find('[type="wire"]>path');

    // name of component
    this.name = pos.name;
    // name of hole
    this.hole = pos.hole;
    // link to change colors
    this.wire = lead.find('[type="wire"] path');
    // link to current visible lead
    this.state = this.view_c;
    // link to probe;
    this.probe = false;

    // set the right direction
    this.orientation = (type == 'left') ? 1 : -1;
    lead.find('[type="orientation"]').attr({
      "transform" : 'matrix(' + self.orientation + ' 0 0 1 0 0)'
    });

    // set the position
    lead.attr("transform", "matrix(1 0 0 1 " + pos.x + " " + pos.y + ") rotate(" + (180 + angle) + ",130,130)");
    this.x = pos.x;
    this.y = pos.y;

    this.arrow = lead.find('.arrow').hide();
    // bind hover events
    var action = lead.find("[type=action]");
    action.on('mouseover', function() {
      self.arrow.show();
    });
    action.on('mouseout', function() {
      self.arrow.hide();
    });
    if (draggable) {
      action.data('primitive-lead', this);
    }
    action.data('component-lead', this.name);

    // bind onclick events
    if (!options.fixedCircuit) {
      action.on(_mouseup, function(l) {
        var f = false,
            lastCall = 0;
        return function(evt) {
          var now = Date.now();
          // since this could get both the touched and mouseup events ignore the second event if there is one
          if (now - lastCall > 100) {
            l[ (f = !f) ? 'disconnect' : 'connect' ]();
          }
          lastCall = now;
        };
      }(this));
    }

    this.view = lead;
  };

  primitive.lead.prototype.connect = function() {
    this.state = this.view_c;
    this.view_d.hide();
    this.view_c.show();
    this.snapProbe();
    this.board.sendEventToModel("connectionMade", [this.name, this.hole]);
  };

  primitive.lead.prototype.disconnect = function() {
    this.state = this.view_d;
    this.view_c.hide();
    this.view_d.show();
    this.snapProbe();
    this.board.sendEventToModel("connectionBroken", [this.name, this.hole]);
  };

  primitive.lead.prototype.highlight = function(m) {
    var colors = {// colors for each path
      '0' : ['51, 51, 51', '160,160,160', '229,229,229'],
      '1' : [' 51, 51,255', '160,160,255', '229,229,255'],
      '2' : ['130,110,150', '240,220,160', '255,255,255']
    };

    for (var i = 3; i--; ) {
      this.wire[i + 0].setAttribute('stroke', 'rgb(' + colors[m][i] + ')');
      this.wire[i + 3].setAttribute('stroke', 'rgb(' + colors[m][i] + ')');
    }
  };

  primitive.lead.prototype.calcbbox = function() {
    var matrix = this.state[0].getCTM();
    var bbox = this.state[0].getBBox();
    var p = [SVGStorage.point(), SVGStorage.point(), SVGStorage.point(), SVGStorage.point()];
    // top left point
    p[0].x = bbox.x;
    p[0].y = bbox.y;
    // top right point
    p[1].x = bbox.x + bbox.width;
    p[1].y = bbox.y;
    // bottom right point
    p[2].x = bbox.x + bbox.width;
    p[2].y = bbox.y + bbox.height;
    // bottom left point
    p[3].x = bbox.x;
    p[3].y = bbox.y + bbox.height;
    // apply matrix transform to all points
    for (var i = p.length; i--; ) {
      p[i] = p[i].matrixTransform(matrix);
    }
    // return result
    this.state.bbox = p;
  };

  primitive.lead.prototype.hasPoint = function(p) {
    var a, b, c, sa, sb, sc;
    a = this.state.bbox[0];
    b = this.state.bbox[2];
    // first triangle
    c = this.state.bbox[1];
    sa = (a.x - p.x) * (b.y - a.y) - (b.x - a.x) * (a.y - p.y);
    sb = (b.x - p.x) * (c.y - b.y) - (c.x - b.x) * (b.y - p.y);
    sc = (c.x - p.x) * (a.y - c.y) - (a.x - c.x) * (c.y - p.y);
    if ((sa >= 0 && sb >= 0 && sc >= 0) || (sa <= 0 && sb <= 0 && sc <= 0)) {
      return true;
    }
    //second triangle
    c = this.state.bbox[3];
    sa = (a.x - p.x) * (b.y - a.y) - (b.x - a.x) * (a.y - p.y);
    sb = (b.x - p.x) * (c.y - b.y) - (c.x - b.x) * (b.y - p.y);
    sc = (c.x - p.x) * (a.y - c.y) - (a.x - c.x) * (c.y - p.y);
    if ((sa >= 0 && sb >= 0 && sc >= 0) || (sa <= 0 && sb <= 0 && sc <= 0)) {
      return true;
    }
    // return false if no
    return false;
  };

  primitive.lead.prototype.snapProbe = function() {
    if (this.probe) {
      this.probe.snap();
    }
  };

  primitive.connector = function(pts, angle, color) {
    var connector = SVGStorage.create('connector').clone();
    connector.path = connector.find('path');
    angle = getDegsFromRad(angle) + 180;

    setConnectorView(connector, [pts[1], pts[0]], angle);

    if (color !== undefined) {
      connector.find('[type=line]').eq(1).attr('stroke', color[0]);
      connector.find('[type=line]').eq(2).attr('stroke', color[1]);
    }
    this.view = connector;
  };

  primitive.inductor = function(pts, angle, labelText, draggable) {
    var inductor = SVGStorage.create('inductor').clone();
    angle = getDegsFromRad(angle);

    inductor.path = inductor.find('path').not('[type="label-bg"]');

    if (angle > 90 || angle < -90) {
      angle += 180;
    }
    inductor.attr('transform', 'translate(' + parseInt((pts[0].x + pts[1].x) / 2, 10) + ',' + parseInt((pts[0].y + pts[1].y) / 2, 10) + ') rotate(' + angle + ',132.5,132.5)');

    var label = inductor.find('[type=label]');
    if (labelText) {
      inductor.on('mouseover', function() {
        label.show();
      });
      inductor.on('mouseout', function() {
        label.hide();
      });
    } else if (labelText) {
      label.show();
    }
    inductor.find('[type=label_text]').append(labelText);

    this.view = inductor;
  };

  primitive.capacitor = function(pts, angle, labelText, color) {
    var capacitor = SVGStorage.create('capacitor').clone();
    var label = capacitor.find('[type=label]');
    angle = getDegsFromRad(angle);

    capacitor.path = capacitor.find('path');

    if (angle > 90 || angle < -90) {
      angle += 180;
    }
    capacitor.attr('transform', 'translate('+parseInt((pts[0].x + pts[1].x) / 2, 10) + ',' + parseInt((pts[0].y + pts[1].y) / 2, 10) + ') rotate(' + angle + ',132.5,132.5)');

    if (labelText) {
      capacitor.on('mouseover', function() {
        label.show();
      });
      capacitor.on('mouseout', function() {
        label.hide();
      });
    } else if (labelText) {
      label.show();
    }
    capacitor.find('[type=label_text]').append(labelText);
    if (color !== undefined) {
      capacitor.find('[type=cap]').eq(0).attr('fill', color);
    }
    this.view = capacitor;
  };

  primitive.resistor = function(pts, angle, labelText, colors) {
    var resistor = SVGStorage.create('resistor' + colors.length + 'band').clone();
    var tooltip = {};
    var label = resistor.find('[type=label]');
    var band = resistor.find('[type^=band]');
    angle = getDegsFromRad(angle);

    resistor.path = resistor.find('use')
               .not('[type="label-bg"]')
                  .not('[type="hint"]');

    if (angle > 90 || angle < -90) {
      angle += 180;
    }
    resistor.attr('transform', 'translate(' + parseInt((pts[0].x + pts[1].x) / 2, 10) + ',' + parseInt((pts[0].y + pts[1].y) / 2, 10) + ') rotate(' + angle + ',132.5,132.5)');

    band.each(function(i) {
      if (i != (colors.length - 1)) {
        $(this).attr('xlink:href', '#:$:band-s-' + colors[i]);
      } else {
        $(this).attr('xlink:href', '#:$:band-b-' + colors[i]);
      }
    });
    if (!touch) {
      if (labelText) {
        resistor.bind('mouseover', function() {
          label.show();
        });
        resistor.bind('mouseout', function() {
          label.hide();
        });
      }

      band.each(function(i) {
        tooltip[$(this).attr('type')] = resistor.find('[tooltip=' + $(this).attr('type') + ']').attr('xlink:href', '#:$:resistor-hint-' + colors[i]);

        $(this).bind('mouseover', function() {
          $(this).attr('transform', 'scale(1.6)');
          tooltip[$(this).attr('type')].show();
        });
        $(this).bind('mouseout', function() {
          $(this).attr('transform', 'scale(1)');
          tooltip[$(this).attr('type')].hide();
        });
      });
    } else if (labelText) {
      label.show();
    }

    resistor.find('[type=label_text]').append(labelText);

    this.view = resistor;
  };

  primitive.prototype.initProbeDraggable = function(board) {
    var active, lead_new, lead_old, lead_init, point;
    var s_pos, c_pos, x, y, dx, dy, coeff = 20;

    var drag = function (evt) {
      if (active) {
        c_pos = getCoords(evt.originalEvent, board.holder);
        dx = c_pos.x - s_pos.x;
        dy = c_pos.y - s_pos.y;
        //coord for view translations
        x = active.dx + dx * coeff;
        y = active.dy + dy * coeff;
        active.view.attr('transform', 'translate(' + x + ',' + y + ')');
        //coord for real probe coords
        point = {
          'x' : (active.x + dx),
          'y' : (active.y + dy)
        };
        lead_new = findLeadUnderProbe(board, point);
        if (lead_init) {
          board.sendEventToModel("probeRemoved", [active.name, active.color, lead_init.hole]);
          lead_init = null;
        }
        if (lead_new) {
          lead_new.highlight(1);
          lead_old = lead_new;
          //active.lead = lead_new;
        } else {
          if (lead_old) {
            lead_old.highlight(0);
            lead_old = null;
          }
        }
      }
    };
    var drop = function (evt) {
      if (active) {
        active.z.attr('transform', active.z.init);
        active.x += dx;
        active.y += dy;
        active.dx = x;
        active.dy = y;
        if (lead_new) {
          active.setState(lead_new);
        } else {
          board.sendEventToModel("probeDropped", [active.name, active.color, {x: active.x, y: active.y, dx: active.dx, dy: active.dy}]);
          if (active.lead) {
            active.lead = null;
          }
        }
        active.image.update();
        active = null;
      }
      $window.off(_mousemove, drag);
      $window.off(_mouseup, drop);
    };

    board.holder.find('[info=probe]').on(_mousedown, function(evt) {
      active = $(this).data('primitive-probe') || {};
      if (active.draggable) {
        active.z.attr('transform', active.z.zoom);
        s_pos = getCoords(evt.originalEvent, board.holder);
        calcLeadsBBox.call(board);
        lead_init = active.lead;
        evt.stopPropagation();
        evt.preventDefault();
        // hack to avoid errors if mousedown+mouseup-mousemove
        x = active.dx;
        y = active.dy;
        dx = dy = 0;
        $window.on(_mousemove, drag);
        $window.on(_mouseup, drop);
      } else {
        active = null;
      }
    });
  };

  primitive.probe = function(board, params) {
    // shortcats
    var self = this;
    // temp vars
    var point, coeff = 1.25, lead;

    var elem = board.holder.find('[info=probe][name=' + params.color + ']');
    var initial = elem.find('[type=initial]');

    if (params.connection) {// move to this position
      initial.attr('transform', 'translate(' + (board.holes[params.connection].x / coeff) + ',' + (board.holes[params.connection].y / coeff) + ')');
    }

    this.z = elem.find('[type="zooming"]');
    this.z.zoom = this.z.attr('transform-zoomed');
    this.z.init = this.z.attr('transform');

    // make object
    point = getAttractionPoint(elem);
    this.draggable = params.draggable;
    this.color = params.color;
    this.name = params.name;
    this.x = point.x;
    this.y = point.y;
    this.lead = null;
    this.dx = 0;
    this.dy = 0;
    this.view = elem;
    this.view.show = self.show;
    this.view.hide = self.hide;
    this.view.data('primitive-probe', this);
    this.image = new SVGImage.probe(board, this);

    if (params.connection) {// snap to lead
      calcLeadsBBox.call(board);
      lead = findLeadUnderProbe(board, {
        'x' : this.x,
        'y' : this.y
      });
      if (lead) {
        this.setState(lead);
      }
    }

  };

  primitive.probe.prototype.setState = function(lead) {
    this.lead = lead;
    this.lead.probe = this;
    this.lead.highlight(2);
    this.snap();
    lead.board.sendEventToModel("probeAdded", [this.name, this.color, this.lead.hole]);
  };

  primitive.probe.prototype.snap = function() {
    if (this.lead) {
      var p = getAttractionPoint(this.lead.state);
      var coeff = 20;
      var dx = p.x - this.x;
      var dy = p.y - this.y;
      var x = this.dx + dx * coeff;
      var y = this.dy + dy * coeff;
      this.view.attr('transform', 'translate(' + x + ',' + y + ')');
      //coord for real probe coords
      this.x += dx;
      this.y += dy;
      this.dx = x;
      this.dy = y;
    }
  };

  primitive.probe.prototype.show = function() {
    this.css('visibility', 'visible');
  };

  primitive.probe.prototype.hide = function() {
    this.css('visibility', 'hidden');
  };

  primitive.probe.prototype.move = function(pos) {
    this.x = pos.x;
    this.y = pos.y;
    this.dx = pos.dx;
    this.dy = pos.dy;
    this.view.attr('transform', 'translate(' + this.dx + ',' + this.dy + ')');
  };

  primitive.mmbox = function(board, params) {
    this.view = board.holder.find('[info="multimeter"]');
    this.bttn = this.view.find('[info="dmm-bttn"]');
    this.over = this.view.find('[info="dmm-zoom"]');
    this.item = this.view.find('[info="dmm-box"]');
    this.help = this.view.find('[info="zoom-in"]');
    this.board = board;
    this.zoom = 0;
    // 0-normal view, not zoomed, 1-zoomed
    this.state = null;

    this.screen = this.view.find('[type="dmm-screen-digits"]').children('use');

    this.setState(this.model(params.dial || 0));

    var self = this;

    this.view.on('mouseenter', function() {
      if (!self.zoom) {
        self.help.show();
      }
    });
    this.view.on('mouseleave', function() {
      self.help.hide();
      //self.zoomOut();
    });

    // hover helps
    this.view.find('.help').each(function() {
      var elem = $(this);
      var usual = elem.find('.usual').show();
      var hover = elem.find('.hover').hide();
      var bttn = elem.find('.event');

      bttn.on('mouseenter', function() {
        usual.hide();
        hover.show();
      });
      bttn.on('mouseleave', function() {
        hover.hide();
        usual.show();
      });
    });

    this.view.on(_mousedown, function(evt) {
      if (!self.zoom) {
        self.zoomIn();
      }
      evt.stopPropagation();
      evt.preventDefault();
    });
    board.holder.on(_mousedown, function(evt) {
      if (self.zoom) {
        self.zoomOut();
      }
    });

    // bind events for bttn (tumbler)
    this.point_center = null;
    this.point_calibr = null;
    var tumbler_on = false;

    var rotate = function (evt) {
      if (tumbler_on) {
        self.rotate(getCoords(evt.originalEvent, board.holder));
      }
    };
    var drop = function (evt) {
      self.point_center = null;
      self.point_calibr = null;
      tumbler_on = false;
      $window.off(_mousemove, rotate);
      $window.off(_mouseup, drop);
    };

    this.bttn.on(_mousedown, function(evt) {
      self.point_center = getAttractionPoint(self.view, 'point-center');
      self.point_calibr = getAttractionPoint(self.view, 'point-calibr');
      self.rotate(getCoords(evt.originalEvent, board.holder));
      tumbler_on = true;
      $window.on(_mousemove, rotate);
      $window.on(_mouseup, drop);
    });
  };

  primitive.mmbox.prototype.model = function(v) {
    var n = isNaN(parseInt(v, 10)) ? 1 : 0;
    var k, i, d, md = 360;
    var stack = [[0, 'acv_750'], [17, 'acv_200'], [35, 'p_9v'], [52, 'dca_200mc'], [70, 'dca_2000mc'], [88, 'dca_20m'], [105, 'dca_200m'], [122, 'c_10a'], [140, 'hfe'], [159, 'diode'], [178, 'r_200'], [196, 'r_2000'], [215, 'r_20k'], [233, 'r_200k'], [252, 'r_2000k'], [270, 'dcv_200m'], [288, 'dcv_2000m'], [306, 'dcv_20'], [324, 'dcv_200'], [342, 'dcv_1000']];
    if (!n) {
      v = parseInt(v, 10);
      for ( i = stack.length; i--; ) {
        d = Math.abs(stack[i][n] - v);
        if (d > 180) {
          d = 360 - d;
        }
        if (d < md) {
          md = d;
          k = i;
        }
      }
      v = stack[k][n];
    }
    for ( i = stack.length; i--; ) {
      if (stack[i][n] == v) {
        return stack[i];
      }
    }
  };

  primitive.mmbox.prototype.rotate = function(p) {
    var p1 = {
      'x' : (this.point_calibr.x - this.point_center.x),
      'y' : (this.point_calibr.y - this.point_center.y)
    };
    var p2 = {
      'x' : (p.x - this.point_center.x),
      'y' : (p.y - this.point_center.y)
    };
    var l1 = Math.sqrt(p1.x * p1.x + p1.y * p1.y);
    var l2 = Math.sqrt(p2.x * p2.x + p2.y * p2.y);

    var angle = getDegsFromRad(Math.acos((p1.x * p2.x + p1.y * p2.y) / (l1 * l2)));

    if (p2.x < 0) {
      angle = 360 - angle;
    }

    var model = this.model(angle);

    if (this.state != model[1]) {
      this.setState(model);
    }
  };

  primitive.mmbox.prototype.setState = function(state) {
    this.bttn.attr('transform', 'rotate(' + state[0] + ')');
    this.state = state[1];
    this.board.sendEventToModel("dmmDialMoved", [this.state]);
  };

  primitive.mmbox.prototype.zoomOut = function() {
    this.item.attr('transform', 'scale(0.50)');
    this.over.show();
    this.zoom = 0;
  };

  primitive.mmbox.prototype.zoomIn = function() {
    this.item.attr('transform', 'scale(1.00)');
    this.help.hide();
    this.over.hide();
    this.zoom = 1;
  };

  primitive.btbox = function(board) {
    var self = this;

    this.view = board.holder.find('[info="battery"]');

    this.view.on(_mouseup, function() {
      self.view.attr('transform', 'scale(1.5)');
      setTimeout(function() {
        self.view.attr('transform', 'scale(1)');
      }, 3000);
    });
    this.view.on(_mouseout, function() {
      self.view.attr('transform', 'scale(1)');
    });
  };

  primitive.battery_wire = function(name, point) {
    this.view = SVGStorage.create('battery_wire_' + name).clone();
    this.view.attr('transform', 'translate('+ point.x +','+ point.y +') rotate(0,0,0)');
  };

  /* === #primitive end === */

  /* === #utils start === */

  var context2d = function() {
    return document.createElement('canvas').getContext('2d');
  };
  var addLeads = function(pts, angle, loc, name, drag, board) {
    var leads = ["right", "left"], angles = [];
    angles = ($.isArray(angle)) ? [angle[0], angle[1]] : [angle, angle];

    for (var i = 0; i < leads.length; i++) {
      leads[i] = new primitive.lead(leads[i], {
        x : pts[i].x,
        y : pts[i].y,
        hole : loc[i],
        name : name
      }, angles[i], drag);
      leads[i].board = board;
      leads[i].connect();
    }
    return leads;
  };
  var setConnectorView = function(elem, pts, deg) {
    // calc transforms
    var trn = 'translate(' + parseInt(pts[0].x, 10) + ',' + parseInt(pts[0].y, 10) + ') rotate(' + deg + ',130,130)';
    // calc path
    var leadLenght = 560, coeff = 0.6;
    var dx = pts[0].x - pts[1].x, dy = pts[0].y - pts[1].y;
    var l = Math.sqrt(dx * dx + dy * dy) - leadLenght * 2;
    var path = 'M 0 0 L ' + l / coeff + ' 0';
    if (l > 0) {
      elem.find('[drag=area]').attr('width', l / coeff);
    }
    // set view
    elem.attr('transform', trn);
    elem.find('[type=line]').each(function() {
      this.setAttribute('d', path);
    });
  };
  var calcLeadsBBox = function() {
    for (var i = this.itemslist.length; i--; ) {
      for (var j = this.itemslist[i].leads.length; j--; ) {
        this.itemslist[i].leads[j].calcbbox();
      }
    }
  };
  var findLeadUnderProbe = function(self, point) {
    for (var i = self.itemslist.length; i--; ) {
      for (var j = self.itemslist[i].leads.length; j--; ) {
        var lead = self.itemslist[i].leads[j];
        if (lead.hasPoint(point)) {
          return lead;
        }
      }
    }
    return false;
  };
  var findLeadPair = function(elem, lead) {
    return (elem.leads[0] === lead) ? elem.leads[1] : elem.leads[0];
  };
  var findNearestHole = function(p) {
    p.y = Math.round(p.y / 50) * 50;
    p.x = Math.round(p.x / 50) * 50;
    var yd, yu, xd, xu, x, y;
    yd = yu = p.y;
    xd = xu = p.x;
    // first, find neares row
    while (true) {
      if (this.row[yd]) {
        y = yd;
        break;
      }
      if (this.row[yu]) {
        y = yu;
        break;
      }
      yd += 50;
      yu -= 50;
    }
    // second, find nearest cell
    while (true) {
      if (this.row[y][xd]) {
        x = xd;
        break;
      }
      if (this.row[y][xu]) {
        x = xu;
        break;
      }
      xd += 50;
      xu -= 50;
    }
    // return result
    return this.row[y][x];
  };
  var getAttractionPoint = function(elem, name) {
    name = name || 'attraction';
    var point = elem.find('[type="'+name+'"]')[0];
    var matrix = point.getCTM();
    var bbox = point.getBBox();
    var p = SVGStorage.point();
    p.x = bbox.x + bbox.width / 2;
    p.y = bbox.y + bbox.height / 2;
    return p.matrixTransform(matrix);
  };
  var getAngleBetwPoints = function(pts) {
    return Math.atan2((pts[1].y - pts[0].y), (pts[1].x - pts[0].x));
  };
  var getDegsFromRad = function(rad) {
    return (180 / Math.PI) * rad;
  };
  var getCoords = function(evt, area) {
    evt = evt || window.event;
    var offset = area.offset();

    var posx = 0, posy = 0;

    if (evt.pageX || evt.pageY) {
      posx = evt.pageX;
      posy = evt.pageY;
    } else if (evt.clientX || evt.clientY) {
      posx = evt.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      posy = evt.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    if (evt.changedTouches) {
      posx = evt.changedTouches[0].pageX;
      posy = evt.changedTouches[0].pageY;
    }

    return {
      x : (parseInt(posx, 10) - offset.left),
      y : (parseInt(posy, 10) - offset.top)
    };
  };
  var getTransform = function(trns) {
    trns = trns.replace(/,/g, ' ');
    var name = trns.match(/^[^\(]*/)[0];
    trns = trns.match(/\([^\)]*\)/)[0];
    trns = trns.replace(/\(|\)/g, '');
    trns = trns.split(' ');
    for (var i = trns.length; i--; ) {
      trns[i] = parseFloat(trns[i], 10);
    }
    trns.name = name;
    return trns;
  };
  /* === #utils stop === */

  var SVGStorage = function(data) {
    var h = "data:image/svg+xml;base64,";
    var self = this, svg, a, b;

    // create all image data resources
    this.info = {
      'svghead': data.match(/<svg[^>]*>/)[0] ,
      'boardhl': new Image(),
      'svghole': ''
    };
    // board with holes
    a = data.search('<!-- breadboard start -->');
    b = data.search('<!-- breadboard end -->');
    svg += data.substring( (a + 25), b);
    a = data.search('<!-- breadboard defs holes start -->');
    b = data.search('<!-- breadboard defs holes end -->');
    svg += data.substring( (a + 36), b);
    svg = this.info.svghead + svg + '</svg>';
    this.info.boardhl.src = h + btoa(svg);
    this.info.svghole = svg;

    // create all jQuery DOM resources
    data = $(data);
    this.defs = {};
    this.view = {'board': data};
    data.find('[primitive]').each(function() {
      var elem = $(this), name = elem.attr('primitive');
      elem.removeAttr('primitive');
      self.view[name] = elem.remove();
    });
    // add info about holes
    this.hole = [];
    data.find('[id="$:hole_highlighted"]').each(function(){
      var c = $(this).children('circle');
      for (var i = 0, l = c.length; i < l; i++) {
        self.hole.push({
          'x': parseInt(c[i].getAttribute('cx'), 10),
          'y': parseInt(c[i].getAttribute('cy'), 10),
          'r': parseInt(c[i].getAttribute('r'), 10),
          'c': c[i].getAttribute('fill')
        });
      }
    });
    // set paper value
    paper = this.view.board;
  };

  SVGStorage.prototype.create = function(name) {
    return this.view[name].clone();
  };

  SVGStorage.prototype.point = function() {
    return this.view.board[0].createSVGPoint();
  };

  /* board object */

  var $ready = false;
  // flag, all critical objects built
  var $stack = [];
  // stack of callback functions

  // hack-ish to get sparks.js directory, and assume that common is at ../common from it
  var scripts = document.getElementsByTagName('script');
  var path = scripts[scripts.length-1].src.split('?')[0];      // remove any ?query
  var packageRoot = path.split('/').slice(0, -2).join('/')+'/';  // remove last folder and filename part of path

  board.util.require([packageRoot+"common/images/sparks.breadboard.svg"], function(data) {
    // create base element
    SVGStorage = new SVGStorage(data["sparks.breadboard"]);
    // pre-cache all needed images
    var stack = SVGStorage.view.board.find('image[pre-cache]'), all = stack.length;
    // console.log('try cache '+all+' images');
    var cache = function(image) {
      var img = new Image();
      img.onload = function() {
        var opt = {
          'id': image.getAttribute('id'),
          'x': image.getAttribute('x'),
          'y': image.getAttribute('y')
        };
        check(img, opt);
      };
      img.src = image.getAttribute('xlink:href');
    };
    for (var i = 0; i < all; i++) {
      cache(stack[i]);
    }
    var check = function(img, opt) {
      var ctx = document.createElement('canvas').getContext('2d');
      ctx.canvas.height = img.height;
      ctx.canvas.width = img.width;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      SVGStorage.defs[opt.id] = ctx.canvas;
      SVGStorage.defs[opt.id].ox = opt.x;
      SVGStorage.defs[opt.id].oy = opt.y;
      if (!--all) {start_activity();}
    };

    // run callbacks, if have been signed
    var start_activity = function() {
      $ready = true;
      for (var i = 0, l = $stack.length; i < l; i++) {
        $stack[i]();
      }
    };

  });

  board.create = function(id) {
    return new CircuitBoard(id);
  };

  board.ready = function(callback) {
    if ($ready) {
      callback();
    } else {
      $stack.push(callback);
    }
  };

  board.clear = function(circuitBoard) {
    for (var c in circuitBoard.component) {
      if (c == "battery") continue;
      circuitBoard.removeComponent(c);
    }
    circuitBoard.removeBattery();
    circuitBoard.removeDMM();
    circuitBoard.removeOScope();
  };

})(jQuery, window.breadboardSVGView);
