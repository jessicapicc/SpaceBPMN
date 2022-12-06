'use strict';

var elementHelper = require('../../../util/ElementHelper'), is = elementHelper.is, getDescendants = elementHelper.getDescendants;

var Data = require('../../data/Data');
var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;
var events = require('../../../util/EventHelper'), INTERMEDIATE_TOKEN_EVENT = events.INTERMEDIATE_TOKEN_EVENT, YES_PATTER_MATCHING_EVENT = events.YES_PATTER_MATCHING_EVENT, NO_PATTER_MATCHING_EVENT = events.NO_PATTER_MATCHING_EVENT, SYNTAX_VIOLATION_EVENT = events.SYNTAX_VIOLATION_EVENT, GUARD_VIOLATION_EVENT = events.GUARD_VIOLATION_EVENT, TERMINATE_EVENT = events.TERMINATE_EVENT, RESET_SIMULATION_EVENT = events.RESET_SIMULATION_EVENT, GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT, GENERATE_MESSAGE_TOKEN_EVENT = events.GENERATE_MESSAGE_TOKEN_EVENT, CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, CONSUME_MESSAGE_TOKEN_EVENT = events.CONSUME_MESSAGE_TOKEN_EVENT, UPDATE_ELEMENT_EVENT = events.UPDATE_ELEMENT_EVENT, UPDATE_ELEMENTS_EVENT = events.UPDATE_ELEMENTS_EVENT;

var tokens = require('../TokenSimulationBehavior');
var maxI;


function IntermediateCatchEventHandler(animation, eventBus, elementRegistry) {
	this._animation = animation;
	this._eventBus = eventBus;
	this._elementRegistry = elementRegistry;
	eventBus.on(RESET_SIMULATION_EVENT, function() {
		window.waitingMsg = new Map();
		window.waitingTempl =  new Map();
	});

	// eventBus.on(TERMINATE_EVENT, function(context) {
	// 	window.waitingMsg = new Map();
	// 	window.waitingTempl =  new Map();
	// });
};

