import inherits from 'inherits';

import PropertiesActivator from 'bpmn-js-properties-panel/lib/PropertiesActivator';

// Require all properties you need from existing providers.
// In this case all available bpmn relevant properties without camunda extensions.
import processProps from 'bpmn-js-properties-panel/lib/provider/bpmn/parts/ProcessProps';
import eventProps from 'bpmn-js-properties-panel/lib/provider/bpmn/parts/EventProps';
import linkProps from 'bpmn-js-properties-panel/lib/provider/bpmn/parts/LinkProps';
import documentationProps from 'bpmn-js-properties-panel/lib/provider/bpmn/parts/DocumentationProps';
import idProps from 'bpmn-js-properties-panel/lib/provider/bpmn/parts/IdProps';
import nameProps from 'bpmn-js-properties-panel/lib/provider/bpmn/parts/NameProps';
import multiInstanceProps from 'bpmn-js-properties-panel/lib/provider/camunda/parts/MultiInstanceLoopProps';
// Require your custom property entries.
import messagesProps from './parts/MessageProps';
import messageExpProps from './parts/MessageExpProps';
import guardProps from './parts/GuardProps';
import assignProps from './parts/AssignmentsProps';
//import dataInputProps from './parts/dataInputProps';
import dataObjFields from './parts/DataObjFieldsProps';
import taskTypeProps from './parts/TaskTypeProps';
import dataObjTypeProps from './parts/DataObjTypeProps';
import participantMultiplicityProps from './parts/ParticipantMultiplicityProps';
import conditionalProps from './parts/ConditionalProps';



// The general tab contains all bpmn relevant properties.
// The properties are organized in groups.
function createGeneralTabGroups(element, bpmnFactory, elementRegistry, translate)
{
  var generalGroup = {
    id: 'general',
    label: 'General',
    entries: []
  };
  idProps(generalGroup, element, translate);
  nameProps(generalGroup, element, translate);
  processProps(generalGroup, element, translate);
  var midaGroup = {
    id: 'mida',
    label: translate('MIDA'),
    entries: []
  };
  taskTypeProps(midaGroup, element, translate, bpmnFactory);
  guardProps(midaGroup, element, translate, bpmnFactory);
  assignProps(midaGroup, element, bpmnFactory, translate);
  messagesProps(midaGroup, element, bpmnFactory, translate);
  messageExpProps(midaGroup, element, bpmnFactory, translate);
  dataObjTypeProps(midaGroup, element, bpmnFactory, translate);
//  dataInputProps(midaGroup, element, bpmnFactory, translate)
  dataObjFields(midaGroup, element,bpmnFactory, translate);
  conditionalProps(midaGroup, element, bpmnFactory, translate);
  multiInstanceProps(midaGroup, element, bpmnFactory, translate);
  participantMultiplicityProps(midaGroup, element, bpmnFactory, translate);
  // var multiInstanceGroup = {
  //   id: 'multiInstance',
  //   label: translate('Multi Instance'),
  //   entries: []
  // };
  //
  // multiInstanceProps(multiInstanceGroup, element, bpmnFactory, translate);

  return[
    generalGroup,
    midaGroup
      // multiInstanceGroup
  ];
}




export default function MidaPropertiesProvider (eventBus, bpmnFactory, elementRegistry, translate)
{
    PropertiesActivator.call(this, eventBus);
    this.getTabs = function (element)
    {
      var generalTab = {
        id: 'general',
        label: 'General',
        groups: createGeneralTabGroups(element, bpmnFactory, elementRegistry, translate)
      };

      // Show general + custom tabs
      return [
        generalTab
      ];
    };
}


inherits(MidaPropertiesProvider, PropertiesActivator);
