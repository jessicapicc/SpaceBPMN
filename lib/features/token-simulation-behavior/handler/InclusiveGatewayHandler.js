'use strict';

var is = require('../../../util/ElementHelper').is;
var events = require('../../../util/EventHelper'), GATEWAY_VIOLATION_EVENT = events.GATEWAY_VIOLATION_EVENT, SYNTAX_VIOLATION_EVENT = events.SYNTAX_VIOLATION_EVENT, CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT;

var tokens = require('../TokenSimulationBehavior');
var dataStructure = require('../../data/Data');

function InclusiveGatewayHandler(eventBus, animation, elementRegistry) {
	this._eventBus = eventBus;
	this._animation = animation;
	this._elementRegistry = elementRegistry;
};


function isActiveOrJoin(tokenDistribution, orjoin, sfWithToken){

	for (var i = 0; i < sfWithToken.length; i++) {
		if (hasPathToOrJoin(tokenDistribution, sfWithToken[i], sfWithToken[i].target, orjoin, false, [])){
			if (hasPathToOrJoin(tokenDistribution, sfWithToken[i], sfWithToken[i].target, orjoin, true, [])){
				continue;
			}else {
				return false;
			}
		}
	}
	return true;
};

function hasPathToOrJoin(tokenDistribution, lastSf, current, orjoin, withToken, visited){
	console.log([tokenDistribution, lastSf, current, orjoin, withToken, visited]);

	if(!current){ //the process if finished
		return false;
	} else if (current === orjoin){
		if(!tokenDistribution.get(lastSf)){
			tokenDistribution.set(lastSf, 0);
		}
		if((tokenDistribution.get(lastSf) > 0 && withToken) || (tokenDistribution.get(lastSf) < 1 && !withToken)){
			return true;
		}else {
			return false;
		}
	} else {
		if(visited.includes(current)){ 
			return false;
		}
		visited.push(current);
		for(var i = 0 ; i < current.outgoing.length ; i++){
			if(hasPathToOrJoin(tokenDistribution, current.outgoing[i], current.outgoing[i].target, orjoin, withToken, visited)){
				return true;
			}
		}
		return false;
	}
};

InclusiveGatewayHandler.prototype.consume = function(context) {
	var element = context.element, processInstanceId = context.processInstanceId;
	if (!element.tokenCount) {
		element.tokenCount = {};
	}
	if (!element.tokenCount[processInstanceId]) {
		element.tokenCount[processInstanceId] = 0;
	}
	element.tokenCount[processInstanceId]++;
	this._eventBus.fire(GENERATE_TOKEN_EVENT, context);
};

InclusiveGatewayHandler.prototype.generate = function(context) {
	var element = context.element, processInstanceId = context.processInstanceId;
	var scope = window.instanceScope.get(processInstanceId);
	var self = this;
	var incomingSequenceFlows = element.incoming.filter(function(incoming) {
		return is(incoming, 'bpmn:SequenceFlow');
	});
	var outgoingSequenceFlows = element.outgoing.filter(function(outgoing) {
		return is(outgoing, 'bpmn:SequenceFlow');
	});

	var isDeadToken = true;
	var tokenDistribution = window.tokenDistribution.get(processInstanceId);
	var isSplit = Object.keys(outgoingSequenceFlows).length > 1;

	if(isSplit){
		try{
			outgoingSequenceFlows.forEach(function(outgoing) {
				if ((outgoing.businessObject.conditionExpression &&	dataStructure.evaluateCondition(outgoing.businessObject.conditionExpression.body, scope))) {
						// remove token to each incoming sequence flow
						incomingSequenceFlows.forEach(function(incoming) {
							if (!tokenDistribution.get(incoming)) {
								tokenDistribution.set(incoming, 0);
							} else {
								var count = tokenDistribution.get(incoming)-1;
								tokenDistribution.set(incoming, count);

							}
						});
					// add token to each outgoing sequence flow
					if (!tokenDistribution.get(outgoing)) {
						tokenDistribution.set(outgoing, 1);
					} else {
						var count = tokenDistribution.get(outgoing);
						tokenDistribution.set(outgoing, count++);
					}

					element.tokenCount[processInstanceId]=0;
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
		}catch (e) {
			this._eventBus.fire(SYNTAX_VIOLATION_EVENT, {
				element : element,
				processInstanceId : processInstanceId,
				error : e
			});
			return;
		}
	}else {//Element is an OR-Join

		isDeadToken = false;
		try{
			var elWithToken = [];
			for (const [key, value] of tokenDistribution.entries()) {
				if(value > 0 && !incomingSequenceFlows.includes(key)){
					elWithToken.push(key);
				}
			}

			var isActive = isActiveOrJoin(tokenDistribution, element, elWithToken);
			alert(isActive);
			if(!isActive){
				//DO NOTHING
			}else{
				// remove token to each incoming sequence flow
				incomingSequenceFlows.forEach(function(incoming) {
					if (!tokenDistribution.get(incoming)) {
						tokenDistribution.set(incoming, 0);
					} else {
						var count = tokenDistribution.get(incoming)-1;
						tokenDistribution.set(incoming, count);

					}
				});
				outgoingSequenceFlows.forEach(function(outgoing) {
				// add token to each outgoing sequence flow
				if (!tokenDistribution.get(outgoing)) {
					tokenDistribution.set(outgoing, 1);
				} else {
					var count = tokenDistribution.get(outgoing);
					tokenDistribution.set(outgoing, count++);
				}
				element.tokenCount[processInstanceId]=0;
				self._animation.createAnimation(outgoing, processInstanceId, function() {
						self._eventBus.fire(CONSUME_TOKEN_EVENT, {
							element : outgoing.target,
							processInstanceId : processInstanceId
						});
					});
					return true;
				});
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

					element.tokenCount[processInstanceId]--;
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

InclusiveGatewayHandler.$inject = [ 'eventBus', 'animation', 'elementRegistry' ];
module.exports = InclusiveGatewayHandler;
