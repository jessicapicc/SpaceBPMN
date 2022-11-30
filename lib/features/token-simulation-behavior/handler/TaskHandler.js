'use strict';


var Data = require('../../data/Data');
var Scope = require('../../data/Scope');
var events = require('../../../util/EventHelper'), SYNTAX_VIOLATION_EVENT = events.SYNTAX_VIOLATION_EVENT, CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT, GUARD_VIOLATION_EVENT = events.GUARD_VIOLATION_EVENT;
var tokens = require('../TokenSimulationBehavior');
var violations = require('../../violations-notification/ViolationNotification');
var elementHelper = require('../../../util/ElementHelper'), getBusinessObject = elementHelper.getBusinessObject, is = elementHelper.is, getMidaEl = elementHelper.getMidaEl;


function TaskHandler(animation, eventBus, violationsNotification) {
	this._animation = animation;
	this._eventBus = eventBus;
	this._violationsNotification = violationsNotification;
};


TaskHandler.prototype.consume = function(context) {
	var self = this;
	var element = context.element, processInstanceId = context.processInstanceId;
	var scope = window.instanceScope.get(processInstanceId);
	if(!window.activitySemafor.get(processInstanceId)){
		window.activitySemafor.set(processInstanceId, false)
	}
	if(window.activitySemafor.get(processInstanceId) && (getBusinessObject(element).tasktype === 'na_nc' || getBusinessObject(element).tasktype === 'a')){
		this._eventBus.fire(CONSUME_TOKEN_EVENT, context);
	}
	else {
		window.activitySemafor.set(processInstanceId, true)
	}
	// START Manage Data Object if exists
	var incomingDataAssociations = element.incoming.filter(function(incoming) {
		return is(incoming, 'bpmn:DataInputAssociation');
	});
	var outgoingDataAssociations = element.outgoing.filter(function(outgoing) {
		return is(outgoing, 'bpmn:DataOutputAssociation');
	});
	var guard = true;
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
	if(guard){
		var delay = Math.floor(Math.random() * 100);
		var taskType = getMidaEl(element, 'TaskType', 'type')
		// execute elemnt
		if(taskType === 'na_nc'){//NANC
			setTimeout(function(){
  			self._eventBus.fire(GENERATE_TOKEN_EVENT, context);
			}, delay);
		}else if (taskType === 'na_c'){//NAC
			setTimeout(function(){
  			self._eventBus.fire(GENERATE_TOKEN_EVENT, context);
			}, delay);
		} else {//A
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

TaskHandler.prototype.generate = function(context) { 
	var self = this;
	var element = context.element, processInstanceId = context.processInstanceId;
	var tokenDistribution = window.tokenDistribution.get(processInstanceId);
var scope = window.instanceScope.get(processInstanceId);
	Data.evaluateAssignments(element, scope);
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
	window.activitySemafor.set(processInstanceId, false)
	outgoingSequenceFlows.forEach(function(outgoing) {
		if (!tokenDistribution.get(outgoing)) {
			tokenDistribution.set(outgoing, 1);
		} else {
			var count = tokenDistribution.get(outgoing);
			tokenDistribution.set(outgoing, count++);
		}
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

	TaskHandler.$inject = [ 'animation', 'eventBus' ];

	module.exports = TaskHandler;
