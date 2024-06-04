/*globals console sparks $ document window alert navigator*/
var LogEvent            = require('../models/log'),
    util                = require('../helpers/util'),
    sound               = require('../helpers/sound'),
    logController       = require('../controllers/log-controller');

breadboardComm = {};

breadboardComm.openConnections = {};

breadboardComm.connectionMade = function(workbenchController, component, hole) {
  var workbench = workbenchController.workbench,
      breadboardController = workbenchController.breadboardController,
      comp, openConnections, openConnectionsArr, connectionReturning, connection;

  if (!!hole){
    openConnections = breadboardComm.openConnections[component];
    if (!openConnections) return; // shouldn't happen

    if (openConnections[hole]) {        // if we're just replacing a lead
      breadboardController.unmapHole(hole);
      delete openConnections[hole];
    } else {                            // if we're putting lead in new hole
      comp = breadboardController.getComponents()[component];
      // transform to array
      openConnectionsArr = util.getKeys(openConnections);
      // pick first open lead
      connectionReturning = openConnectionsArr[0];
      breadboardController.unmapHole(connectionReturning);
      //swap
      for (var i = 0; i < comp.connections.length; i++) {
        connection = comp.connections[i].getName();
        if (connection === connectionReturning) {
          comp.connections[i] = breadboardController.getHole(hole);
          delete openConnections[connection];
          workbench.meter.moveProbe(connection, hole);
          break;
        }
      }

      // check that we don't have two leads to close together
      breadboardController.checkLocation(comp);
    }

  }
  logController.addEvent(LogEvent.CHANGED_CIRCUIT, {
    "type": "connect lead",
    "location": hole
  });
  workbench.meter.update();
};

breadboardComm.connectionBroken = function(workbenchController, component, hole) {
  var workbench = workbenchController.workbench,
      breadboardController = workbenchController.breadboardController;
  if (!breadboardComm.openConnections[component]) {
    breadboardComm.openConnections[component] = {}
  }
  breadboardComm.openConnections[component][hole] = true;

  var newHole = breadboardController.getGhostHole(hole+"ghost");

  breadboardController.mapHole(hole, newHole.nodeName());
  logController.addEvent(LogEvent.CHANGED_CIRCUIT, {
    "type": "disconnect lead",
    "location": hole});
  workbench.meter.update();
};

breadboardComm.probeAdded = function(workbenchController, meter, color, location) {
  workbenchController.workbench.meter.setProbeLocation("probe_"+color, location);
  sound.playSound(sound.click)
  logController.addEvent(LogEvent.ATTACHED_PROBE, {
    "color": color,
    "location": location
  });
};

breadboardComm.probeRemoved = function(workbenchController, meter, color, location) {
  workbenchController.workbench.meter.setProbeLocation("probe_"+color, null);
  logController.addEvent(LogEvent.DETACHED_PROBE, {
    "color": color,
    "location": location
  });
};

breadboardComm.probeDropped = function(workbenchController, meter, color, position) {
  //workbenchController.workbench.meter.setProbeLocation("probe_"+color, null);
  logController.addEvent(LogEvent.DROPPED_PROBE, {
    "color": color,
    "position": position
  });
};

breadboardComm.dmmDialMoved = function(workbenchController, value) {
  workbenchController.workbench.meter.dmm.dialPosition = value;
  workbenchController.workbench.meter.update();
  logController.addEvent(LogEvent.MOVED_DMM_DIAL, {
    "value": value
  });
};

module.exports = breadboardComm;
