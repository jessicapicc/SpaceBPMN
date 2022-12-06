window.multiInstancePool = new Map();
window.instanceScope = new Map();
window.pendingMessages = new Map();
window.tokenDistribution = new Map();
window.messageTokenDistribution = new Map();
window.eventBasedRaceCondition = new Map();
window.activitySemafor = new Map();
window.waitingMsg = new Map();
window.waitingTempl =  new Map();

'use strict';

var is = require('../../util/ElementHelper').is;

var scopes = require('../data/Scope');
var BoundaryEventHandler = require('./handler/BoundaryEventHandler'), DataObjectHandler = require('./handler/DataObjectHandler'), EndEventHandler = require('./handler/EndEventHandler'), EventBasedGatewayHandler = require('./handler/EventBasedGatewayHandler'), ExclusiveGatewayHandler = require('./handler/ExclusiveGatewayHandler'), InclusiveGatewayHandler = require('./handler/InclusiveGatewayHandler'), IntermediateCatchEventHandler = require('./handler/IntermediateCatchEventHandler'), IntermediateThrowEventHandler = require('./handler/IntermediateThrowEventHandler'), ParallelGatewayHandler = require('./handler/ParallelGatewayHandler'), StartEventHandler = require('./handler/StartEventHandler'), SubProcessHandler = require('./handler/SubProcessHandler'), TaskHandler = require('./handler/TaskHandler'), MITaskHandler = require('./handler/MITaskHandler');

var events = require('../../util/EventHelper'),SHOW_INSTANCE_DATA = events.SHOW_INSTANCE_DATA, DATA_UPDATE_EVENT = events.DATA_UPDATE_EVENT,   TERMINATE_EVENT = events.TERMINATE_EVENT, RESET_SIMULATION_EVENT = events.RESET_SIMULATION_EVENT, INTERMEDIATE_TOKEN_EVENT = events.INTERMEDIATE_TOKEN_EVENT, GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT, GENERATE_MESSAGE_TOKEN_EVENT = events.GENERATE_MESSAGE_TOKEN_EVENT, CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, CONSUME_MESSAGE_TOKEN_EVENT = events.CONSUME_MESSAGE_TOKEN_EVENT, TOGGLE_MODE_EVENT = events.TOGGLE_MODE_EVENT;
var Data = require('../data/Data')

var toggleMode = require('../toggle-mode/modeler/ToggleMode');

