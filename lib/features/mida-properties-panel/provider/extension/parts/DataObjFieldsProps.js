'use strict';

//var messages = require('bpmn-js-properties-panel/lib/provider/camunda/parts/implementation/Properties'),
var field = require('./implementation/DataObjField'),
    elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    eventDefinitionHelper = require('bpmn-js-properties-panel/lib/helper/EventDefinitionHelper'),
    is = require('bpmn-js/lib/util/ModelUtil').is;
    var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;
    var entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory');
    var midaFactory = require('./implementation/MidaEntryFactory');

module.exports = function(group, element, bpmnFactory, translate) {

  var messageEventDefinition = eventDefinitionHelper.getMessageEventDefinition(element);

  var fieldEntry = field(element, bpmnFactory, {
    id: 'data_obj_fields',
    modelProperties: [ 'dataField'],
    labels: [ translate('Data Fields')],

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

  if (fieldEntry){
    if(is(element, 'bpmn:DataObjectReference')){
      group.entries.push(midaFactory.collectionbox(
      {
        id : 'collection',
        label : 'Is Collection?',
        modelProperty : 'isCollection'
      }));
      // if(getBusinessObject(element).get('dataObjectRef').isCollection){
      //   // group.entries.push(entryFactory.textBox({
      //   //   id: 'cardinality',
      //   //   label: translate('Cardinality'),
      //   //   modelProperty: 'cardinality'
      //   // }));
      // }
    }
    if (is(element, 'bpmn:DataObjectReference') || is(element, 'bpmn:DataStoreReference'))
    {
        group.entries.push(fieldEntry);
      }
  }
};
