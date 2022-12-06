'use strict';

var is = require('../../../util/ElementHelper').is;

var events = require('../../../util/EventHelper'), CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT, UPDATE_ELEMENT_EVENT = events.UPDATE_ELEMENT_EVENT;

var tokens = require('../TokenSimulationBehavior');

function SubProcessHandler(animation, eventBus, log) {
	this._animation = animation;
	this._eventBus = eventBus;
	this._log = log;
	this.maxI = 1;
};

SubProcessHandler.prototype.consume = function(context) {
	var element = context.element, processInstanceId = context.processInstanceId;
	//MI ACTIVITY
	var isSequential;
	if (element.businessObject.loopCharacteristics) {
		//
		isSequential = element.businessObject.loopCharacteristics
		.get('isSequential');
		if (element.businessObject.loopCharacteristics.get('loopCardinality')) {
			this.maxI = parseInt(element.businessObject.loopCharacteristics.get(
				'loopCardinality').get('body'));
			}
	}
	for(var i =0; i<this.maxI; i++){
		var startEvents = element.children.filter(function(child) {
			return is(child, 'bpmn:StartEvent')
					&& !child.businessObject.eventDefinitions;
		});
		// if (!startEvents) {
		// this._log.log('Skipping Subprocess', 'info', 'fa-angle-double-right');
		//
		// // skip subprocess
		// this._eventBus.fire(GENERATE_TOKEN_EVENT, context);
		// } else {
		this._log.log('Starting Subprocess', 'info', 'fa-sign-in');
		var self = this;
		var tokenDistribution = window.tokenDistribution.get(processInstanceId);

		startEvents.forEach(function(startEvent) {
			// start subprocess with process instance ID as parent process instance
			// ID
			self._eventBus.fire(GENERATE_TOKEN_EVENT, {
				element : startEvent,
				parentProcessInstanceId : processInstanceId
			});
		});
		// }

		this._eventBus.fire(UPDATE_ELEMENT_EVENT, {
			element : element
		});
	}

};

SubProcessHandler.prototype.generate = function(context) {
	var self = this;

	var element = context.element, processInstanceId = context.processInstanceId;
	var tokenDistribution = window.tokenDistribution;
	var sFlows = element.children.filter(function(sFlow) {
		return is(sFlow, 'bpmn:SequenceFlow');
	});
	var isActive = true;
	sFlows.forEach(function(sFlow) {
		if (tokenDistribution.get(sFlow) > 0) {
			isActive = false;
		}
	});
	this.maxI--;
	var miGuard = true;
	if(this.maxI > 0){
		miGuard = false;
	}
	if (isActive && miGuard) {

		var tokenDistribution = window.tokenDistribution.get(processInstanceId);
		// remove token to each incoming sequence flow
		var incomingSequenceFlows = element.incoming.filter(function(incoming) {
			return is(incoming, 'bpmn:SequenceFlow');
		});
		incomingSequenceFlows.forEach(function(incoming) {
			var tokDist = window.tokenDistribution.get(processInstanceId);
			if (!tokenDistribution.get(incoming)) {
				tokenDistribution.set(incoming, 1);
			} else {
				var count = tokenDistribution.get(incoming);
				tokenDistribution.set(incoming, count++);
			}
		});
		// remove token to each incoming sequence flow
		var incomingSequenceFlows = element.incoming.filter(function(incoming) {
			return is(incoming, 'bpmn:SequenceFlow');
		});
		incomingSequenceFlows.forEach(function(incoming) {
			if (!tokenDistribution.get(incoming)) {
				tokenDistribution.set(incoming, 0);
			} else {
				var count = tokenDistribution.get(incoming)-1;
				tokenDistribution.set(incoming, count);

			}
		});
		// add token to each outgoing sequence flow
		var outgoingSequenceFlows = element.outgoing.filter(function(outgoing) {
			return is(outgoing, 'bpmn:SequenceFlow');
		});
		outgoingSequenceFlows.forEach(function(outgoing) {
			if (!tokenDistribution.get(outgoing)) {
				tokenDistribution.set(outgoing, 1);
			} else {
				var count = tokenDistribution.get(outgoing);
				tokenDistribution.set(outgoing, count++);
			}
			self._animation.createAnimation(outgoing, processInstanceId,
					function() {
						self._eventBus.fire(CONSUME_TOKEN_EVENT, {
							element : outgoing.target,
							processInstanceId : processInstanceId
						});
					});
		});
		this._eventBus.fire(UPDATE_ELEMENT_EVENT, {
			element : element
		});
	}
};

SubProcessHandler.$inject = [ 'animation', 'eventBus', 'log' ];

module.exports = SubProcessHandler;
