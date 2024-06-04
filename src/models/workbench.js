const Meter = require('./meter'),
  WorkbenchView = require('../views/workbench-view');

class Workbench {
  constructor(breadboardController) {
    this.circuit = null;
    this.meter = new Meter();

    this.show_multimeter = false;
    this.show_oscilloscope = false;
    this.allow_move_yellow_probe = false;
    this.hide_pink_probe = false;
    this.showComponentDrawer = false;

    this.view = new WorkbenchView(this, breadboardController);
  }
  toJSON() {
    var json = {};
    return json;
  }
}

module.exports = Workbench;
