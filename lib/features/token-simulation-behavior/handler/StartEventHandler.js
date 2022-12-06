'use strict';

var is = require('../../../util/ElementHelper').is;
var Scope = require('../../data/Scope');
var Data = require('../../data/Data');
var events = require('../../../util/EventHelper'), YES_PATTER_MATCHING_EVENT = events.YES_PATTER_MATCHING_EVENT, NO_PATTER_MATCHING_EVENT = events.NO_PATTER_MATCHING_EVENT, RESET_SIMULATION_EVENT = events.RESET_SIMULATION_EVENT, MAXINSTANCE_VIOLATION_EVENT = events.MAXINSTANCE_VIOLATION_EVENT, CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT, UPDATE_ELEMENT_EVENT = events.UPDATE_ELEMENT_EVENT, UPDATE_ELEMENTS_EVENT = events.UPDATE_ELEMENTS_EVENT;
var tokens = require('../TokenSimulationBehavior');

function StartEventHandler(animation, eventBus, elementRegistry, processInstances) {
	this._animation = animation;
	this._eventBus = eventBus;
	this._elementRegistry = elementRegistry;
	this._processInstances = processInstances;
};

/**
* Start event has no incoming sequence flows. Therefore it can never consume.
*/
StartEventHandler.prototype.consume = function(context) {
	var element = context.element, parent = element.parent, parentProcessInstanceId = context.parentProcessInstanceId;
	var correlationInstance = context.correlationInstance;
	var self = this;
	var multiInstancePool = window.multiInstancePool;
	if(is (parent, 'bpmn:Lane')){parent = parent.parent}
	//PARTICIPANT MULTI INSTANCE
	var minI = 1;
	var maxI = 1;
	if (parent.businessObject.participantMultiplicity){
		minI = parent.businessObject.participantMultiplicity.get('minimum');
		maxI = parent.businessObject.participantMultiplicity.get('maximum');
	}
	if (!multiInstancePool.get(parent)){
		multiInstancePool.set(parent, {live: 0, min: minI, max: maxI});
	}
	if (!element.businessObject.eventDefinitions) {//START EVENT
		if(multiInstancePool.get(parent).live < multiInstancePool.get(parent).max) {
			do{
				var pI = this._processInstances.create(parent, parentProcessInstanceId);//A NEW ISTANCE
				multiInstancePool.get(parent).live++
				window.tokenDistribution.set(pI,new Map());
				var scope = new Scope();
				Scope.addVariables(scope, ['instance']);
				var str = "instance = "+pI+";";
				scope.eval(str)
				window.instanceScope.set(pI, scope);
				Data.evaluateDataObjects(element, scope);//EVALUATE D.OBJ in its scope
				self._eventBus.fire(GENERATE_TOKEN_EVENT, {
					element : element,
					processInstanceId : pI
				});
			}
			while(multiInstancePool.get(parent).live < multiInstancePool.get(parent).min)
		} else {
			self._eventBus.fire(MAXINSTANCE_VIOLATION_EVENT, {
				element : parent
			});
		}
		var messageTokenDistribution = window.messageTokenDistribution;
		// //-------BLACK BOX POOL MESSAGES---------------------------------//
		// this._elementRegistry.forEach(function(element) {
		// 	if(is(element, 'bpmn:MessageFlow') && is(element.source, 'bpmn:Participant')){
		// 		console.log("New Message...")
		// 		var maxI = 1;
		// 		if (element.source.businessObject.participantMultiplicity){
		// 			maxI = element.source.businessObject.participantMultiplicity.get('maximum');
		// 		}
		// 		// Add token to message flow
		// 		//var messageTokenDistribution = window.messageTokenDistribution;
		// 		for(var i = 0 ; i<maxI ; i++){
		// 			if (!messageTokenDistribution.get(element)) {
		// 				messageTokenDistribution.set(element, 1);
		// 			} else {
		// 				var count = messageTokenDistribution.get(element) + 1;
		// 				messageTokenDistribution.set(element, count);
		// 			}
		// 			// MessageToken animation
		// 			self._animation.createMessageAnimation( element, pI,
		// 				function() {
		// 					self._eventBus.fire(CONSUME_TOKEN_EVENT, {
		// 						element : element.target,
		// 						processInstanceId : pI,
		// 						correlationInstance : pI
		// 					});
		// 				});
		// 			}
		// 		}
		// 	});
		// 	//____________________________________________________-

	} else {// MESSAGESTARTEVENT
		var pI = this._processInstances.create(parent, parentProcessInstanceId);
		var messageTokenDistribution = window.messageTokenDistribution;
		var incomingMessageFlows = element.incoming.filter(function(incoming) {
			return is(incoming, 'bpmn:MessageFlow');
		});
		if(multiInstancePool.get(parent).live < multiInstancePool.get(parent).max) {
			multiInstancePool.get(parent).live++
			var isActive = false;
			var inst = 0;
			incomingMessageFlows.forEach(function(incoming) {
				if (!messageTokenDistribution.get(incoming)) {
					messageTokenDistribution.set(incoming, 0);
				}
				if (messageTokenDistribution.get(incoming) > 0) {
					isActive = true;
				}
			});
			if (isActive) {
				// tokens.correlation.set(correlationInstance, pI);
				// tokens.correlation.set(pI, correlationInstance);
				incomingMessageFlows.forEach(function(incoming) {
					var count = messageTokenDistribution.get(incoming)-1;
					messageTokenDistribution.set(incoming, count);
				});
				//Add instance tokDist
				window.tokenDistribution.set(pI,new Map());
				var scope = new Scope();
				Scope.addVariables(scope, ['instance']);
				scope.eval('instance = '+pI+";");
				window.instanceScope.set(pI, scope);
				// var elements = modeler.get('elementRegistry').filter(function(element) {
				// 	return is(element, 'bpmn:DataObjectReference');
				// });
				Data.evaluateDataObjects(element, scope);//EVALUATE D.OBJ in its scope
				var thisMsg = context.message;
				var templ = Data.prepareTemplate(element.businessObject.extensionElements.values);
				var thisTempl = {
					template : templ,
					pI : pI,
					scope : window.instanceScope.get(pI)
				}
				if(Data.patterMatching(thisMsg, thisTempl)){
					self._eventBus.fire(GENERATE_TOKEN_EVENT, {
						element : element,
						processInstanceId : pI
					});
					self._eventBus.fire(YES_PATTER_MATCHING_EVENT, {
						element : element
					});
				}else{
					self._eventBus.fire(NO_PATTER_MATCHING_EVENT, {
						element : element
					});
				}
			} else {
				self._eventBus.fire(MAXINSTANCE_VIOLATION_EVENT, {
					element : parent
				});
			}

			var messageTokenDistribution = window.messageTokenDistribution;
			// //-------BLACK BOX POOL MESSAGES---------------------------------//
			// this._elementRegistry.forEach(function(element) {
			// 	if(is(element, 'bpmn:MessageFlow') && is(element.source, 'bpmn:Participant')){
			// 		console.log("New Message...")
			//
			// 		// Add token to message flow
			// 		//	var messageTokenDistribution = window.messageTokenDistribution;
			// 		if (!messageTokenDistribution.get(element)) {
			// 			messageTokenDistribution.set(element, 1);
			// 		} else {
			// 			var count = messageTokenDistribution.get(element) + 1;
			// 			messageTokenDistribution.set(element, count);
			// 		}
			// 		// MessageToken animation
			// 		self._animation.createMessageAnimation( element, pI,
			// 			function() {
			// 				self._eventBus.fire(CONSUME_TOKEN_EVENT, {
			// 					element : element.target,
			// 					processInstanceId : pI,
			// 					correlationInstance : pI
			// 				});
			// 			});
			// 		}
			// 	});
			// 	//____________________________________________________-
		}else {
			self._eventBus.fire(MAXINSTANCE_VIOLATION_EVENT, {
				element : parent
			});
		}
	}
};

