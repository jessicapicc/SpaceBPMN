'use strict';
import eventDefinitionHelper from 'bpmn-js-properties-panel/lib/helper/EventDefinitionHelper';
var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;
var midaFactory = require('./implementation/MidaEntryFactory');
var domQuery = require('min-dom').query,
cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
is = require('bpmn-js/lib/util/ModelUtil').is;



export default function (group, element, translate, bpmnFactory)
{
  var getEl = function(element){
    var bo = getBusinessObject(element);
    var extEl = bo.extensionElements;

    if(!extEl){
      extEl = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
      bo.extensionElements = extEl
    }
    var guardEl;
    extEl.values.forEach(function(val) {
      if(is(val, 'mida:TaskType')){
        guardEl = val;
        return
      }
    });
    if(!guardEl){
      guardEl = elementHelper.createElement('mida:TaskType', {type: 'a'}, extEl, bpmnFactory);
      extEl.values.push(guardEl)
    }
    if (!(guardEl)) {
      return;
    }
    return guardEl
  };
  // Id
  if (is(element, 'bpmn:Task'))
  {

    group.entries.push(midaFactory.taskselect(
    {
      id : 'type',
      label : 'Task type',
      modelProperty : 'type',
      selectOptions: [
      	  {value:"a",name:"Atomic"},{value:"na_c",name:"Not Atomic Concurrent"},{value:"na_nc",name:"Not Atomic Not Concurrent"}
      	],
        emptyParameter: false,
        get: function(element) {
          var guardEl = getEl(element)
          return {type : guardEl.type};
        },
        set: function(element, values, containerElement) {
          var guardEl = getEl(element)
          guardEl.type = values.type
          modeler.get('modeling').updateProperties(element, {
            name : getBusinessObject(element).name
          });
        },
    }));
  }
}
