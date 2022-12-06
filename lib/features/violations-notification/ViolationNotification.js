'use strict';

var elementHelper = require('../../util/ElementHelper'), getBusinessObject = elementHelper.getBusinessObject, is = elementHelper.is;
var events = require('../../util/EventHelper'),
  TOGGLE_MODE_EVENT = events.TOGGLE_MODE_EVENT,
  CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT,
	GATEWAY_VIOLATION_EVENT = events.GATEWAY_VIOLATION_EVENT,
	GUARD_VIOLATION_EVENT = events.GUARD_VIOLATION_EVENT,
	SYNTAX_VIOLATION_EVENT = events.SYNTAX_VIOLATION_EVENT,
  MAXINSTANCE_VIOLATION_EVENT  =events.MAXINSTANCE_VIOLATION_EVENT,
  YES_PATTER_MATCHING_EVENT =events.YES_PATTER_MATCHING_EVENT,
  NO_PATTER_MATCHING_EVENT =events.NO_PATTER_MATCHING_EVENT;

function ViolationNotification(eventBus, animation, elementRegistry, log, elementNotifications,
		canvas, processInstances) {
			var self = this;
	this._animation = animation;
	this._elementRegistry = elementRegistry;
	this._log = log;
	this._elementNotifications = elementNotifications;
	this._canvas = canvas;
	this._processInstances = processInstances;
	this._eventBus = eventBus;

	this._eventBus.on(GUARD_VIOLATION_EVENT, function(context) {
		self.notifyGuardViolation(context.element, context.processInstanceId);
	});
	this._eventBus.on(SYNTAX_VIOLATION_EVENT, function(context) {
		self.notifySyntaxViolation(context.element, context.processInstanceId, context.error);
	});
	this._eventBus.on(GATEWAY_VIOLATION_EVENT, function(context) {
		self.notifyGatewayViolation(context.element, context.processInstanceId);
	});
  this._eventBus.on(MAXINSTANCE_VIOLATION_EVENT, function(context) {
		self.notifyMaxInstanceViolation(context.element);
	});
  this._eventBus.on(YES_PATTER_MATCHING_EVENT, function(context) {
		self.notifyPatternMatching(context.element, true);
	});
  this._eventBus.on(NO_PATTER_MATCHING_EVENT, function(context) {
		self.notifyPatternMatching(context.element,false);
	});
}
ViolationNotification.prototype.notifyPatternMatching = function(element, match){
  var name = element.businessObject.name;
  if(match){
    this._log.log('Message received by '+ name + ' match!', 'success', 'fa-check-circle' );
  }else{
  	this._log.log('Message received by '+ name + ' does not match!',  'warning', 'fa-warning');
  }

      this._elementNotifications.addElementNotification(element, {
  		type: match ? 'success' : 'warning',
  		icon: match ? 'fa-check-circle' : 'fa-warning',
  		text: match ? 'Match' : 'No Match',
  		});
      var modeling = modeler.get('modeling');
  		modeling.setColor([element], {
    		stroke: match ? 'green' : 'red',
    		fill: match ? '#00800029' : '#ffa5a5'
  		});
      setTimeout(function() {modeling.setColor([element], {stroke: 'black',fill: 'white'});}, 2000);

}
ViolationNotification.prototype.notifyMaxInstanceViolation = function(element){
  var name = element.businessObject.name;
	this._log.log('Pool ' + name + ' has reached the maximum number of active instances!', 'warning', 'fa-exclamation-circle');

	this._elementNotifications.addElementNotification(element, {
		type: 'warning',
		icon: 'fa-exclamation-circle',
		text: 'Pool ' + name + ' has reached the maximum number of active instances!',
		});
}
ViolationNotification.prototype.notifyGuardViolation = function(element, processInstanceId){
	this._log.log('Instance ' + processInstanceId + ' violates activity guard!', 'warning', 'fa-exclamation-circle');

	this._elementNotifications.addElementNotification(element, {
		type: 'warning',
		icon: 'fa-exclamation-circle',
		text: 'Instance ' + processInstanceId + ' violates activity guard!',
		});

		//ELEMENT COLOR FOR GUARD VIOLATION
		var modeling = modeler.get('modeling');
		modeling.setColor([element], {
  		stroke: 'red',
  		fill: '#ffa5a5'
		});
}

ViolationNotification.prototype.notifySyntaxViolation = function(element, processInstanceId, error){
	this._log.log('Instance ' + processInstanceId + ' syntax error!', 'warning', 'fa-exclamation-circle');
this._log.log(error);
	this._elementNotifications.addElementNotification(element, {
		type: 'warning',
		icon: 'fa-exclamation-circle',
		text: 'Instance ' + processInstanceId + ' syntax error!',
		});

		//ELEMENT COLOR FOR GUARD VIOLATION
		var modeling = modeler.get('modeling');
		modeling.setColor([element], {
  		stroke: 'red',
  		fill: '#ffa5a5'
		});
}

ViolationNotification.prototype.notifyGatewayViolation = function(element, processInstanceId){
	this._log.log('Instance ' + processInstanceId + ' no true or default condition!', 'warning', 'fa-exclamation-circle');

	this._elementNotifications.addElementNotification(element, {
		type: 'warning',
		icon: 'fa-exclamation-circle',
		text: 'Instance ' + processInstanceId + ' no true or default condition!',
		});

		//ELEMENT COLOR FOR GUARD VIOLATION
		var modeling = modeler.get('modeling');
		modeling.setColor([element], {
  		stroke: 'red',
  		fill: '#ffa5a5'
		});
}





ViolationNotification.$inject = [ 'eventBus', 'animation', 'elementRegistry', 'log',
		'elementNotifications', 'canvas', 'processInstances' ];

module.exports = ViolationNotification;
