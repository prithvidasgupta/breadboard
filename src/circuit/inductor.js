const ReactiveComponent = require('./reactive-component');

class Inductor extends ReactiveComponent {
  componentTypeName = "Inductor";

  isEditable = true;

  editableProperty = { name: "inductance", units: "H" };

  constructor(props, breadboardController) {
    super(props, breadboardController)
  }
  getInductance() {
    return this.getComponentParameter('inductance', this.inductanceFromImpedance);
  }

  inductanceFromImpedance(impedance, frequency) {
    return impedance / (2 * Math.PI * frequency);
  }

  addCiSoComponent(ciso) {
    let inductance = this.getInductance() || 0,
      nodes = this.getNodes();
    ciso.addComponent(this.UID, "Inductor", inductance, nodes);
  }

  changeEditableValue(val) {
    this.inductance = val;
  }
}


module.exports = Inductor;
