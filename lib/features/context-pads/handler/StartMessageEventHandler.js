'use strict';

var domify = require('min-dom/dist').domify, 
domClasses = require('min-dom/dist').classes, 
domEvent = require('min-dom/dist').event;

var is = require('../../../util/ElementHelper').is;

var events = require('../../../util/EventHelper'),
    GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT;

function Handler(eventBus, elementRegistry, animation) {
  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;
  this._animation = animation;
}

StartMessageEventHandler.prototype.createContextPad = function(element) {
  var tokens = false;

  this._elementRegistry.forEach(function(element) {
    if (element.tokenCount) {
      Object.values(element.tokenCount).forEach(function(tokenCount) {
        if (tokenCount) {
          tokens = true;
        }
      });
    }
  });

  if (is(element.parent, 'bpmn:SubProcess') ||
      tokens ||
      this._animation.animations.length) {
    return;
  }

  var self = this;
  var contextPad = domify('<div class="context-pad"><i class="fa fa-play"></i></div>');

  domEvent.bind(contextPad, 'click', function() {
    self._eventBus.fire(GENERATE_TOKEN_EVENT, {
      element: element
    });
  });

  return contextPad;
};

StartMessageEventHandler.$inject = [ 'eventBus', 'elementRegistry', 'animation' ];

module.exports = StartMessageEventHandler;
