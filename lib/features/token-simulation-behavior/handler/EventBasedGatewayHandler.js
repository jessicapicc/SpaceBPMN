'use strict';

var is = require('../../../util/ElementHelper').is;

var events = require('../../../util/EventHelper'), YES_PATTER_MATCHING_EVENT = events.YES_PATTER_MATCHING_EVENT, NO_PATTER_MATCHING_EVENT = events.NO_PATTER_MATCHING_EVENT, RESET_SIMULATION_EVENT = events.RESET_SIMULATION_EVENT, TERMINATE_EVENT = events.TERMINATE_EVENT, CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT, UPDATE_ELEMENTS_EVENT = events.UPDATE_ELEMENTS_EVENT;
var tokens = require('../TokenSimulationBehavior');
var waitingMsg = new Map();
var waitingTempl =  new Map();

var Data = require('../../data/Data');

function EventBasedGatewayHandler(eventBus, animation) {
	this._eventBus = eventBus;
	this._animation = animation;
	eventBus.on(RESET_SIMULATION_EVENT, function() {
		waitingMsg = new Map();
		waitingTempl =  new Map();
	});
	// eventBus.on(TERMINATE_EVENT, function(context) {
	// 	waitingMsg = new Map();
	// 	waitingTempl =  new Map();
	// });
};

EventBasedGatewayHandler.prototype.consume = function(context) {
	var element = context.element, processInstanceId = context.processInstanceId;
	var self= this;
	var message = context.message;
	var tokenDistribution = window.tokenDistribution.get(processInstanceId);

	if(!waitingMsg.get(element)){
		waitingMsg.set(element, []);
	}

	if(!waitingTempl.get(element)){
		waitingTempl.set(element, []);
	}

	if(message){ // Is a message token
		waitingMsg.get(element).push({
			message : message,
			receiveEl : context.receiveEl
		});
	}else { // Is a process token
		if (!element.tokenCount) {
			element.tokenCount = {};
		}
		if (!element.tokenCount[processInstanceId]) {
			element.tokenCount[processInstanceId] = 0;
		}
		element.tokenCount[processInstanceId]++;
		var outgoingSequenceFlows = element.outgoing.filter(function(outgoing) {
			return is(outgoing, 'bpmn:SequenceFlow');
		});
		var toAppend = [];
		outgoingSequenceFlows.forEach(function(outgoing) {
			var templ = Data.prepareTemplate(outgoing.target.businessObject.extensionElements.values);
			toAppend.push({
				template : templ,
				pI : processInstanceId,
				scope : window.instanceScope.get(processInstanceId)
			});
		});
		waitingTempl.get(element).push(toAppend);
	}
	var match = true;
	var el;
	waitingMsg.get(element).some(function(thisMsg) {
		waitingTempl.get(element).some(function(templArray) {
			templArray.some(function(thisTempl){
				if(Data.patterMatching(thisMsg.message, thisTempl)){
					waitingMsg.get(element).splice(waitingMsg.get(element).indexOf(thisMsg.message),1);
					waitingTempl.get(element).splice(waitingTempl.get(element).indexOf(templArray),1);
					element.tokenCount[thisTempl.pI]--;
					self._eventBus.fire(GENERATE_TOKEN_EVENT, {
						element : element,
						target : thisMsg.receiveEl,
						processInstanceId : thisTempl.pI,
					});
					el = thisMsg.receiveEl;
					return true;
				}else{
					el = thisMsg.receiveEl;
					match = false;
				}
			});

		});
	});
	if(match && el){
	self._eventBus.fire(YES_PATTER_MATCHING_EVENT, {
		element : el
	});
}else{
	// self._eventBus.fire(NO_PATTER_MATCHING_EVENT, {
	// 	element : el
	// });
}
};

EventBasedGatewayHandler.prototype.generate = function(context) {
	var element = context.element, processInstanceId = context.processInstanceId;
	var self = this;
	var tokenDistribution = window.tokenDistribution.get(processInstanceId);

	// remove token to each incoming sequence flow
	var incomingSequenceFlows = element.incoming.filter(function(incoming) {
		return is(incoming, 'bpmn:SequenceFlow');
	});
	incomingSequenceFlows.forEach(function(incoming) {
		if (!tokenDistribution.get(incoming)) {
			tokenDistribution.set(incoming, 0);
		} else {
			var count = tokenDistribution.get(incoming) -1;
			tokenDistribution.set(incoming, count);
		}
	});
	// add token to the choosen outgoing sequence flow
	var outgoingSequenceFlows = element.outgoing.filter(function(outgoing) {
		return is(outgoing, 'bpmn:SequenceFlow');
	});
	outgoingSequenceFlows.forEach(function(outgoing) {
		if(outgoing.target === context.target){
			if (!tokenDistribution.get(outgoing)) {
				tokenDistribution.set(outgoing, 0);
			} else {
				var count = tokenDistribution.get(outgoing);
				tokenDistribution.set(outgoing, count++);
			}
			//Animate outgoing token
			self._animation.createAnimation(outgoing, processInstanceId,
				function() {
					if(!window.eventBasedRaceCondition.get(element)){
						window.eventBasedRaceCondition.set(element, []);
					}
					window.eventBasedRaceCondition.get(element).push(processInstanceId)
					self._eventBus.fire(CONSUME_TOKEN_EVENT, {
						element : context.target,
						processInstanceId : processInstanceId,
						isRacing : true
					});
				});
			}

		});

	};

	EventBasedGatewayHandler.$inject = [ 'eventBus', 'animation' ];

	module.exports = EventBasedGatewayHandler;
