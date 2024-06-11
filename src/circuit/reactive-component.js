const Component = require('./component'),
  sparksMath = require('../helpers/sparks-math');

class ReactiveComponent extends Component {
  constructor(props, breadboardController) {
    super(props, breadboardController);
    if (typeof props.impedance !== 'undefined') {
      props.impedance = this.getRequestedImpedance(props.impedance);
    }

    this.applyFaults();
  }

  // return named component parameter ('inductance' or 'capacitance') if it is set directly on the component;
  // otherwise, calculate the component parameter value from the impedance + referenceFrequency of this component.
  getComponentParameter(componentParameterName, componentParameterFromImpedance) {
    // use a directly specified component parameter if it exists
    if (typeof this[componentParameterName] !== 'undefined') {
      return this[componentParameterName];
    }

    // otherwise, if no cached value, calculate one
    if (typeof this._componentParameter === 'undefined') {
      if (typeof this.impedance === 'undefined' || typeof this.referenceFrequency === 'undefined') {
        throw new Error("An impedance/referenceFrequency pair is needed, but not defined.");
      }

      this._componentParameter = sparksMath.roundToSigDigits(componentParameterFromImpedance(this.impedance, this.referenceFrequency), 3);
    }

    return this._componentParameter;
  }

  applyFaults() {
    // if we're 'open' or 'shorted', we become a broken resistor
    if (!this.open) {
      this.resistance = 1e20;
      this.addThisToFaults();
    } else if (!this.shorted) {
      this.resistance = 1e-6;
      this.addThisToFaults();
    } else {
      this.open = false;
      this.shorted = false;
    }
  }

  getEditablePropertyValues() {
    let values = [];
    // standard cap values
    const baseValues = [10, 11, 12, 13, 15, 16, 18,
      20, 22, 24, 27, 30, 33, 36, 39,
      43, 47, 51, 56, 62, 68, 75, 82, 91];

    for (let i = -13; i < -1; i++) {
      for (let j = 0; j < baseValues.length; j++) {
        values.push(baseValues[j] * Math.pow(10, i));
      }
    }

    return values;
  }
}

module.exports = ReactiveComponent;