IntermediateCatchEventHandler.prototype.consume = function(context) {
	var corrInstances = 0;
	var self = this;
	var message = context.message;
	var element = context.element, processInstanceId = context.processInstanceId, parentProcessInstanceId = context.parentProcessInstanceId;
	var tokenDistribution = window.tokenDistribution.get(processInstanceId), messageTokenDistribution = window.messageTokenDistribution;

	if(!window.waitingMsg.get(element)){
		window.waitingMsg.set(element, []);
	}
	if(!window.waitingTempl.get(element)){
		window.waitingTempl.set(element, []);
	}

	if(message){ // Is a message token
		var incomingSequenceFlows = element.incoming.filter(function(incoming) {
			return is(incoming, 'bpmn:SequenceFlow');
		});
		var eventBased = undefined
		incomingSequenceFlows.forEach(function(incoming) {
			if (is(incoming.source, 'bpmn:EventBasedGateway')){
				eventBased = incoming.source;
			}
		});
		if(eventBased!=undefined){
			self._eventBus.fire(CONSUME_TOKEN_EVENT, {
				element : eventBased,
				processInstanceId : processInstanceId,
				message : message,
				receiveEl : element
			});// Delegate  the task to the EventBasedGateway
			return; //End this method
		}else{
			window.waitingMsg.get(element).push(message);
		}
	}else { // Is a process token
		var maxI = 1;
		var guard = true;
		var scope = window.instanceScope.get(processInstanceId);

		if (is(element, 'bpmn:ReceiveTask')) {
			//MI ACTIVITY
			var isSequential;
			if (element.businessObject.loopCharacteristics) {
				isSequential = element.businessObject.loopCharacteristics
				.get('isSequential');
				if (element.businessObject.loopCharacteristics.get('loopCardinality')) {
					maxI = scope.eval(element.businessObject.loopCharacteristics.get(
						'loopCardinality').get('body'));
					}
				}
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
			}
			if(guard){
				if (!context.isRacing) { // The token does not come from event based gatweay
					var templ;
					if(element.businessObject.extensionElements){
						templ = Data.prepareTemplate(element.businessObject.extensionElements.values);
					}

					window.waitingTempl.get(element).push({
						template : templ,
						pI : processInstanceId,
						scope : window.instanceScope.get(processInstanceId),
						aliveMI : maxI
					});
				}
				//TOKEN COUNTER
				if (!element.tokenCount) {
					element.tokenCount = {};
				}
				if (!element.tokenCount[processInstanceId]) {
					element.tokenCount[processInstanceId] = 0;
				}
				element.tokenCount[processInstanceId]++;
			}else{
				//Call violation notification
				this._eventBus.fire(GUARD_VIOLATION_EVENT, {
					element : element,
					processInstanceId : processInstanceId
				});
			}
		}
		if(getBusinessObject(element).tasktype === 'na_nc'){//NANC
			this._eventBus.fire(INTERMEDIATE_TOKEN_EVENT, context);
		}else if (getBusinessObject(element).tasktype === 'na_c'){//NAC
			this._eventBus.fire(INTERMEDIATE_TOKEN_EVENT, context);
		} else {//A
			this.intermediate(context)
		}
	};

	IntermediateCatchEventHandler.prototype.intermediate = function(context) {
		var self = this;
		var message = context.message;
		var element = context.element, processInstanceId = context.processInstanceId, parentProcessInstanceId = context.parentProcessInstanceId;
		var tokenDistribution = window.tokenDistribution.get(processInstanceId), messageTokenDistribution = window.messageTokenDistribution;

		if (context.isRacing) { // The token comes from event based gatweay
			self.generate({
				element : element,
				processInstanceId : processInstanceId,
				isRacing : context.isRacing
			});
		}else{
			window.waitingMsg.get(element).some(function(thisMsg) {
				window.waitingTempl.get(element).some(function(thisTempl) {
					if(Data.patterMatching(thisMsg, thisTempl)){
						self.generate({
							element : element,
							processInstanceId : thisTempl.pI,
							thisTempl : thisTempl,
							thisMsg : thisMsg
						});
						self._eventBus.fire(YES_PATTER_MATCHING_EVENT, {
							element : element
						});
					}else{
						// self._eventBus.fire(NO_PATTER_MATCHING_EVENT, {
						// 	element : element
						// });
					}
				});
			});
		}
	};

	IntermediateCatchEventHandler.prototype.generate = function(context) {
		var self = this;
		var element = context.element, processInstanceId = context.processInstanceId;
		var check = true;
		var messageTokenDistribution = window.messageTokenDistribution;
		var tokenDistribution = window.tokenDistribution.get(processInstanceId);
		if (context.isRacing) { // The token comes from event based gatweay
			Data.evaluateAssignments(element, window.instanceScope.get(processInstanceId));
			element.tokenCount[processInstanceId]--;
		}
		if(context.thisMsg){
			var thisTempl = context.thisTempl, thisMsg = context.thisMsg;
			thisTempl.aliveMI--;
			Data.evaluateAssignments(element, thisTempl.scope);
			window.waitingMsg.get(element).splice(window.waitingMsg.get(element).indexOf(thisMsg),1);
			if(thisTempl.aliveMI == 0){
				window.waitingTempl.get(element).splice(window.waitingTempl.get(element).indexOf(thisTempl),1);
				processInstanceId  = thisTempl.pI
				element.tokenCount[processInstanceId]--;
			}else{
				check = false;
			}
// 			console.log("--------------------------------");
// console.log(['msg', window.waitingMsg]);
// console.log(['templ', window.waitingTempl]);
// 			console.log("--------------------------------");
		}
		if(check){
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
			// remove token to each incoming message flow
			var incomingMessageFlows = element.incoming.filter(function(incoming) {
				return is(incoming, 'bpmn:MessageFlow');
			});
			incomingMessageFlows.forEach(function(incoming) {
				if (!messageTokenDistribution.get(incoming)) {
					messageTokenDistribution.set(incoming, 0);
				} else {
					var count = messageTokenDistribution.get(incoming) - 1;
					messageTokenDistribution.set(incoming, count);

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
		}
		};

		IntermediateCatchEventHandler.$inject = [ 'animation', 'eventBus',
		'elementRegistry' ];

		module.exports = IntermediateCatchEventHandler;
