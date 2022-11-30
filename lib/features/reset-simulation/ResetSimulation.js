'use strict';

var domify = require('min-dom/dist').domify,
    domClasses = require('min-dom/dist').classes,
    domEvent = require('min-dom/dist').event,
    domQuery = require('min-dom/dist').query;

var is = require('../../util/ElementHelper').is;

var events = require('../../util/EventHelper'),
    TOGGLE_MODE_EVENT = events.TOGGLE_MODE_EVENT,
    GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT,
    RESET_SIMULATION_EVENT = events.RESET_SIMULATION_EVENT;
var tokens = require('../token-simulation-behavior/TokenSimulationBehavior');

function ResetSimulation(eventBus, tokenSimulationPalette, notifications, elementRegistry) {
  var self = this;

  this._eventBus = eventBus;
  this._tokenSimulationPalette = tokenSimulationPalette;
  this._notifications = notifications;
  this._elementRegistry = elementRegistry;

  this._init();

  eventBus.on(GENERATE_TOKEN_EVENT, function(context) {
    if (!is(context.element, 'bpmn:StartEvent')) {
      return;
    }

    domClasses(self.paletteEntry).remove('disabled');
  });

  eventBus.on(TOGGLE_MODE_EVENT, function(context) {
    var simulationModeActive = context.simulationModeActive;

    if (!simulationModeActive) {
      self.resetSimulation();
    }
  });

}

ResetSimulation.prototype._init = function() {
  var self = this;

  this.paletteEntry = domify('<div title="Reset Animation"><i class="fa fa-refresh"></i> Reset</div>');

  domEvent.bind(this.paletteEntry, 'click', function() {
    self.resetSimulation();

    self._notifications.showNotification('Reset Simulation', 'info');
  });

  this._tokenSimulationPalette.addEntry(this.paletteEntry, 2);
};

ResetSimulation.prototype.resetSimulation = function() {
  domClasses(this.paletteEntry).add('disabled');

  window.tokenDistribution = new Map();
  window.messageTokenDistribution = new Map();
  window.eventBasedRaceCond = new Map();
  window.correlation = new Map();

  this._elementRegistry.forEach(function(element) {
    if (element.tokenCount !== undefined) {
      delete element.tokenCount;
    }
  });

  this._eventBus.fire(RESET_SIMULATION_EVENT);
};

ResetSimulation.$inject = [ 'eventBus', 'tokenSimulationPalette', 'notifications', 'elementRegistry' ];

module.exports = ResetSimulation;
