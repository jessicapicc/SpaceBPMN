
import {
  is
} from 'bpmn-js/lib/util/ModelUtil';
import eventDefinitionHelper from 'bpmn-js-properties-panel/lib/helper/EventDefinitionHelper';
var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;
var midaFactory = require('./implementation/MidaEntryFactory');


export default function (group, element, translate, elementRegistry)
{
  // Id
  if (is(element, 'bpmn:DataObjectReference'))
  {

    group.entries.push(midaFactory.datainout(
    {
      id : 'dataobjtype',
      label : 'Input/Output',
      modelProperty : 'dataobjtype',
      selectOptions: [
      	  {value:"none",name:"None"},{value:"input",name:"Input"},{value:"output",name:"Output"}
      	],
        emptyParameter: false
    }));
  }
}
