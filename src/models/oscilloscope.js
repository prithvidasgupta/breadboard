let LogEvent = require('./log'),
  logController = require('../controllers/log-controller');

class Oscilloscope {
  N_CHANNELS = 2;
  PROBE_CHANNEL = [1, 2];

  HORIZONTAL_SCALES = [1e-3, 5e-4, 2.5e-4, 1e-4, 5e-5, 2.5e-5, 1e-5, 5e-6, 2.5e-6, 1e-6];  // sec/div
  VERTICAL_SCALES = [100, 50, 25, 10, 5, 2.5, 1, 0.5, 0.25, 0.1];  // V/div

  INITIAL_HORIZONTAL_SCALE = 1e-5;
  INITIAL_VERTICAL_SCALE = 5;

  constructor(breadboardController) {
    this.breadboardController = breadboardController;
    this.probeLocation = [];
    this.probeLocation[0] = null;     // pink probe
    this.probeLocation[1] = null;     // yellow probe
    this.view = null;
    this.signals = [];
    let initVerticalScale = this.INITIAL_VERTICAL_SCALE,
      initHorizontalScale = this.INITIAL_HORIZONTAL_SCALE;
    this._verticalScale = [initVerticalScale, initVerticalScale, initVerticalScale];
    this._horizontalScale = initHorizontalScale;
    this.showAminusB = false;
    this.showAplusB = false;
    this.AminusBwasOn = false;  // whether A-B was turned on during current question
    this.AplusBwasOn = false;
  }

  reset() {
    this.probeLocation[0] = "left_positive21";      // yellow probe
    this.probeLocation[1] = null;                   // pink probe
    this.signals = [];
    let initVerticalScale = this.INITIAL_VERTICAL_SCALE,
      initHorizontalScale = this.INITIAL_HORIZONTAL_SCALE;
    this._verticalScale = [initVerticalScale, initVerticalScale, initVerticalScale];
    this._horizontalScale = initHorizontalScale;
    this.showAminusB = false;
    this.showAplusB = false;
    this.AminusBwasOn = false;  // whether A-B was turned on during current question
    this.AplusBwasOn = false;
  }

  setView(view) {
    this.view = view;
    this.view.setModel(this);
    this.update();         // we can update view immediately with the source trace
  }

  // @probe Name of probe being attached. We ignore everything but "red"
  // @location Hole name, like 'a1' or can be null if probe is lifted
  setProbeLocation(probe, location) {
    if (probe === "probe_yellow" || probe === "probe_pink") {
      let probeIndex = probe === "probe_yellow" ? 0 : 1;
      if (this.probeLocation[probeIndex] !== location) {
        this.probeLocation[probeIndex] = location;
        this.update();
      }
    }
  }

  moveProbe(oldLoc, newLoc) {
    for (let i = 0; i < 2; i++) {
      if (this.probeLocation[i] === oldLoc) {
        this.probeLocation[i] = newLoc;
      }
    }
    this.update();
  }

  update() {
    let source = this.breadboardController.getComponents().source,
      probeIndex,
      sourceSignal,
      probeNode;

    if (!source || !source.frequency || !source.amplitude) {
      return;                                     // we must have a source with a freq and an amplitude
    }

    for (probeIndex = 0; probeIndex < 2; probeIndex++) {
      if (this.probeLocation[probeIndex]) {
        probeNode = this.breadboardController.getHole(this.probeLocation[probeIndex]).nodeName();
        if (probeNode === 'gnd') {
          // short-circuit this operation and just return a flat trace
          this.setSignal(this.PROBE_CHANNEL[probeIndex], { amplitude: 0, frequency: 0, phase: 0 });
          continue;
        } else if (~probeNode.indexOf('powerPos')) {
          // just return the source
          sourceSignal = {
            amplitude: source.amplitude * source.amplitudeScaleFactor,
            frequency: source.frequency,
            phase: 0
          };
          this.setSignal(this.PROBE_CHANNEL[probeIndex], sourceSignal);
          continue;
        }
        this.breadboardController.query("oscope", probeNode, this.updateWithData, this, [probeNode, probeIndex]);
      } else {
        this.clearSignal(this.PROBE_CHANNEL[probeIndex]);
      }
    }
  }

  updateWithData(ciso, probeInfo) {
    let source = this.breadboardController.getComponents().source,
      probeNode = probeInfo[0],
      probeIndex = probeInfo[1],
      result,
      probeSignal;

    result = ciso.getVoltageAt(probeInfo[0]);

    if (result) {
      probeSignal = {
        amplitude: result.magnitude * source.amplitudeScaleFactor,
        frequency: source.frequency,
        phase: result.angle
      };

      this.setSignal(this.PROBE_CHANNEL[probeIndex], probeSignal);

      logController.addEvent(LogEvent.OSCOPE_MEASUREMENT, {
        "probe": probeNode
      });
    } else {
      this.clearSignal(this.PROBE_CHANNEL[probeIndex]);
    }
  }

  setSignal(channel, signal) {
    if (!this.view) return;
    this.signals[channel] = signal;
    this.view.renderSignal(channel);
  }

  getSignal(channel) {
    return this.signals[channel];
  }

  clearSignal(channel) {
    delete this.signals[channel];
    if (this.view) {
      this.view.removeTrace(channel);
    }
  }

