/* FILE inductor.js */
//= require "reactive-component"
/*globals console sparks */

(function () {

  sparks.circuit.Inductor = function (props, breadBoard) {
    sparks.circuit.Inductor.parentConstructor.call(this, props, breadBoard);
  };

  sparks.extend(sparks.circuit.Inductor, sparks.circuit.ReactiveComponent, {

    getInductance: function () {
      return this.getComponentParameter('inductance', this.inductanceFromImpedance);
    },

    inductanceFromImpedance: function (impedance, frequency) {
      return impedance / (2 * Math.PI * frequency);
    },

    addCiSoComponent: function (ciso) {
      var inductance = this.getInductance() || 0,
          nodes       = this.getNodes();
      ciso.addComponent(this.UID, "Inductor", inductance, nodes);
    }
  });

})();