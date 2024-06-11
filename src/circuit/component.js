class Component {
  // used by the component edit view
  componentTypeName = "Component";
  // used by the component edit view
  isEditable = false;
  // The name and base units of the editable property
  editableProperty = { name: "", units: "" };


  constructor(props, breadboardController) {

    for (let i in props) {
      this[i] = props[i];
    }

    this.breadboardController = breadboardController;

    if (!this.label) {
      this.label = !this.UID.split("/")[1] ? this.UID.split("/")[1] : "";
    }

    if (typeof this.connections === "string") {
      this.connections = this.connections.replace(/ /g, '').split(",");
    }

    for (let i in this.connections) {
      this.connections[i] = this.breadboardController.getHole(this.connections[i]);

      if (!this.breadboardController.getHoles[this.connections[i]]) {
        this.breadboardController.getHoles[this.connections[i]].connections[this.breadboardController.getHoles[this.connections[i]].connections.length] = this;
      }
    }
    this._ensureFloat("resistance");
    this._ensureFloat("nominalResistance");
    this._ensureFloat("voltage");
    this._ensureFloat("capacitance");
    this._ensureFloat("inductance");
    this._ensureFloat("impedance");
    this.draggable = !!this.draggable;

    this.viewArguments = {
      type: this.type,
      UID: this.UID,
      connections: this.getLocation(),
      draggable: this.draggable
    };

    if (this.label) {
      this.viewArguments.label = this.label;
    }
  }

  // used by the component edit view. Right now we assume any editable component
  // has only one single editable property. If we change this assumption, we may
  // want to set an array of properties
  //
  // Returns an array of the possible values this property can take
  getEditablePropertyValues() { return [0]; }
  // used by the component edit view. Right now we assume any editable component
  // has only one single editable property. However, even if we have components with
  // multiple editable properties, we can keep this API and pass in an array
  changeEditableValue() { }

  setViewArguments(args) {
    for (let arg in args) {
      if (!Object.hasOwn(args, arg)) continue;
      this.viewArguments[arg] = args[arg];
    }
  }

  getViewArguments() {
    this.viewArguments.connections = this.getLocation(); // update location
    return this.viewArguments;
  }

  move(connections) {
    for (let i in this.connections) {
      for (let j in this.connections[i].connections) {
        if (this.connections[i].connections[j] === this) {
          this.connections[i].connections = [];
        }
      }
      this.connections[i] = [];
    }
    this.connections = [];
    for (let i in connections) {
      this.connections[i] = this.breadboardController.getHoles[connections[i]];
      this.breadboardController.getHoles[connections[i]].connections[this.breadboardController.getHoles[connections[i]].connections.length] = this;
    }

    this.setViewArguments({ connections: this.getLocation() });
  }

  destroy() {
    let i, j;
    for (i in this.connections) {
      for (j in this.connections[i].connections) {
        if (this.connections[i].connections[j] === this) {
          this.connections[i].connections = [];
        }
      }
      this.connections[i] = [];
    }
    this.connections = [];
    this.breadboardController.deleteComponentFromMap(this.UID);
  }
  _ensureFloat(val) {
    if (this[val] && typeof this[val] === "string") {
      this[val] = parseFloat(this[val], 10);
    }
  }
  getNodes() {
    return this.connections.map((connection) => {
      return connection.nodeName();
    });
  }
  // converts connections to string, for flash arguments
  getLocation() {
    return this.connections[0].getName() + "," + this.connections[1].getName();
  }
  canInsertIntoNetlist() {
    return true;
  }

  /**
    hasValidConnections: check that this component has connections that are valid for generating a QUCS netlist.
   
    The only check performed right now is that there be 2 connections, but this validity check could be enhanced
    to check, for example, that the two connections map to different nodes, etc.
  */
  hasValidConnections() {
    return this.connections.length === 2 || (this.type === "powerLead" && this.connections.length === 1);
  }

  getRequestedImpedance(spec, steps) {
    let min, max, factor, step, choosableSteps, i, len;

    if (typeof spec === 'string' || typeof spec === 'number') {
      return spec;
    }

    if (spec[0] !== 'uniform') {
      throw new Error("Only uniformly-distributed random impedances/resistances are supported right now; received " + spec);
    }
    if (spec.length < 3) throw new Error("Random impedance/resistance spec does not specify an upper and lower bound");
    if (typeof spec[1] !== 'number' || typeof spec[2] !== 'number') throw new Error("Random impedance/resistance spec lower and upper bound were not both numeric");

    min = Math.min(spec[1], spec[2]);
    max = Math.max(spec[1], spec[2]);

    // if steps array exists, it specifies allowable values, up to the order of magnitude
    if (steps) {
      // copy 'steps' array before sorting it so we don't modify the passed-in array
      steps = steps.slice().sort();

      factor = Math.pow(10, Math.orderOfMagnitude(min) - Math.orderOfMagnitude(steps[0]));
      choosableSteps = [];
      i = 0;
      len = steps.length;
      do {
        step = steps[i++] * factor;
        if (min <= step && step <= max) choosableSteps.push(step);

        if (i >= len) {
          factor *= 10;
          i = 0;
        }
      } while (step < max);

      if (choosableSteps.length > 0) {
        return choosableSteps[Math.floor(Math.random() * choosableSteps.length)];
      }
    }

    // if no steps were specified, or none were available between the requested min and max
    return min + Math.random() * (max - min);
  }
  addThisToFaults() {
    this.breadboardController.addFaultyComponent(this);
  }
  serialize() {
    let jsonComp = {
      type: this.type,
      UID: this.UID
    };

    if (this.label) jsonComp.label = this.label;
    if (this.connections) jsonComp.connections = this.getLocation();
    if (this.resistance) jsonComp.resistance = this.resistance;
    if (this.nominalResistance) jsonComp.nominalResistance = this.nominalResistance;
    if (this.voltage) jsonComp.voltage = this.voltage;
    if (this.amplitude) jsonComp.amplitude = this.amplitude;
    if (this.frequencies) jsonComp.frequencies = this.frequencies;
    if (this.initialFrequency) jsonComp.initialFrequency = this.initialFrequency;
    if (this.frequency) jsonComp.initialFrequency = this.frequency;
    if (this.capacitance) jsonComp.capacitance = this.capacitance;
    if (this.inductance) jsonComp.inductance = this.inductance;
    if (this.impedance) jsonComp.impedance = this.impedance;
    if (this.draggable) jsonComp.draggable = this.draggable;
    if (this.hidden) jsonComp.hidden = this.hidden;

    return jsonComp;
  }
}

module.exports = Component;