  setHorizontalScale(scale) {
    this._horizontalScale = scale;
    if (this.view) {
      this.view.horizontalScaleChanged();
    }

    logController.addEvent(LogEvent.OSCOPE_T_SCALE_CHANGED, {
      "scale": scale,
      "goodnessOfScale": this.getGoodnessOfScale()
    });
  }

  getHorizontalScale() {
    if (!this._horizontalScale) {
      // if you want to randomize the scales, hook something in here
      this.setHorizontalScale(this.INITIAL_HORIZONTAL_SCALE);
    }
    return this._horizontalScale;
  }

  setVerticalScale(channel, scale) {
    if (this.showAminusB || this.showAplusB) {
      if (channel === 1) {
        this._verticalScale[2] = scale;
      } else {
        return;
      }
    }

    this._verticalScale[channel] = scale;
    if (this.view) {
      this.view.verticalScaleChanged(1);
      this.view.verticalScaleChanged(2);
    }

    let logEvent = channel == 1 ? LogEvent.OSCOPE_V1_SCALE_CHANGED : LogEvent.OSCOPE_V2_SCALE_CHANGED;
    logController.addEvent(logEvent, {
      "scale": scale,
      "goodnessOfScale": this.getGoodnessOfScale()
    });
  }

  getVerticalScale(channel) {
    if (!this._verticalScale[channel]) {
      // if you want to randomize the scales, hook something in here
      this.setVerticalScale(channel, this.INITIAL_VERTICAL_SCALE);
    }
    return this._verticalScale[channel];
  }

  bumpHorizontalScale(direction) {
    let currentScale = this.getHorizontalScale(),
      newScale = this._getNextScaleFromList(currentScale, this.HORIZONTAL_SCALES, direction);

    if (newScale !== currentScale) {
      this.setHorizontalScale(newScale);
    }
  }

  bumpVerticalScale(channel, direction) {
    let currentScale = this.getVerticalScale(channel),
      newScale = this._getNextScaleFromList(currentScale, this.VERTICAL_SCALES, direction);

    if (newScale !== currentScale) {
      this.setVerticalScale(channel, newScale);
    }
  }

  toggleShowAminusB() {
    this.showAminusB = !this.showAminusB;
    if (this.showAminusB) {
      this.AminusBwasOn = true;
      this.showAplusB = false;
      this.setVerticalScale(1, this._verticalScale[1]);
    }
  }

  toggleShowAplusB() {
    this.showAplusB = !this.showAplusB;
    if (this.showAplusB) {
      this.AplusBwasOn = true;
      this.showAminusB = false;
      this.setVerticalScale(1, this._verticalScale[1]);
    }
  }

  /**
    if A-B or A+B is off right now, set AminusBwasOn and/or
    AplusBwasOn to false now.
  */
  resetABforQuestion() {
    if (!this.showAminusB) {
      this.AminusBwasOn = false;
    }
    if (!this.showAplusB) {
      this.AplusBwasOn = false;
    }
  }

  _getNextScaleFromList(scale, scales, direction) {
    let i, len, prevIndex;

    for (i = 0, len = scales.length; i < len; i++) {
      if (scales[i] < scale) {
        break;
      }
    }
    prevIndex = (i > 0) ? i - 1 : 0;

    if (direction === 1 && prevIndex - 1 >= 0) {
      return scales[prevIndex - 1];
    } else if (direction === -1 && prevIndex + 1 < scales.length) {
      return scales[prevIndex + 1];
    } else {
      return scale;
    }
  }

  // returns how "good" the current scale is, from 0-1.
  // For a single trace, a perfect scale is 1 full wave across the screen and an amplitude
  // that is exactly the screen's height. This will return a 1.0 if the scale is within 20%
  // of these parameters, and 0.0 if it's 200% away from the perfect scale (i.e. if it's 3 times
  // as big or 1/3 as big).
  // There are two scale factors per trace. The goodness ranking for the entire trace is the average
  // of the two with the lower value weighted three times as much.
  // If there are two traces showing, this will return the lower of the two values.
  //
  getGoodnessOfScale() {
    let self = this,

      goodnessOfScale = function (channel) {
        let timeScale = self.signals[channel].frequency * (self._horizontalScale * 10),            // 0-inf, best is 1
          ampScale = (self.signals[channel].amplitude * 2) / (self._verticalScale[channel] * 8),
          timeGoodness = timeScale > 1 ? 1 / timeScale : timeScale,                                // 0-1, best is 1
          ampGoodness = ampScale > 1 ? 1 / ampScale : ampScale,
          timeScore = (timeGoodness - 0.3) / 0.5,                                                // scaled such that 0.3 = 0 and 0.8 = 1
          ampScore = (ampGoodness - 0.3) / 0.5,
          minScore = Math.max(0, Math.min(timeScore, ampScore, 1)),                                // smallest of the two, no less than 0
          maxScore = Math.min(1, Math.max(timeScore, ampScore, 0));                                // largest of the two, no greater than 1
        return ((minScore * 3) + maxScore) / 4;
      },

      goodnesses = [null, null];

    if (this.signals[1]) {
      goodnesses[0] = goodnessOfScale([1]);
    }

    if (this.signals[2]) {
      goodnesses[1] = goodnessOfScale([2]);
    }
    return goodnesses;
  }
}

module.exports = Oscilloscope;
