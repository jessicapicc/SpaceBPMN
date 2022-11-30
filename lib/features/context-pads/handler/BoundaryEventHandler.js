'use strict';

var domify = require('min-dom/dist').domify,
domClasses = require('min-dom/dist').classes,
domEvent = require('min-dom/dist').event;

var is = require('../../../util/ElementHelper').is;
var eventDefinitionHelper = require('bpmn-js-properties-panel/lib/helper/EventDefinitionHelper');

var events = require('../../../util/EventHelper'), GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT, CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT;

function BoundaryEventHandler(eventBus, elementRegistry, animation) {
	this._eventBus = eventBus;
	this._elementRegistry = elementRegistry;
	this._animation = animation;
}

BoundaryEventHandler.prototype.createContextPad = function(element) {
	if (element.businessObject.eventDefinitions) {
		var timerEventDefinition = eventDefinitionHelper.getTimerEventDefinition(element);
		if (timerEventDefinition) {
			var self = this;
			var contextPad = domify('<div class="context-pad"><i class="fa fa-play"></i></div>');

			domEvent.bind(contextPad, 'click', function() {
				// QUI
				self._eventBus.fire(CONSUME_TOKEN_EVENT, {
					element : element
				});
			});
			return contextPad;
		}
	}


};

BoundaryEventHandler.$inject = [ 'eventBus', 'elementRegistry', 'animation' ];

module.exports = BoundaryEventHandler;
