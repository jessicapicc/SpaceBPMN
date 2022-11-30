'use strict';

var is = require('../../../util/ElementHelper').is;
var Data = require('../../data/Data');
var Scope = require('../../data/Scope');
var events = require('../../../util/EventHelper'), SYNTAX_VIOLATION_EVENT = events.SYNTAX_VIOLATION_EVENT, CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT, GUARD_VIOLATION_EVENT = events.GUARD_VIOLATION_EVENT;
var tokens = require('../TokenSimulationBehavior');
var violations = require('../../violations-notification/ViolationNotification');
var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

var busy = false;

function MITaskHandler(animation, eventBus, violationsNotification) {
	this._animation = animation;
	this._eventBus = eventBus;
	this._violationsNotification = violationsNotification;
};


MITaskHandler.prototype.consume = function(context) {
//	if(busy && (getBusinessObject(element).tasktype === 'na_nc' || getBusinessObject(element).tasktype === 'a')){this._eventBus.fire(CONSUME_TOKEN_EVENT, context);} else {busy = true}
	var self = this;
	var element = context.element, processInstanceId = context.processInstanceId;
	var scope = window.instanceScope.get(processInstanceId);
	var isSequential, loopCardinality, completionCondition;
	if (element.businessObject.loopCharacteristics) {
		isSequential = element.businessObject.loopCharacteristics
		.get('isSequential') || false;
		if (element.businessObject.loopCharacteristics.get('loopCardinality')) {
			loopCardinality = scope.eval(element.businessObject.loopCharacteristics.get(
				'loopCardinality').get('body'));
			}
		if (element.businessObject.loopCharacteristics.get('completionCondition')) {
			completionCondition = scope.eval(element.businessObject.loopCharacteristics.get(
				'completionCondition').get('body'));
			}
		}
		var guard = true;
		for(var i = 0; i<loopCardinality; i++){
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
					}else {
						guard = false;
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

			if(completionCondition && Data.evaluateCondition(scope, completionCondition)){
				i = completionCondition;
			}
		}//for
		if(guard){
			// execute elemnt
			if(isSequential){
				this.generate(context)
			} else {
				this._eventBus.fire(GENERATE_TOKEN_EVENT, context);
			}
		}else{
			//Call violation notification
			this._eventBus.fire(GUARD_VIOLATION_EVENT, {
				element : element,
				processInstanceId : processInstanceId
			});
		}
	};

	MITaskHandler.prototype.generate = function(context) {
		var self = this;
		var element = context.element, processInstanceId = context.processInstanceId;
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
			busy = false;
			//Animate outgoing token
			self._animation.createAnimation(outgoing, processInstanceId,
				function() {
					self._eventBus.fire(CONSUME_TOKEN_EVENT, {
						element : outgoing.target,
						processInstanceId : processInstanceId
					});
				});
			});

		};

		MITaskHandler.$inject = [ 'animation', 'eventBus' ];

		module.exports = MITaskHandler;
