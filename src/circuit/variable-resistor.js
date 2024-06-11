let extend    = require('../helpers/util').extend,
    Resistor  = require('./resistor');

VariableResistor = function (props, breadboardController) {
  Resistor.parentConstructor.call(this, props, breadboardController);
  let superclass = VariableResistor.uber;
  superclass.init.apply(this, [props.UID]);
  this.resistance = this.minimumResistance;
};

extend(VariableResistor, Resistor, {

  getMinResistance: function() {
    return this.minimumResistance;
  },

  getMaxResistance: function() {
    return this.maximumResistance;
  },

  scaleResistance: function(value) {
    let perc = value / 10,       // values are 0-10
        range = this.maximumResistance - this.minimumResistance,
        newValue = this.minimumResistance + (range * perc);
    this.resistance = newValue;
  }

});

module.exports = VariableResistor;
