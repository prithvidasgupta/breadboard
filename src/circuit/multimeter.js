require('../../lib/apMessageBox');

let LogEvent        = require('../models/log'),
    util            = require('../helpers/util'),
    logController   = require('../controllers/log-controller'),
    extend          = require('../helpers/util').extend,
    MultimeterBase  = require('./multimeter-base');

/*
 * Digital Multimeter for breadboard activities
 *
 */
Multimeter = function (breadboardController) {
  Multimeter.uber.init.apply(this);
  this.breadboardController = breadboardController;
  this.reset();
};

extend(Multimeter, MultimeterBase, {

  reset: function() {
    this.dialPosition = 'dcv_20';
    this.powerOn = true;
    this.redProbeConnection = null;
    this.blackProbeConnection = null;
    this.displayText = "";
    this.update();
  },

  currentMeasurement: null,

  update: function () {
    if (this.redProbeConnection && this.blackProbeConnection) {
      if (this.dialPosition.indexOf('dcv_') > -1){
        this.currentMeasurement = "voltage";
      } else if (this.dialPosition.indexOf('dca_') > -1){
        this.currentMeasurement = "current";
      } else if (this.dialPosition.indexOf('r_') > -1){
        this.currentMeasurement = "resistance";
      } else if (this.dialPosition.indexOf('acv_') > -1){
        this.currentMeasurement = "ac_voltage";
      } else {
        this.currentMeasurement = null;
      }

      if (!!this.currentMeasurement){
        this.breadboardController.query(this.currentMeasurement, this.redProbeConnection + ',' + this.blackProbeConnection, this.updateWithData, this);
      }
    } else {
      this.updateWithData();
    }
  },

  // this is called after update() is called and ciso returns
  updateWithData: function (ciso) {
    let measurement = this.currentMeasurement,
        source, b, p1, p2, v1, v2, current,
        result;

    if (ciso) {
      source = ciso.voltageSources[0],
      b  = this.breadboardController;
      p1 = b.getHole(this.redProbeConnection).nodeName();
      p2 = b.getHole(this.blackProbeConnection).nodeName();
      if (measurement === "resistance") {
        if (p1 === p2) {
          result = 0;
        } else {
          current = ciso.getCurrent('ohmmeterBattery');
          result = 1/current.magnitude;
        }
      } else if (measurement === "voltage" || measurement === "ac_voltage" || measurement === "current") {
          v1 = ciso.getVoltageAt(p1);   // complex
          v2 = ciso.getVoltageAt(p2);

        // exit quickly if ciso was not able to solve circuit
        if (!v1 || !v2) {
          this.value = 0;
          this.absoluteValue = 0;
          this.updateDisplay();
          return;
        }

        switch (measurement) {
          case "voltage":
            result = v1.real - v2.real;
            break;
          case "ac_voltage":
            result = v1.subtract(v2).magnitude;
            break;
          case "current":
            result = v1.subtract(v2).magnitude / 1e-6
            break;
        }
      }

      if (result){
        // if in wrong voltage mode for AC/DC voltage, show zero
        source = this.breadboardController.getComponents().source;
        if (!!source &&
           ((measurement === 'voltage' && source.frequency) ||
            (measurement === 'ac_voltage' && source.frequency === 0))) {
          result = 0;
        } else if (measurement === "ac_voltage" ||
                    (measurement === 'current' && source && source.frequency)){
          // the following applies to both RMS voltage and RMS current
          // first, if we are dealing with a function generator, scale by the appropriate scale factor
          if (!!source.amplitudeScaleFactor || source.amplitudeScaleFactor === 0){
            result = result * source.amplitudeScaleFactor;
          }
          result = result / Math.sqrt(2);         // RMS voltage or RMS current
        }
        result = Math.round(result*Math.pow(10,8))/Math.pow(10,8);

        // track both the value and the absolute value.  the absolute value lets us
        // make simpler one-sided comparisons to zero and the value lets us display
        // the negative sign
        this.value = result;
        this.absoluteValue = Math.abs(result);

        if (measurement === "current" && this.absoluteValue > 0.44){
          this.blowFuse();
        }
      } else {
        this.absoluteValue = 0;
      }
    } else {
      this.absoluteValue = 0;
    }

    this.updateDisplay();

    if (this.redProbeConnection && this.blackProbeConnection) {
      logController.addEvent(LogEvent.DMM_MEASUREMENT, {
        "measurement": measurement,
        "dial_position": this.dialPosition,
        "red_probe": this.redProbeConnection,
        "black_probe": this.blackProbeConnection,
        "result": this.displayText
      });
    }
  },

  blowFuse: function() {
    apMessageBox.error({
      title: "POW!",
      message: "<b>You just blew the fuse in your multimeter!</b><br><br> Remember not to pass too much current through it."+
      " We've replaced your fuse for you, but you lost some time.",
      errorImage: "data:image/png;base64,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",
      width: 400,
      height: 300
    });
    logController.addEvent(LogEvent.BLEW_FUSE);
  },

  allConnected: function () {
      return this.redProbeConnection !== null &&
          this.blackProbeConnection !== null &&
          this.powerOn;
  },

  _getResultsIndex: function (results) {
    let i = 0,
        source = this.breadboardController.getComponents().source;
    if (source && source.setFrequency && results.acfrequency){
      i = util.getClosestIndex(results.acfrequency, source.frequency, true);
    }
    return i;
  }
});

module.exports = Multimeter;
