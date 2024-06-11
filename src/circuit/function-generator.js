const Component = require('./component'),
  LogEvent = require('../models/log'),
  logController = require('../controllers/log-controller');

class FunctionGenerator extends Component {
  defaultFrequencySteps = 100;
  getViewArguments = null;

  constructor(props, breadboardController, workbenchController) {
    super(props, breadboardController);

    this.workbenchController = workbenchController;

    this.amplitudeScaleFactor = 1;

    // NOTE on validation of initialFrequency.
    //
    // If the initial frequency is not in the frequencies we request QUCS to simulate, we only find out after we call
    // QUCS and get the simulation result back. It sounds like we're thereby missing an opportunity to validate
    // initialFrequency "up front" at object-creation time, but, really, we're not. From the perspective of an author
    // who creates a JSON circuit spec with such an invalid initialFrequency, the validation failure only occurs when
    // the student (or author) actually runs the activity, whether the validation is done when the FunctionGenerator
    // is created, or whether it is done when QUCS returns. Doing validation at object creation time (below) would
    // require pre-calculating the frequency list which QUCS generates from a sweep spec.
    this.frequency = props.initialFrequency;

    // get an initial frequency from the frequency-range specification, if one exists
    if (('undefined' === typeof this.frequency || this.frequency === null) && props.frequencies) {
      if ('number' === typeof props.frequencies[0]) {
        this.frequency = props.frequencies[0];
      }
      else if (props.frequencies[0] === 'linear' || props.frequencies[0] === 'logarithmic') {
        this.frequency = props.frequencies[1];
      }
    }

    // store (and generate, if nec.) the set of possible frequencies, so that the view can slide through these
    if (props.frequencies) {
      if ('number' === typeof props.frequencies[0]) {
        this.possibleFrequencies = props.frequencies;
      }
      else if (props.frequencies[0] === 'linear' || props.frequencies[0] === 'logarithmic') {
        this.possibleFrequencies = this._calcPossibleFrequencies(props);
      }
    }

    // set a base frequency, so that we don't have to change NetList representation after changing frequency
    this.baseFrequency = this.frequency;

    if ('undefined' === typeof this.frequency || this.frequency === null) {
      throw new Error("FunctionGenerator: initialFrequency is undefined and an initial frequency could not be inferred from frequency range specification.");
    }

    let amplitude = props.amplitude;
    if ('number' === typeof amplitude) {
      this.amplitude = amplitude;
    } else if (amplitude.length && amplitude.length >= 2) {
      this.minAmplitude = amplitude[0];
      this.maxAmplitude = amplitude[1];
      if (amplitude[2]) {
        this.amplitude = amplitude[2];
      } else {
        this.amplitude = (this.minAmplitude + this.maxAmplitude) / 2;
      }
    }
  }

  // for now, no validation on frequency. So we might set something QUCS isn't expecting from the given sim type
  setFrequency(frequency) {
    this.frequency = frequency;
    if (this.workbenchController.workbench.meter) {
      this.workbenchController.workbench.meter.update();
    }
    logController.addEvent(LogEvent.CHANGED_CIRCUIT, {
      "type": "changed frequency",
      "value": frequency
    });
  }

  // instead of modifying the base amplitude, which would cause us to re-ask QUCS for new values,
  // we simply modify a scale factor, which is read by all meters. This works so long as we have
  // linear circuits -- we'll need to revisit this for nonlinear circuits.
  setAmplitude(newAmplitude) {
    this.amplitudeScaleFactor = newAmplitude / this.amplitude;
    if (this.workbenchController.workbench.meter) {
      this.workbenchController.workbench.meter.update();
    }
    logController.addEvent(LogEvent.CHANGED_CIRCUIT, {
      "type": "changed amplitude",
      "value": newAmplitude
    });
  }

  getFrequency() {
    return this.frequency;
  }

  getAmplitude() {
    return this.amplitude * this.amplitudeScaleFactor;
  }

  getPossibleFrequencies() {
    return this.possibleFrequencies;
  }

  addCiSoComponent(ciso) {
    let amplitude = this.amplitude || 0,
      nodes = this.getNodes();

    ciso.addVoltageSource(this.UID, amplitude, nodes[0], nodes[1], this.frequency);
  }


  _calcPossibleFrequencies(props) {
    let startF = props.frequencies[1],
      endF = props.frequencies[2],
      steps = props.frequencies[3],
      type = props.frequencies[0],
      diff = endF - startF,
      multiple = endF / startF,
      stepSize,
      i;

    let frequencies = [];
    if (type === 'linear') {
      stepSize = diff / (steps - 1);
      for (i = 0; i < steps; i++) {
        frequencies.push(startF + (stepSize * i));
      }
    } else if (type === 'logarithmic') {
      for (i = 0; i < steps; i++) {
        frequencies.push(startF * (Math.pow(multiple, ((i / (steps - 1))))));
      }
    }
    return frequencies;
  }

}

module.exports = FunctionGenerator;
