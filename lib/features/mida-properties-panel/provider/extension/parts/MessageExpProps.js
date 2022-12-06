'use strict';

//var messages = require('bpmn-js-properties-panel/lib/provider/camunda/parts/implementation/Properties'),
var field = require('./implementation/ExpField'),
    elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    eventDefinitionHelper = require('bpmn-js-properties-panel/lib/helper/EventDefinitionHelper'),
    is = require('bpmn-js/lib/util/ModelUtil').is;


module.exports = function(group, element, bpmnFactory, translate) {

  var messageEventDefinition = eventDefinitionHelper.getMessageEventDefinition(element);

  var fieldEntry = field(element, bpmnFactory, {
    id: 'message',
    modelProperties: [ 'field'],
    labels: [ translate('Fields')],

    getParent: function(element, node, bo) {
      return bo.extensionElements;
    },

    createParent: function(element, bo) {
      var parent = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
      var cmd = cmdHelper.updateBusinessObject(element, bo, { extensionElements: parent });
      return {
        cmd: cmd,
        parent: parent
      };
    }
  }, translate);

  if (fieldEntry)
  {
    if (is(element, 'bpmn:SendTask') || (is(element, 'bpmn:EndEvent') && eventDefinitionHelper.getMessageEventDefinition(element)))
    {
      group.entries.push(fieldEntry);
    }
    if ( is(element, 'bpmn:IntermediateThrowEvent') && messageEventDefinition)
    {
      group.entries.push(fieldEntry);
    }
  }

};
