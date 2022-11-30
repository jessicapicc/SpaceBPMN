'use strict';

var is = require('../../../util/ElementHelper').is;
var events = require('../../../util/EventHelper'), GATEWAY_VIOLATION_EVENT = events.GATEWAY_VIOLATION_EVENT, SYNTAX_VIOLATION_EVENT = events.SYNTAX_VIOLATION_EVENT, CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT;

var tokens = require('../TokenSimulationBehavior');
var dataStructure = require('../../data/Data');

function ExclusiveGatewayHandler(eventBus, animation, elementRegistry) {
	this._eventBus = eventBus;
	this._animation = animation;
	this._elementRegistry = elementRegistry;
};

ExclusiveGatewayHandler.prototype.consume = function(context) {
	this._eventBus.fire(GENERATE_TOKEN_EVENT, context);
};

ExclusiveGatewayHandler.prototype.generate = function(context) {
	var element = context.element, processInstanceId = context.processInstanceId;
var scope = window.instanceScope.get(processInstanceId);
	var self = this;

	// property could be changed during animation
	// therefore element.sequenceFlow can't be used
	var outgoingSequenceFlows = element.outgoing.filter(function(outgoing) {
		return is(outgoing, 'bpmn:SequenceFlow');
	});

	var isDeadToken = true;
	var tokenDistribution = window.tokenDistribution.get(processInstanceId);
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


		try{
			outgoingSequenceFlows.some(function(outgoing) {
				if ( Object.keys(outgoingSequenceFlows).length === 1 || (outgoing.businessObject.conditionExpression &&
					dataStructure.evaluateCondition(outgoing.businessObject.conditionExpression.body, scope))) {
					// add token to each outgoing sequence flow
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
						isDeadToken = false;
						return true;
					}
				});
		}
		catch (e) {
			this._eventBus.fire(SYNTAX_VIOLATION_EVENT, {
				element : element,
				processInstanceId : processInstanceId,
				error : e
			});
			return;
		}
		if (isDeadToken) {
			if(element.businessObject.default){
				var defaultSF = element.outgoing.filter(function(out) {
					return out.businessObject.id === element.businessObject.default.id;
				});
				defaultSF.forEach(function(def) {
					// add token to each outgoing sequence flow
					if (!tokenDistribution.get(def)) {
						tokenDistribution.set(def, 1);
					} else {
						var count = tokenDistribution.get(def);
						tokenDistribution.set(def, count++);
					}
					self._animation.createAnimation(def, processInstanceId,
						function() {
							self._eventBus.fire(CONSUME_TOKEN_EVENT, {
								element : def.target,
								processInstanceId : processInstanceId
							});
						});
					});
				}else{//No sequence flow fireable
						this._eventBus.fire(GATEWAY_VIOLATION_EVENT, {
							element : element,
							processInstanceId : processInstanceId
						});
				}
			}

		};

		ExclusiveGatewayHandler.$inject = [ 'eventBus', 'animation', 'elementRegistry' ];

		module.exports = ExclusiveGatewayHandler;