/**
* Generate tokens for start event that was either invoked by user or a parent
* process.
*
* @param {Object}
*            context - The context.
* @param {Object}
*            context.element - The element.
* @param {string}
*            [context.parentProcessInstanceId] - Optional ID of parent process
*            when invoked by parent process.
*
*/
StartEventHandler.prototype.generate = function(context) {
	var self = this;
	var element = context.element, parentProcessInstanceId = context.parentProcessInstanceId,
	processInstanceId = context.processInstanceId;
	// add token to each outgoing sequence flow
	var tokenDistribution = window.tokenDistribution.get(processInstanceId);
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

	//SUBPROCESS
	if (is(element.parent, 'bpmn:SubProcess')) {
		var processInstanceId = this._processInstances.create(element.parent,
			parentProcessInstanceId);	// create new process instance
			window.tokenDistribution.set(processInstanceId,new Map());
			var tokenDistribution = window.tokenDistribution.get(processInstanceId);
			var outgoingSequenceFlows = element.outgoing.filter(function(outgoing) {
				return is(outgoing, 'bpmn:SequenceFlow');
			});
			outgoingSequenceFlows.forEach(function(connection) {
				self._animation.createAnimation(connection, processInstanceId,
					function() {
						self._eventBus.fire(CONSUME_TOKEN_EVENT, {
							element : connection.target,
							processInstanceId : processInstanceId
						});
					});
				});
				return;
			}
			//MAIN PROCES
			outgoingSequenceFlows.forEach(function(connection) {
				self._animation.createAnimation(connection, processInstanceId,
					function() {
						self._eventBus.fire(CONSUME_TOKEN_EVENT, {
							element : connection.target,
							processInstanceId : processInstanceId
						});
					});
				});
				this._eventBus.fire(UPDATE_ELEMENT_EVENT, {
					element: element
				});
			};

			StartEventHandler.$inject = [ 'animation', 'eventBus', 'elementRegistry', 'processInstances' ];
			module.exports = StartEventHandler;
