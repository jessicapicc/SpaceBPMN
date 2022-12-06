'use strict';

var is = require('../../../util/ElementHelper').is;

var events = require('../../../util/EventHelper'), CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT;

var tokens = require('../TokenSimulationBehavior');

function ParallelGatewayHandler(animation, eventBus) {
	this._animation = animation;
	this._eventBus = eventBus;
};

ParallelGatewayHandler.prototype.consume = function(context) {
	var element = context.element, processInstanceId = context.processInstanceId;

	var tokenDistribution = window.tokenDistribution.get(processInstanceId);
	if (!element.tokenCount) {
		element.tokenCount = {};
	}
	if (!element.tokenCount[processInstanceId]) {
		element.tokenCount[processInstanceId] = 0;
	}
	element.tokenCount[processInstanceId]++;

	var incomingSequenceFlows = element.incoming.filter(function(incoming) {
		return is(incoming, 'bpmn:SequenceFlow');
	});
	var haveTokens = true;
	incomingSequenceFlows.forEach(function(income) {
		if(!tokenDistribution.get(income)){
			tokenDistribution.set(income, 0);
		}
		if (tokenDistribution.get(income) < 1) {
			haveTokens = false;
		}
	});

	if (haveTokens) {
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
		//this._eventBus.fire(GENERATE_TOKEN_EVENT, context);
		this.generate(context);
		element.tokenCount[processInstanceId] = element.tokenCount[processInstanceId] - incomingSequenceFlows.length;
	}
};

ParallelGatewayHandler.prototype.generate = function(context) {
	var self = this;

	var element = context.element, processInstanceId = context.processInstanceId;
	var tokenDistribution = window.tokenDistribution.get(processInstanceId);
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
	});

	var outgoingSequenceFlows = element.outgoing.filter(function(outgoing) {
		return is(outgoing, 'bpmn:SequenceFlow');
	});

	outgoingSequenceFlows.forEach(function(outgoing) {
		var delay = Math.floor(Math.random() * 100);
		setTimeout(function(){
		self._animation.createAnimation(outgoing, processInstanceId,
				function() {
						self._eventBus.fire(CONSUME_TOKEN_EVENT, {
							element : outgoing.target,
							processInstanceId : processInstanceId
						});
				});
			}, delay);
	});
};


ParallelGatewayHandler.$inject = [ 'animation', 'eventBus' ];

module.exports = ParallelGatewayHandler;
