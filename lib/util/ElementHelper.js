'use strict';

var every = require('lodash/every'),
    some = require('lodash/some');

module.exports.is = function(element, types) {
  if (element.type === 'label') {
    return;
  }

  if (!Array.isArray(types)) {
    types = [ types ];
  }

  var isType = false;

  types.forEach(function(type) {
    if (type === element.type) {
      isType = true;
    }
  });

  return isType;
};

module.exports.isTypedEvent = function(event, eventDefinitionType, filter) {

  function matches(definition, filter) {
    return every(filter, function(val, key) {

      // we want a == conversion here, to be able to catch
      // undefined == false and friends
      return definition[key] == val;
    });
  }

  return some(event.eventDefinitions, function(definition) {
    return definition.$type === eventDefinitionType && matches(event, filter);
  });
};

module.exports.getBusinessObject = function(element) {
  return (element && element.businessObject) || element;
};

module.exports.getMidaEl = function(element, el, type){
	var res;
	element.businessObject.extensionElements.values.forEach(function(val) {
		if(val.$type ===  'mida:'+el){
			res = val
		}
	});
  if(!res){return ''}
	return res[type] || ''
}

function isAncestor(ancestor, descendant) {
  var childParent = descendant.parent;

  while (childParent) {
    if (childParent === ancestor) {
      return true;
    }

    childParent = childParent.parent;
  }

  return false;
}

module.exports.isAncestor = isAncestor;

module.exports.getDescendants = function(elements, ancestor) {
  return elements.filter(function(element) {
    return isAncestor(ancestor, element);
  });
};

module.exports.supportedElements = [
  'bpmn:Association',
  'bpmn:BoundaryEvent',
  'bpmn:BusinessRuleTask',
  'bpmn:DataInputAssociation',
  'bpmn:DataOutputAssociation',
  'bpmn:DataObjectReference',
  'bpmn:DataStoreReference',
  'bpmn:EndEvent',
  'bpmn:EventBasedGateway',
  'bpmn:ExclusiveGateway',
  'bpmn:InclusiveGateway',
  'bpmn:IntermediateCatchEvent',
  'bpmn:IntermediateThrowEvent',
  'bpmn:Lane',
  'bpmn:ManualTask',
  'bpmn:MessageFlow',
  'bpmn:MessageStartEvent',
  'bpmn:Participant',
  'bpmn:ParallelGateway',
  'bpmn:Process',
  'bpmn:ReceiveTask',
  'bpmn:ScriptTask',
  'bpmn:SendTask',
  'bpmn:SequenceFlow',
  'bpmn:ServiceTask',
  'bpmn:StartEvent',
  'bpmn:StartMessageEvent',
  'bpmn:SubProcess',
  'bpmn:Task',
  'bpmn:TextAnnotation',
  'bpmn:UserTask'
];
