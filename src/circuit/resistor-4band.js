let extend    = require('../helpers/util').extend,
    Resistor  = require('./resistor'),
    r_values  = require('./r-values');

Resistor4band = function (id, breadboardController) {
  let superclass = Resistor4band.uber;
  superclass.init.apply(this, [id]);
  this.numBands = 4;
  this.breadboardController = breadboardController;

  if (breadboardController.getResOrderOfMagnitude() < 0){
    let om = this.randInt(0, 3);
    breadboardController.setResOrderOfMagnitude(om);
  }

  this.r_values5pct = this.filter(r_values.r_values4band5pct);
  this.r_values10pct = this.filter(r_values.r_values4band10pct);
};

extend(Resistor4band, Resistor, {

  toleranceValues: [0.05, 0.1],

  randomize: function (options) {

      let value = 0;
      do {
        let ix = this.randInt(0, 1);
        let values;

        this.tolerance = this.toleranceValues[ix];

        if (options && options.rvalues) {
            values = options.rvalues;
        }
        else if (this.tolerance == 0.05) {
            values = this.r_values5pct;
        }
        else {
            values = this.r_values10pct;
        }

        let om = this.breadboardController.getResOrderOfMagnitude();
        let extra = this.randInt(0, 1);
        om = om + extra;

        value = values[this.randInt(0, values.length-1)];

        value = value * Math.pow(10,om);
      } while (!this._resistanceIsUnique(value));

      this.nominalValue = value;

      if (options && options.realEqualsNominal) {
          this.realValue = this.nominalValue;
      }
      else {
          this.realValue = this.calcRealValue(this.nominalValue, this.tolerance);
      }

      this.colors = this.getColors(this.nominalValue, this.tolerance);
  },

  _resistanceIsUnique: function (value) {
    let components = this.breadboardController.getComponents();

    for (let i in components){
      let resistor  = components[i];
      let resistance = resistor.nominalResistance;
      if (resistance == value){
        return false;
      }
    }
    return true;
  },

  // rvalue: resistance value
  getColors: function (ohms, tolerance) {
      let s = ohms.toString();
      let decIx = s.indexOf('.'); // real location of the dot in the string
      // virtual location of dot
      // e.g., for "324", decLoc is 3, and for "102000", 6
      let decLoc = decIx > -1 ? decIx : s.length;

      s = s.replace('.', '');
      let len = s.length;

      // Make sure there are at least three significant digits
      for (let i = 0; i < 2 - len; ++i) {
          s += '0';
      }

      let mult = decLoc > 1 ? decLoc - 2 : 10;

      return [ this.colorMap[s.charAt(0)],
               this.colorMap[s.charAt(1)],
               this.colorMap[decLoc - 2],
               this.toleranceColorMap[tolerance]
             ];
  }

});

module.exports = Resistor4band;
