

'use strict';

var tokenSimulation = require('../lib/modeler');

import exampleXML from './resources/models/runningExample.bpmn';

var propertiesPanelModule = require('bpmn-js-properties-panel');

import midaProviderModule from '../lib/features/mida-properties-panel/provider/extension';
import midaModdleDescriptor from '../lib/features/mida-properties-panel/descriptors/mida';

import customElements from '../lib/features/mida-modeler-extension/custom-elements.json';
var BpmnModeler = require('bpmn-js/lib/Modeler').default;

var _ = require('lodash');
var ModdleXMLW = require('moddle-xml').Writer;
import BpmnModdle from 'bpmn-moddle';





var	camundaExtensionModule = require('camunda-bpmn-moddle/lib');

var camundaModdle = require('camunda-bpmn-moddle/resources/camunda');

var moddle = new BpmnModdle({ camunda: camundaModdle });

var modeler = new BpmnModeler({
  container: '#canvas',
  additionalModules: [
    tokenSimulation,
    midaProviderModule,
    propertiesPanelModule
  ],
  //textRenderer: {
  //  defaultStyle: {
  //    fontSize: "15px"
  //  },
  //  externalStyle: {
  //    fontSize: "15px"
  //  }
  //},
  propertiesPanel: {
	    parent: '#js-properties-panel'
	  },
  keyboard: {
    bindTo: document
  },
  moddleExtensions: {
    mida: midaModdleDescriptor,
    camunda: camundaModdle
  }
});

modeler.importXML(exampleXML, function(err) {
  if (!err) {
    modeler.get('canvas').zoom('fit-viewport');
  } else {
    sessionStorage.clear()
    console.log('something went wrong:', err);
  }
  //  modeler.addCustomElements(customElements);
});


window.modeler = modeler;
