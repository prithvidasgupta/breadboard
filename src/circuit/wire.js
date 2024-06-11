const Component = require('./component');

class Wire extends Component {
  constructor(props, breadboardController) {
    super(props, breadboardController);
    this.setViewArguments({ color: this.getColor() });
  }
  getColor() {
    let location = this.getLocation();
    if (this.color) {
      return this.color;
    } else if (location.indexOf("positive") > -1) {
      return "red";
    } else if (location.indexOf("negative") > -1) {
      return "black";
    } else {
      return "green";
    }
  }
  addCiSoComponent(ciso) {
    let resistance = 1e-6,
      nodes = this.getNodes();
    ciso.addComponent(this.UID, "Resistor", resistance, nodes);
  }
}

module.exports = Wire;
