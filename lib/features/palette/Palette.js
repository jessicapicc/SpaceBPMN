'use strict';

var domify = require('min-dom/dist').domify,
    domClasses = require('min-dom/dist').classes,
    domEvent = require('min-dom/dist').event,
    domQuery = require('min-dom/dist').query;

var events = require('../../util/EventHelper'),
    TOGGLE_MODE_EVENT = events.TOGGLE_MODE_EVENT;

function Palette(eventBus, canvas) {
  var self = this;

  this._canvas = canvas;

  this.entries = [];

  this._init();

  eventBus.on(TOGGLE_MODE_EVENT, function(context) {
    var simulationModeActive = context.simulationModeActive;

    if (simulationModeActive) {
      //self.container.style.display = 'block';
      // domClasses(self.container).remove('hidden');
    } else {
      self.container.style.display = 'none';
      // domClasses(self.container).add('hidden');
    }
  });
}

Palette.prototype._init = function() {
  this.container = document.getElementById('animation-palette');
  this.container.style.display = 'none';
  // domClasses(this.container).add('hidden');
  this.container.innerHTML = '<div class="token-simulation-palette hidden"></div>'
  //domify('<div class="token-simulation-palette hidden"></div>');

  //this._canvas.getContainer().appendChild(this.container);
};

Palette.prototype.addEntry = function(entry, index) {
  var childIndex = 0;

  this.entries.forEach(function(entry) {
    if (index >= entry.index) {
      childIndex++;
    }
  });

  this.container.insertBefore(entry, this.container.childNodes[childIndex]);
  entry.style.float = 'left';
  entry.style.padding = '0px 8px 0px 8px'
  this.entries.push({
    entry: entry,
    index: index
  });
};

Palette.$inject = [ 'eventBus', 'canvas' ];

module.exports = Palette;
