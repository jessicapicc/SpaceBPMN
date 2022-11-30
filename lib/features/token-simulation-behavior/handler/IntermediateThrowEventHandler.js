'use strict';
var getBusinessObject = require('../../../../node_modules/bpmn-js/lib/util/ModelUtil').getBusinessObject;
var is = require('../../../util/ElementHelper').is;

var Data = require('../../data/Data');

var events = require('../../../util/EventHelper'), SYNTAX_VIOLATION_EVENT = events.SYNTAX_VIOLATION_EVENT, GUARD_VIOLATION_EVENT = events.GUARD_VIOLATION_EVENT, CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, CONSUME_MESSAGE_TOKEN_EVENT = events.CONSUME_MESSAGE_TOKEN_EVENT, GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT, GENERATE_MESASGE_TOKEN_EVENT = events.GENERATE_MESSAGE_TOKEN_EVENT;

var tokens = require('../TokenSimulationBehavior');

function IntermediateThrowEventHandler(animation, eventBus) {
	this._animation = animation;
	this._eventBus = eventBus;
};

IntermediateThrowEventHandler.prototype.consume = function(context) {
	var self = this;
	var element = context.element, processInstanceId = context.processInstanceId;
	var scope = window.instanceScope.get(processInstanceId);
	var guard = true;
	var maxI = 1;
	var completionCondition;
	if (is(element, 'bpmn:SendTask')) {//ONLY SEND TASK MANAGE DATA
		var isSequential;
		if (element.businessObject.loopCharacteristics) {
			isSequential = element.businessObject.loopCharacteristics
			.get('isSequential');
			if (element.businessObject.loopCharacteristics.get('loopCardinality')) {
				maxI = scope.eval(element.businessObject.loopCharacteristics.get(
 				 'loopCardinality').get('body'));
				}
			if (element.businessObject.loopCharacteristics.get('completionCondition')) {
				completionCondition = scope.eval(element.businessObject.loopCharacteristics.get(
					'completionCondition').get('body'));
				}
			}
			for (var i = 0; i < maxI; i++) {
				// START Manage Data Object if exists
				var incomingDataAssociations = element.incoming.filter(function(incoming) {
					return is(incoming, 'bpmn:DataInputAssociation');
				});
				var outgoingDataAssociations = element.outgoing.filter(function(outgoing) {
					return is(outgoing, 'bpmn:DataOutputAssociation');
				});
				if(incomingDataAssociations.lenght != undefined | outgoingDataAssociations != undefined){//TODO VERIFICARE PROPRIETA DOBJ
					try {
						guard = Data.evaluateGuard(element, scope);
						if(guard){
							Data.evaluateAssignments(element, scope);
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
					}
					catch (e) { 
						this._eventBus.fire(SYNTAX_VIOLATION_EVENT, {
							element : element,
							processInstanceId : processInstanceId,
							error : e
						});
						return;
					}
				}
				// END  Manage Data Object if exists
				if(completionCondition && Data.evaluateCondition(scope, completionCondition)) {
					break;}
			}
		}else{
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
		if(guard){
			//INTERMEDIATE THROW & SEND TASK
			//MANAGE SEND


			this._eventBus.fire(GENERATE_TOKEN_EVENT, context);
		}else{
			//Call violation notification
			this._eventBus.fire(GUARD_VIOLATION_EVENT, {
				element : element,
				processInstanceId : processInstanceId
			});
		}
	};

	IntermediateThrowEventHandler.prototype.generate = function(context) {
		var self = this;
		var element = context.element, processInstanceId = context.processInstanceId;
		var tokenDistribution = window.tokenDistribution.get(processInstanceId);
		var incomingSequenceFlows = element.incoming.filter(function(incoming) {
			return is(incoming, 'bpmn:SequenceFlow');
		});
		var outgoingSequenceFlows = element.outgoing.filter(function(outgoing) {
			return is(outgoing, 'bpmn:SequenceFlow');
		});
		// remove token to each incoming sequence flow
		incomingSequenceFlows.forEach(function(incoming) {
			var tokDist = window.tokenDistribution.get(processInstanceId);
			if (!tokenDistribution.get(incoming)) {
				tokenDistribution.set(incoming, 1);
			} else {
				var count = tokenDistribution.get(incoming)-1;
				tokenDistribution.set(incoming, count);
			}
		});
		// add token to each outgoing sequence flow
		outgoingSequenceFlows.forEach(function(outgoing) {
			if (!tokenDistribution.get(outgoing)) {
				tokenDistribution.set(outgoing, 1);
			} else {
				var count = tokenDistribution.get(outgoing) + 1;
				tokenDistribution.set(outgoing, count);
			}
			self._animation.createAnimation(outgoing, processInstanceId,
				function() {
					self._eventBus.fire(CONSUME_TOKEN_EVENT, {
						element : outgoing.target,
						processInstanceId : processInstanceId
					});
				});
			});
		};

		IntermediateThrowEventHandler.$inject = [ 'animation', 'eventBus' ];

		module.exports = IntermediateThrowEventHandler;
