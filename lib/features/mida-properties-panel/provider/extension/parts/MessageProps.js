'use strict';


var field = require('./implementation/Field'),
    elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    eventDefinitionHelper = require('bpmn-js-properties-panel/lib/helper/EventDefinitionHelper'),
    is = require('bpmn-js/lib/util/ModelUtil').is;


module.exports = function(group, element, bpmnFactory, translate) {

  var messageEventDefinition = eventDefinitionHelper.getMessageEventDefinition(element);

  var fieldEntry = field(element, bpmnFactory, {
    id: 'message',
    modelProperties: [ 'field', 'isCorrelation' ],
    labels: [ translate('Fields'), translate('Correlation') ],

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
    if (is(element, 'bpmn:ReceiveTask'))
    {
      group.entries.push(fieldEntry);
    }
    if ((is(element, 'bpmn:StartEvent') || is(element, 'bpmn:IntermediateCatchEvent') ) && messageEventDefinition)
    {
      group.entries.push(fieldEntry);
    }
  }

};
