/* global sparks*/

const Oscilloscope = require('../models/oscilloscope'),
  Workbench = require('../models/workbench'),
  Multimeter = require('../circuit/multimeter'),
  logController = require('./log-controller'),
  breadboardController = require('./breadboard-controller');

class WorkbenchController {
  constructor() {
    this.workbench = null;    // for now
    this.breadboardController = breadboardController;
    this.breadboardController.init(this);
    this.logController = logController;
  }

  // Method
  createWorkbench(props, elId) {
    this.workbench = new Workbench(this.breadboardController);

    this.initialProperties = props;
    this.workbench.circuit = props.circuit;

    if (this.workbench.circuit) {
      this.workbench.circuit.referenceFrequency = props.referenceFrequency;
    }

    this.workbench.faults = props.faults;

    // TODO fix this odd piece of code

    this.workbench.show_multimeter = !(!(props.show_multimeter) || props.show_multimeter === "false");     // may be a string
    this.workbench.show_oscilloscope = !(!(props.show_oscilloscope) || props.show_oscilloscope === "false");
    this.workbench.allow_move_yellow_probe = !(!(props.allow_move_yellow_probe) || props.allow_move_yellow_probe === "false");
    this.workbench.hide_pink_probe = !(!(props.hide_pink_probe) || props.hide_pink_probe === "false");
    this.workbench.disable_multimeter_position = props.disable_multimeter_position;

    this.workbench.showComponentDrawer = !(!(props.showComponentDrawer) || props.showComponentDrawer === "false");
    this.workbench.showComponentEditor = !(!(props.showComponentEditor) || props.showComponentEditor === "false");

    this.workbench.interface = props.interface || { hideResistorBands: false, hideDMMResult: false };

    if (this.workbench.show_multimeter) {
      this.workbench.meter.dmm = new Multimeter(breadboardController);
      if (this.workbench.disable_multimeter_position) {
        this.workbench.meter.dmm.set_disable_multimeter_position(this.workbench.disable_multimeter_position);
      }
      this.workbench.meter.dmm.hideDisplayText = !!this.workbench.interface.hideDMMResult;
    } else {
      this.workbench.meter.dmm = null;
    }

    if (this.workbench.show_oscilloscope) {
      this.workbench.meter.oscope = new Oscilloscope(breadboardController);
    } else {
      this.workbench.meter.oscope = null;
    }

    // this shouldn't be here
    logController.startNewSession();

    this.loadBreadboard();

    this.workbench.view.layout(elId);

    return this.workbench;
  }

  loadBreadboard() {
    let workbench = this.workbench;

    breadboardController.clear();

    if (workbench.circuit) {
      breadboardController.createCircuit(workbench.circuit);
    }

    if (workbench.faults) {
      breadboardController.addFaults(workbench.faults);
    }
  }

  setDMMVisibility(visible) {
    let workbench = this.workbench;
    if (visible) {
      workbench.meter.dmm = new Multimeter(breadboardController);
      if (workbench.disable_multimeter_position) {
        workbench.meter.dmm.set_disable_multimeter_position(workbench.disable_multimeter_position);
      }
    } else {
      workbench.meter.dmm = null;
    }
    sparks.activity.view.showDMM(visible);
  }

  setOScopeVisibility(visible) {
    let workbench = this.workbench;
    if (visible) {
      workbench.meter.oscope = new Oscilloscope(breadboardController);
    } else {
      workbench.meter.oscope = null;
    }
    sparks.activity.view.showOScope(visible);
  }

  serialize() {
    let json = this.initialProperties;
    json.circuit = this.breadboardController.serialize();
    return JSON.stringify(json, null, '\t');
  }
}


module.exports = new WorkbenchController();
