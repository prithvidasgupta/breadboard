const ReactiveComponent = require('./reactive-component');

class Capacitor extends ReactiveComponent {

  componentTypeName = "Capacitor";

  isEditable = true;

  editableProperty = { name: "capacitance", units: "F" };
  constructor(props, breadboardController) {
    super(props, breadboardController);
  }

  getCapacitance() {
    return this.getComponentParameter('capacitance', this.capacitanceFromImpedance);
  }

  capacitanceFromImpedance(impedance, frequency) {
    return 1 / (impedance * 2 * Math.PI * frequency);
  }

  addCiSoComponent(ciso) {
    let capacitance = this.getCapacitance() || 0,
      nodes = this.getNodes();
    ciso.addComponent(this.UID, "Capacitor", capacitance, nodes);
  }

  changeEditableValue(val) {
    this.capacitance = val;
  }
}



module.exports = Capacitor;
