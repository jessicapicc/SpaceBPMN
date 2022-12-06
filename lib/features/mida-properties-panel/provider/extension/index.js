import MidaPropertiesProvider from './MidaPropertiesProvider';

/*
import elementTemplates from 'c:/Node/bpmn-js-examples-master-stucksimon/properties-panel/node_modules/bpmn-js-properties-panel/lib/provider/camunda/element-templates/index';
import translate from 'c:/Node/bpmn-js-examples-master-stucksimon/properties-panel/node_modules/diagram-js/lib/i18n/translate/index';
*/

export default
{
  __init__: [ 'propertiesProvider' ],
  propertiesProvider: [ 'type', MidaPropertiesProvider ]

};
