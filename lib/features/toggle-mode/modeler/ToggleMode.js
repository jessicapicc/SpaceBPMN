'use strict';
var is = require('../../../util/ElementHelper').is;

var domify = require('min-dom/dist').domify,
    domClasses = require('min-dom/dist').classes,
    domEvent = require('min-dom/dist').event,
    domQuery = require('min-dom/dist').query;

var events = require('../../../util/EventHelper'),
    TOGGLE_MODE_EVENT = events.TOGGLE_MODE_EVENT,
    GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT,
    RESET_SIMULATION_EVENT = events.RESET_SIMULATION_EVENT,
    TERMINATE_EVENT = events.TERMINATE_EVENT,
    CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT;

var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

function ToggleMode(eventBus, canvas, selection, contextPad, processInstances) {
  var self = this;

  this._eventBus = eventBus;
  this._canvas = canvas;
  this._selection = selection;
  this._contextPad = contextPad;
  this._processInstances = processInstances;
  this.simulationModeActive = false;
  this.dataModeActive = false;
  eventBus.on('import.done', function() {
    self.canvasParent =  self._canvas.getContainer().parentNode;
    self.palette = domQuery('.djs-palette', self._canvas.getContainer());
  });
  domEvent.bind(document.getElementById('animation-button'), 'click', this.toggleMode.bind(this));
}

ToggleMode.prototype._init = function() {
 
};



ToggleMode.prototype.toggleMode = function() {
  if (this.simulationModeActive) {
    // this.container.innerHTML = 'Animation Mode <span class="toggle"><i class="fa fa-toggle-off"></i></span>';
    document.getElementById('animation-button').innerHTML = 'Animation Mode <span class="toggle"><i class="fa fa-toggle-off"></i>'

    domClasses(this.canvasParent).remove('simulation');
    domClasses(this.palette).remove('hidden');

    this._eventBus.fire(TOGGLE_MODE_EVENT, {
      simulationModeActive: false
    });

    var elements = this._selection.get();

    if (elements.length === 1) {
      this._contextPad.open(elements[0]);
    }
    document.getElementById("save").style.display = "block";
    document.getElementById("load").style.display = "block";
    document.getElementById("data-panel-button").style.display = "none";
  } else {

    // this.container.innerHTML = '<span class="toggle"><i class="fa fa-toggle-on"></i></span>';
    document.getElementById('animation-button').innerHTML = 'Animation Mode <span class="toggle"><i class="fa fa-toggle-on"></i>'
    document.getElementById("js-properties-panel").style.display = "none";
    document.getElementById("save").style.display = "none";
    document.getElementById("load").style.display = "none";
    document.getElementById("data-panel-button").style.display = "block";
    domClasses(this.canvasParent).add('simulation');
    domClasses(this.palette).add('hidden');

    this._eventBus.fire(TOGGLE_MODE_EVENT, {
      simulationModeActive: true
    });
  }

  this.simulationModeActive = !this.simulationModeActive;
};



ToggleMode.$inject = [ 'eventBus', 'canvas', 'selection', 'contextPad' ];

module.exports = ToggleMode;
