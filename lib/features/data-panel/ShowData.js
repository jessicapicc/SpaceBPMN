'use strict';

var domify = require('min-dom/dist'),
    domClasses = require('min-dom/dist'),
    domEvent = require('min-dom/dist');

var is = require('../../util/ElementHelper').is;

var events = require('../../util/EventHelper'),
    GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT,
    TOGGLE_MODE_EVENT = events.TOGGLE_MODE_EVENT,
    PLAY_SIMULATION_EVENT = events.PLAY_SIMULATION_EVENT,
    PAUSE_SIMULATION_EVENT = events.PAUSE_SIMULATION_EVENT,
    RESET_SIMULATION_EVENT = events.RESET_SIMULATION_EVENT,
    ANIMATION_CREATED_EVENT = events.ANIMATION_CREATED_EVENT,
    PROCESS_INSTANCE_CREATED_EVENT = events.PROCESS_INSTANCE_CREATED_EVENT;

var DATA_MARKUP = '<i class="fa fa-database"></i>';

function ShowData(eventBus, tokenSimulationPalette, notifications, canvas) {
  var self = this;

  this._eventBus = eventBus;
  this._tokenSimulationPalette = tokenSimulationPalette;
  this._notifications = notifications;

  this.canvasParent =  canvas.getContainer().parentNode;

  this.isShown = false;
  this.isHidden = false;

  this._init();

}

ShowData.prototype._init = function() {
  this.paletteEntry = domify(
    '<div class="entry" title="Show/Hide Data Panel">' +
      DATA_MARKUP +
    '</div>'
  );

  domEvent.bind(this.paletteEntry, 'click', function() {
    change_visibility('data-perspective');
  });

  this._tokenSimulationPalette.addEntry(this.paletteEntry, 4);
};



ShowData.$inject = [ 'eventBus', 'tokenSimulationPalette', 'notifications', 'canvas' ];

module.exports = ShowData;
