const Component = require('./component');

class PowerLead extends Component {
  constructor(props, breadboardController) {
    super(props, breadboardController);
  }

  getColor() {
    let location = this.getLocation();
    if (location.indexOf("positive") > -1) {
      return "redPowerWire";
    } else {
      return "blackPowerWire";
    }
  }

  getLocation() {
    // Flash coding issue means we need to give this a second argument...
    return this.connections[0].getName() + ",a1";
  }

  addCiSoComponent() { }

  getViewArguments = null;
}

module.exports = PowerLead;
