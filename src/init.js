/*globals $*/

require('../bower_components/jquery/jquery');
require('../lib/jquery/jquery-ui-1.8.24.custom.min');
require('../lib/jquery/plugins/jquery.event.drag-2.0.min');
require('../bower_components/jquery-nearest/src/jquery.nearest.min');
require('../bower_components/circuit-solver/dist/circuitSolver');

let workbenchController = require('./controllers/workbench-controller'),
  sound = require('./helpers/sound'),

  scripts = document.getElementsByTagName('script'),
  path = scripts[scripts.length - 1].src.split('?')[0],      // remove any ?query
  packageRoot = path.split('/').slice(0, -2).join('/') + '/',

  soundFiles = { click: packageRoot + "common/sounds/click.ogg" };

function loadSounds() {
  let soundName, audio;

  for (soundName in soundFiles) {
    if (window.Audio) {
      audio = new Audio();
      audio.src = soundFiles[soundName];
      sound[soundName] = audio;
    }
  }
};

$(function () {
  loadSounds();
});



function createWorkbench(props, elId) {
  workbenchController.createWorkbench(props, elId);
}

// this is probably too much access for an API, but doing it now for simplicity
// sparks.workbenchController = workbenchController;
// sparks.logController = workbenchController.logController;

// sparks.packageRoot = packageRoot;


module.exports = {
  createWorkbench,
  workbenchController,
  logController: workbenchController.logController,
  packageRoot
};
