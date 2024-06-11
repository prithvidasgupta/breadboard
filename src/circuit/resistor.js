let extend                = require('../helpers/util').extend,
    Component             = require('./component'),
    r_values              = require('./r-values'),
    Resistor4band         = require('./resistor-4band'),
    workbenchController;

Resistor = function (props, breadboardController) {
  workbenchController   = require('../controllers/workbench-controller');

  let tolerance, steps;

  // translate the requested resistance (which may be of the form ["uniform", 10, 100] into a real number
  if (typeof props.resistance !== 'undefined') {
    tolerance = props.tolerance || 0.05;
    steps = (tolerance === 0.05) ? r_values.r_values4band5pct : r_values.r_values4band10pct;
    props.resistance = this.getRequestedImpedance( props.resistance, steps );
  }

  Resistor.parentConstructor.call(this, props, breadboardController);

  // if we have colors defined and not resistance
  if ((this.resistance === undefined) && this.colors){
    this.resistance = this.getResistance( this.colors );
  }

  // if we have neither colors nor resistance
  if ((this.resistance === undefined) && !this.colors) {
    let resistor = new Resistor4band(this.UID, breadboardController);
    resistor.randomize(null);
    this.resistance = resistor.getRealValue();
    this.tolerance = resistor.tolerance;
    this.colors = resistor.colors;
  }

  // if we have resistance and no colors
  if (!this.colors){
    this.colors = this.getColors4Band( this.resistance, (!!this.tolerance ? this.tolerance : 0.05));
  }

  // at this point, we must have both real resiatance and colors
  // calculate nominal resistance, unless nominalResistance is defined
  if (!this.nominalResistance){
    this.nominalResistance =  this.getResistance( this.colors );
  }

  // now that everything has been set, if we have a fault set it now
  this.applyFaults();

  if (this.resistance > 0) {
    this.setViewArguments({color: this.colors});
  } else {
    this.setViewArguments({type: "wire", color: "green"});      // represent as wire if resistance is zero
  }
};

