/*globals $*/

const LogEvent = require('../models/log'),
  util = require('../helpers/util');

class Log {
  constructor(startTime) {
    this.events = [];
    this.startTime = startTime;
    this.endTime = -1;
  }
}

class LogController {
  constructor() {
    this.currentLog = null;
    this.listeners = [];
  }

  startNewSession() {
    this.currentLog = new Log(new Date().valueOf());
  }

  endSession() {
    this.currentLog.endTime = new Date().valueOf();
  }

  addEvent(name, value) {
    let evt = new LogEvent(name, value, new Date().valueOf());
    this.currentLog.events.push(evt);
    for (let i in this.listeners) {
      if (typeof this.listeners[i] == "function") {
        this.listeners[i](evt);
      }
    }
  }

  numEvents(log, name) {
    var count = 0;
    $.each(log.events, function (i, evt) {
      if (evt.name == name) {
        count++;
      }
    });
    return count;
  }

  numUniqueMeasurements(log, type) {
    var count = 0;
    var positions = [];
    $.each(log.events, function (i, evt) {
      if (evt.name == LogEvent.DMM_MEASUREMENT) {
        if (evt.value.measurement == type) {
          var position = evt.value.red_probe + "" + evt.value.black_probe;
          if (util.contains(positions, position) === -1) {
            count++;
            positions.push(position);
          }
        }
      }
    });
    return count;
  }

  numConnectionChanges(log, type) {
    let count = 0;
    $.each(log.events, function (i, evt) {
      if (evt.name == LogEvent.CHANGED_CIRCUIT && evt.value.type == type) {
        count++;
      }
    });
    return count;
  }

  addListener(func) {
    this.listeners.push(func);
  }
}

let logController = new LogController();

module.exports = logController;
