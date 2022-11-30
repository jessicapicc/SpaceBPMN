'use strict';

var is = require('../../../util/ElementHelper').is;

var events = require('../../../util/EventHelper'), DATA_UPDATE_EVENT = events.DATA_UPDATE_EVENT,CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT;

var tokens = require('../TokenSimulationBehavior');

var dataStructure = require('../../data/Data');


function DataObjectHandler(context, eventBus) {
	this._eventBus = eventBus;
}

DataObjectHandler.prototype.consume = function(context) {
	var documentation = context.data.businessObject.documentation;
	if (documentation) {
		return dataStructure.evaluate(documentation[0].text, context.processInstanceId);
	}
	return true;
};

DataObjectHandler.prototype.generate = function(context) {
	var documentation = context.data.businessObject.documentation;
	if (documentation) {
		dataStructure.update(documentation[0].text, context.processInstanceId);
	}

	this._eventBus.fire(DATA_UPDATE_EVENT, {
	});

};

DataObjectHandler.$inject = [ 'animation', 'eventBus' ];

module.exports = DataObjectHandler;