extend(Resistor, Component,
{
  nominalValueMagnitude: -1,

    colorMap: { '-1': 'gold', '-2': 'silver',
        0 : 'black', 1 : 'brown', 2 : 'red', 3 : 'orange',
        4 : 'yellow', 5 : 'green', 6 : 'blue', 7 : 'violet', 8 : 'grey',
        9 : 'white' },

    toleranceColorMap: { 0.01 : 'brown', 0.02 : 'red', 5e-3 : 'green',
        2.5e-3 : 'blue', 1e-3 : 'violet', 5e-4 : 'gray', 5e-2 : 'gold',
        0.1 : 'silver', 0.2 : 'none' },

    toleranceValues: [ 0.01, 0.02 ],

    init: function (id) {
          this.id = id;
          this.nominalValue = 0.0; //resistance value specified by band colors;
          this.realValue = 0.0; //real resistance value in Ohms
          this.tolerance = 0.0; //tolerance value
          this.colors = []; //colors for each resistor band
    },

    getNumBands: function () {
        return this.numBands;
    },

    getNominalValue: function () {
        return this.nominalValue;
    },

    setNominalValue: function (value) {
        this.nominalValue = value;
    },

    getTolerance: function () {
        return this.tolerance;
    },

    setTolerance: function(value) {
        this.tolerance = value;
    },

    getRealValue: function () {
        return this.realValue;
    },

    setRealValue: function (value) {
        this.realValue = value;
    },

    setResistance: function (value) {
      this.resistance = value;
      this.updateColors();
    },

    updateColors: function (resistance, tolerance) {
        this.colors = this.getColors4Band( this.resistance, (!!this.tolerance ? this.tolerance : 0.05));
        this.setViewArguments({color: this.colors});
    },

    show : function() {
    },

    calcRealValue: function (nominalValue, tolerance) {
        let chance = Math.random();
        if (chance > 0.8) {
            let chance2 = Math.random();
            if (chance2 < 0.5) {
                return nominalValue + nominalValue * (tolerance + Math.random() * tolerance);
            }
            else {
                return nominalValue - nominalValue * (tolerance + Math.random() * tolerance);
            }
        }

        // Multiply 0.9 just to be comfortably within tolerance
        let realTolerance = tolerance * 0.9;
        return nominalValue * this.randFloat(1 - realTolerance, 1 + realTolerance);
    },

    randInt: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    randFloat: function (min, max) {
        return this.randPseudoGaussian(3) * (max - min) + min;
    },

    randPseudoGaussian: function (n) {
        let r = 0.0;
        for (let i = 0; i < n; ++i) {
            r += Math.random();
        }
        return r / n;
    },

    // Filter resistance values according to the requirements of this resistor
    filter: function (in_values) {
        let values = [];
        for (let i = 0; i < in_values.length; ++i) {
            if (in_values[i] >= 10.0 && in_values[i] < 2e6) {
                values.push(in_values[i]);
            }
        }
        return values;
    },

    getColors4Band: function (ohms, tolerance) {
        let s = ohms.toString(),
            decIx = s.indexOf('.'),
            decLoc = decIx > -1 ? decIx : s.length,
            len, i;
        s = s.replace('.', '');
        len = s.length;
        for (i = 0; i < 2 - len; ++i){ s += '0'; }
        return [ this.colorMap[s.charAt(0)],
                 this.colorMap[s.charAt(1)],
                 this.colorMap[decLoc - 2],
                 this.toleranceColorMap[tolerance]
               ];
    },

    getColors5Band: function (ohms, tolerance) {
        let s = ohms.toString(),
            decIx = s.indexOf('.'),
            decLoc = decIx > -1 ? decIx : s.length,
            len, i;
        s = s.replace('.', '');
        len = s.length;
        for (i = 0; i < 3 - len; ++i) { s += '0'; }
        return [ this.colorMap[s.charAt(0)],
                 this.colorMap[s.charAt(1)],
                 this.colorMap[s.charAt(2)],
                 this.colorMap[decLoc - 3],
                 this.toleranceColorMap[tolerance]
               ];
    },

    colorToNumber: function (color) {
      for (let n in this.colorMap) {
        if (this.colorMap[n] == color) { return parseInt(n,10); }
      }
      // alternate spelling...
      if (color == "gray") {
        return 8;
      }
      return null;
    },

    getResistance: function(colors){
      if (typeof(colors)==="string"){
        colors = colors.split(",");
      }
      let resistance = this.colorToNumber(colors[0]);
      for (let i = 1; i < colors.length - 2; i++) {
        resistance = resistance * 10;
        resistance += this.colorToNumber(colors[i]);
      }
      return resistance * Math.pow(10, this.colorToNumber(colors[i]));
    },

    addCiSoComponent: function (ciso) {
      let resistance  = this.resistance || 0,
          nodes       = this.getNodes();
      ciso.addComponent(this.UID, "Resistor", resistance, nodes);
    },

    applyFaults: function() {
      if (!!this.open){
        this.resistance = 1e20;
        this.addThisToFaults();
      } else if (!!this.shorted) {
        this.resistance = 1e-6;
        this.addThisToFaults();
      } else {
        this.open = false;
        this.shorted = false;
      }
    },

    componentTypeName: "Resistor",

    isEditable: true,

    editableProperty: {name: "resistance", units: "\u2126"},

    getEditablePropertyValues: function() {
      resValues = [];
      baseValues = r_values.r_values4band10pct;

      for (i = 0; i < 6; i++) {
        for (j = 0; j < baseValues.length; j++) {
          resValues.push(baseValues[j] * Math.pow(10, i));
        }
      }

      return resValues;
    },

    changeEditableValue: function(val) {
      this.setResistance(val);
      workbenchController.breadboardView.changeResistorColors(this.UID, this.getViewArguments().color);
    }
});

module.exports = Resistor;
