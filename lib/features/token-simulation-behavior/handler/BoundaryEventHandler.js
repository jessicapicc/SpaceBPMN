'use strict';

var is = require('../../../util/ElementHelper').is;
var Scope = require('../../data/Scope');
var events = require('../../../util/EventHelper'), TERMINATE_EVENT = events.TERMINATE_EVENT, CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT, UPDATE_ELEMENT_EVENT = events.UPDATE_ELEMENT_EVENT, UPDATE_ELEMENTS_EVENT = events.UPDATE_ELEMENTS_EVENT;
var tokens = require('../TokenSimulationBehavior');

function BoundaryEventHandler(animation, eventBus, elementRegistry,
	processInstances) {
		this._animation = animation;
		this._eventBus = eventBus;
		this._elementRegistry = elementRegistry;
		this._processInstances = processInstances;
	};

	BoundaryEventHandler.prototype.consume = function(context) {
		var self = this;
		var element = context.element, processInstanceId = context.processInstanceId, parent = element.parent, parentProcessInstanceId = context.parentProcessInstanceId;
		var attachedTo = element.businessObject.attachedToRef;
		// remove token to each incoming sequence flow
		var incomingSequenceFlows = attachedTo.incoming.filter(function(incoming) {
			return is(self._elementRegistry.get(incoming.id), 'bpmn:SequenceFlow');
		});
		var hasToken = false;
		var tokenMap = window.tokenDistribution;
		var pI;
		tokenMap.forEach(function(value, key) {
			var tokenDistribution = tokenMap.get(key);
			incomingSequenceFlows.forEach(function(inc) {
				var incoming = self._elementRegistry.get(inc.id)
				if(!hasToken){
					if (!tokenDistribution.get(incoming)) {
						tokenDistribution.set(incoming, 0);
					} else {
						var count = tokenDistribution.get(incoming);
						if(count>0){
							hasToken = true;
							count--;
							tokenDistribution.set(incoming, count);
							pI = key;
						}
					}}
				});
			});
			if(hasToken){
				var tokCount =  self._elementRegistry.get(attachedTo.id).tokenCount;
				if (!tokCount) {
					tokCount = {};
				}
				if (!tokCount[pI]) {
					tokCount[pI] = 0;
				}else {
					tokCount[pI]--;
				}
				// var insS = this._processInstances.getProcessInstances();
				// for(var i = 0; i< insS.length; i++){
				// 	if(insS[i].parentProcessInstanceId === processInstanceId){
				// 		this._processInstances.finish(insS[i].processInstanceId);
				// 	}
				// }
				this._eventBus.fire(TERMINATE_EVENT, context);

				self._eventBus.fire(GENERATE_TOKEN_EVENT, {
					element : element,
					processInstanceId : pI,
					attachedTo : attachedTo
				});
			}else{
				console.log("No token available!")
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
		BoundaryEventHandler.prototype.generate = function(context) {
			var self = this;

			var element = context.element, parentProcessInstanceId = context.parentProcessInstanceId,
			pI = context.processInstanceId, attachedTo = context.attachedTo;

			// add token to each outgoing sequence flow
			var tokenDistribution = window.tokenDistribution.get(pI);
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
			outgoingSequenceFlows.forEach(function(connection) {
				self._animation.createAnimation(connection, pI,
					function() {
						self._eventBus.fire(CONSUME_TOKEN_EVENT, {
							element : connection.target,
							processInstanceId : pI
						});
					});
				});
				this._eventBus.fire(UPDATE_ELEMENT_EVENT, {
					element: element
				});
			};

			BoundaryEventHandler.$inject = [ 'animation', 'eventBus', 'elementRegistry',
			'processInstances' ];

			module.exports = BoundaryEventHandler;
