let extend    = require('../helpers/util').extend,
    Resistor  = require('./resistor'),
    r_values  = require('./r-values');

Resistor5band = function (id) {
  let superclass = Resistor5band.uber;
  superclass.init.apply(this, [id]);
  this.numBands = 5;

  this.r_values1pct = this.filter(r_values.r_values5band1pct);
  this.r_values2pct = this.filter(r_values.r_values5band2pct);
};

extend(Resistor5band, Resistor, {

  randomize : function() {
    let ix = this.randInt(0, 1);
    let values;

    this.tolerance = this.toleranceValues[ix];
    if (this.tolerance == 0.01) {
        values = this.r_values1pct;
    }
    else {
        values = this.r_values2pct;
    }
    this.nominalValue = values[this.randInt(0, values.length-1)];
    this.realValue = this.calcRealValue(this.nominalValue, this.tolerance);
    this.colors = this.getColors(this.nominalValue, this.tolerance);
    //console.log('r=' + this.nominalValue + ' t=' + this.tolerance);

    this.colors = this.getColors(this.nominalValue, this.tolerance);
  },

  getColors: function(ohms, tolerance) {
      let s = ohms.toString();
      let decIx = s.indexOf('.'); // real location of the dot in the string
      // virtual location of dot
      // e.g., for "324", decLoc is 3, and for "102000", 6
      let decLoc = decIx > -1 ? decIx : s.length;

      s = s.replace('.', '');
      let len = s.length;

      // Make sure there are at least three significant digits
      for (let i = 0; i < 3 - len; ++i) {
          s += '0';
      }

      return [ this.colorMap[s.charAt(0)],
               this.colorMap[s.charAt(1)],
               this.colorMap[s.charAt(2)],
               this.colorMap[decLoc - 3],
               this.toleranceColorMap[tolerance]
             ];
  }
});

module.exports = Resistor5band;
