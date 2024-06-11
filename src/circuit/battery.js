const Component = require('./component');

class Battery extends Component {
  constructor(props, breadboardController) {
    let range;
    super(props, breadboardController);
    // if voltages are specified as an array, then if it has only value, set the
    // voltage to that value, otherwise set it to a random voltage between the first
    // and second values
    if (this.voltage && this.voltage.length) {
      if (this.voltage.length === 1) {
        this.voltage = this.voltage[0];
      } else {
        range = this.voltage[1] - this.voltage[0];
        this.voltage = this.voltage[0] + (Math.random() * range);
      }
    }
  }
  addCiSoComponent(ciso) {
    let voltage = this.voltage || 0,
      nodes = this.getNodes();

    ciso.addVoltageSource(this.UID, voltage, nodes[0], nodes[1]);
  }
}

module.exports = Battery;
