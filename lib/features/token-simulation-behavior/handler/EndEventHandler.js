'use strict';

var elementHelper = require('../../../util/ElementHelper'), getBusinessObject = elementHelper.getBusinessObject, is = elementHelper.is, isAncestor = elementHelper.isAncestor, getDescendants = elementHelper.getDescendants, isTypedEvent = elementHelper.isTypedEvent;
var Data = require('../../data/Data');
var Scope = require('../../data/Scope');
var events = require('../../../util/EventHelper'), CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT, TERMINATE_EVENT = events.TERMINATE_EVENT, UPDATE_ELEMENTS_EVENT = events.UPDATE_ELEMENTS_EVENT;
var tokens = require('../TokenSimulationBehavior');
function EndEventHandler(animation, eventBus, log, simulationState,
		elementRegistry, processInstances, dataPanel) {
	this._animation = animation;
	this._eventBus = eventBus;
	this._log = log;
	this._simulationState = simulationState;
	this._elementRegistry = elementRegistry;
	this._processInstances = processInstances;
};

EndEventHandler.prototype.consume = function(context) {

	var element = context.element, processInstanceId = context.processInstanceId;
	var isTerminate = isTypedEvent(getBusinessObject(element),
			'bpmn:TerminateEventDefinition'), isSubProcessChild = is(
			element.parent, 'bpmn:SubProcess');

	var isMessageEvent = isTypedEvent(getBusinessObject(element),'bpmn:MessageEventDefinition');
	if (isTerminate) {
		this._eventBus.fire(TERMINATE_EVENT, context);

		this._elementRegistry.forEach(function(e) {
			if (isAncestor(element.parent, e) && e.tokenCount
					&& e.tokenCount[processInstanceId]) {
				delete e.tokenCount[processInstanceId];
				if (is(e, 'bpmn:SequenceFlow')) {
					window.tokenDistribution.set(e, 0);

				}
			}

		});

		// finish but do NOT remove
		//this._processInstances.finish(processInstanceId);
	}
	if(isMessageEvent){
		var self = this;
		var scope = window.instanceScope.get(processInstanceId);
		//-------
		var outgoingMessageFlows = element.outgoing.filter(function(outgoing) {
			return is(outgoing, 'bpmn:MessageFlow');
		});
		outgoingMessageFlows.forEach(function(outgoing) {
			// Add token to message flow
			var messageTokenDistribution = window.messageTokenDistribution;
			if (!messageTokenDistribution.get(outgoing)) {
				messageTokenDistribution.set(outgoing, 1);
			} else {
				var count = messageTokenDistribution.get(outgoing) + 1;
				messageTokenDistribution.set(outgoing, count);
			}
			// Add content to the message
			var message = Data.prepareMessage(element, scope);
			if(!window.pendingMessages.get(outgoing)){
				window.pendingMessages.set(outgoing, []);
			} else {
				window.pendingMessages.get(outgoing).push(message);
			}
			// MessageToken animation
			self._animation.createMessageAnimation(outgoing, processInstanceId,	function() {
				self._eventBus.fire(CONSUME_TOKEN_EVENT, {
					element : outgoing.target,
					processInstanceId : processInstanceId,
					message : message
				});
			});
		});
		//-------
	}
	var parent = element.parent;
	var isFinished = this._simulationState.isFinished(element,
			processInstanceId);

	if (isFinished) {
		// finish but do NOT remove
		window.multiInstancePool.get(parent).live--;
		this._processInstances.finish(processInstanceId);
	}

	if ((isFinished || isTerminate) && isSubProcessChild) {
		var processInstance = this._processInstances
				.getProcessInstance(processInstanceId);

		// generate token on parent
		this._eventBus.fire(GENERATE_TOKEN_EVENT, {
			element : element.parent,
			processInstanceId : processInstance.parentProcessInstanceId
		});
	}
	// remove token to each incoming sequence flow
	var incomingSequenceFlows = element.incoming.filter(function(incoming) {
		return is(incoming, 'bpmn:SequenceFlow');
	});
	var tokenDistribution = window.tokenDistribution.get(processInstanceId);
	incomingSequenceFlows.forEach(function(incoming) {
		if (!tokenDistribution.get(incoming)) {
			tokenDistribution.set(incoming, 0);
		} else {
			var count = tokenDistribution.get(incoming);
			tokenDistribution.set(incoming, count--);
		}
	});
	this._eventBus.fire(UPDATE_ELEMENTS_EVENT, {
		elements : getDescendants(this._elementRegistry.getAll(),
				element.parent)
	});
};

/**
 * End event never generates.
 */
EndEventHandler.prototype.generate = function(context) {
};

EndEventHandler.$inject = [ 'animation', 'eventBus', 'log', 'simulationState',
		'elementRegistry', 'processInstances', 'dataPanel' ];

module.exports = EndEventHandler;
