'use strict';


var entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory'),
    elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    eventDefinitionHelper = require('bpmn-js-properties-panel/lib/helper/EventDefinitionHelper'),
    is = require('bpmn-js/lib/util/ModelUtil').is;
var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;


    module.exports = function(group, element, bpmnFactory, translate) {

      var getMax = function(businessObject) {
        return function(element) {
          var participantMultiplicity = businessObject && businessObject.get('participantMultiplicity'),
              maximum = (participantMultiplicity && participantMultiplicity.maximum) ? participantMultiplicity.maximum : '';

          return {maximum : maximum};
        };
      };
      var getMin = function(businessObject) {
        return function(element) {
          var participantMultiplicity = businessObject && businessObject.get('participantMultiplicity'),
              minimum = (participantMultiplicity && participantMultiplicity.minimum) ? participantMultiplicity.minimum : '';

          return {minimum : minimum};
        };
      };

      var setMin = function(businessObject) {
        return function(element, values) {
          var newMin = values.minimum
          if(parseInt(newMin) < 0) return;

          var participantMultiplicity = businessObject.get('participantMultiplicity');
          if(!participantMultiplicity){
            businessObject.participantMultiplicity = bpmnFactory.create('bpmn:ParticipantMultiplicity', {
              minimum: newMin,
              maximum: newMin
            });
          }else{

            if(parseInt(participantMultiplicity.maximum) < parseInt(newMin)){
              participantMultiplicity.maximum = newMin
            }
            participantMultiplicity.minimum = newMin
          }
          modeler.get('modeling').updateProperties(element, {
            name : getBusinessObject(element).name
          });
          return;
        };
      };

      var setMax = function(businessObject) {
        return function(element, values) {
          var newMax = values.maximum
          if(parseInt(newMax) < 0) return;

          var participantMultiplicity = businessObject.get('participantMultiplicity');
          if(!participantMultiplicity){
            businessObject.participantMultiplicity = bpmnFactory.create('bpmn:ParticipantMultiplicity', {
              minimum: 1,
              maximum: newMax
            });
          }else{

            if(parseInt(participantMultiplicity.minimum) > parseInt(newMax)){
              participantMultiplicity.maximum = participantMultiplicity.minimum
            }
            participantMultiplicity.maximum = newMax
          }
          modeler.get('modeling').updateProperties(element, {
            name : getBusinessObject(element).name
          });
          return;
        };
      };



      var processRef;

      // Process Documentation when having a Collaboration Diagram
      if (is(element, 'bpmn:Participant')) {
        processRef = getBusinessObject(element);

        // do not show for collapsed Pools/Participants
        if (processRef) {

          var participantMultiplicityMin = entryFactory.textBox({
            id: 'minimum',
            label: translate('Minimum'),
            modelProperty: 'minimum'
          });

          var participantMultiplicityMax = entryFactory.textBox({
            id: 'maximum',
            label: translate('Maximum'),
            modelProperty: 'maximum'
          });

          participantMultiplicityMin.set = setMin(processRef);

          participantMultiplicityMin.get = getMin(processRef);

          participantMultiplicityMax.set = setMax(processRef);

          participantMultiplicityMax.get = getMax(processRef);

          group.entries.push(participantMultiplicityMin);
          group.entries.push(participantMultiplicityMax);
        }
      }

    };