function TokenSimulationBehavior(eventBus, animation, injector, dataPanel, processInstances) {
	console.log(eventBus);
	var self = this;
	this._dataPanel = dataPanel;
	this._injector = injector;
	this.handlers = {};
	this._processInstances = processInstances;
	this.registerHandler('bpmn:BoundaryEvent', BoundaryEventHandler);
	this.registerHandler('bpmn:DataObjectReference',  DataObjectHandler);
	this.registerHandler('bpmn:EndEvent',  EndEventHandler);
	this.registerHandler('bpmn:EventBasedGateway',  EventBasedGatewayHandler);
	this.registerHandler('bpmn:ExclusiveGateway', ExclusiveGatewayHandler);
	this.registerHandler('bpmn:InclusiveGateway',  InclusiveGatewayHandler);
	this.registerHandler([ 'bpmn:IntermediateCatchEvent', 'bpmn:ReceiveTask' ],
	IntermediateCatchEventHandler);
	this.registerHandler([ 'bpmn:IntermediateThrowEvent', 'bpmn:SendTask' ],
	IntermediateThrowEventHandler);
	this.registerHandler('bpmn:ParallelGateway',  ParallelGatewayHandler);
	this.registerHandler('bpmn:StartEvent',  StartEventHandler);
	this.registerHandler('bpmn:SubProcess',  SubProcessHandler);
	this.registerHandler([ 'bpmn:BusinessRuleTask', 'bpmn:Task',
	'bpmn:ManualTask', 'bpmn:ScriptTask', 'bpmn:ServiceTask',
	'bpmn:UserTask' ], TaskHandler);
	this.registerHandler([ 'mida:MiTask'], MITaskHandler);
	// create animations on generate token
	eventBus.on(GENERATE_TOKEN_EVENT, function(context) {
		var element = context.element;
		var marker = null;
		if (is(element, [ 'bpmn:BusinessRuleTask', 'bpmn:Task',
		'bpmn:ManualTask', 'bpmn:ScriptTask', 'bpmn:ServiceTask',
		'bpmn:UserTask' ]) && element.businessObject.loopCharacteristics) {
			self.handlers['mida:MiTask'].generate(context);
		} else {
			if (!self.handlers[element.type]) {
				throw new Error('no handler for type ' + element.type);
			}
			// Call the handler for the specific element type
			try{
				self.handlers[element.type].intermediate(context)
			}catch(e){
				self.handlers[element.type].generate(context)
			}
		}
	});
	// create animations on generate token
	eventBus.on(INTERMEDIATE_TOKEN_EVENT, function(context) {
		var element = context.element;
		var marker = null;
		if (is(element, [ 'bpmn:BusinessRuleTask', 'bpmn:Task',
		'bpmn:ManualTask', 'bpmn:ScriptTask', 'bpmn:ServiceTask',
		'bpmn:UserTask' ]) && element.businessObject.loopCharacteristics) {
			self.handlers['mida:MiTask'].generate(context);
		} else {
			if (!self.handlers[element.type]) {
				throw new Error('no handler for type ' + element.type);
			}
			// Call the handler for the specific element type
			self.handlers[element.type].generate(context);
		}
	});

	// call handler on consume token
	eventBus.on(CONSUME_TOKEN_EVENT, function(context) {
		var element = context.element;
		var marker = null;
		if (is(element, [ 'bpmn:BusinessRuleTask', 'bpmn:Task',
		'bpmn:ManualTask', 'bpmn:ScriptTask', 'bpmn:ServiceTask',
		'bpmn:UserTask' ]) && element.businessObject.loopCharacteristics) {
			self.handlers['mida:MiTask'].consume(context);
		} else {
			if (!self.handlers[element.type]) {
				throw new Error('no handler for type ' + element.type);
			}
			// Call the handler for the specific element type
			self.handlers[element.type].consume(context);
		}
		var processInstancesWithParent = self._processInstances.getProcessInstances(undefined);
    eventBus.fire(SHOW_INSTANCE_DATA, {
      processInstancesWithParent : processInstancesWithParent
    });
	});
	//
	eventBus.on(RESET_SIMULATION_EVENT, function(context) {
		window.multiInstancePool = new Map();
		window.instanceScope = new Map();
		window.pendingMessages = new Map();
		window.tokenDistribution = new Map();
		window.messageTokenDistribution = new Map();
		window.eventBasedRaceCondition = new Map();
		window.activitySemafor = new Map();
		window.waitingMsg = new Map();
		window.waitingTempl =  new Map();
		var xml = modeler.get('canvas').getRootElement().businessObject.$parent;
		loadDiagram(xml);
		document.getElementById('data-perspective').innerHTML = "";
		document.getElementById('process-instances').innerHTML = "";
	});
	eventBus.on(TERMINATE_EVENT, function(context) {
		// var xml = modeler.get('canvas').getRootElement().businessObject.$parent;
		// loadDiagram(xml);
		// document.getElementById('data-perspective').innerHTML = "";
		// document.getElementById('process-instances').innerHTML = "";
	});
	eventBus.on(SHOW_INSTANCE_DATA, function(context) {
		self._dataPanel.dataMode(context.processInstancesWithParent, window.instanceScope)
	});
	eventBus.on(TOGGLE_MODE_EVENT, function(context) {
		window.instanceScope.set('_global_', Data.evaluateDataStores())
	});


}

TokenSimulationBehavior.prototype.registerHandler = function(types , handlerCls) {
	var self = this;

	var handler = this._injector.instantiate(handlerCls);


	if (!Array.isArray(types)) {
		types = [ types ];
	}

	types.forEach(function(type) {
		self.handlers[type] = handler;
	});
};

TokenSimulationBehavior.$inject = [ 'eventBus', 'animation', 'injector', 'dataPanel', 'processInstances' ];
module.exports = TokenSimulationBehavior;
