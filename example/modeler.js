/* global process */

'use strict'; 
import $ from 'jquery';
import TokenSimulationModule from '..';

import BpmnModeler from 'bpmn-js/lib/Modeler';

import AddExporter from '@bpmn-io/add-exporter';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule
} from 'bpmn-js-properties-panel';

import spacePropertiesProviderModule from './lib/spacePropertiesPanel/spacePropertiesProvider/index.js';
import spaceModdleDescriptor from './lib/spacePropertiesPanel/descriptors/space.json';

import fileDrop from 'file-drops';

import fileOpen from 'file-open';

import download from 'downloadjs';

import exampleXML from '../example/resources/example.bpmn';

import OlcModeler from './lib/olcmodeler/OlcModeler';
import Mediator from './lib/mediator/Mediator';

const url = new URL(window.location.href);
const persistent = url.searchParams.has('p');
const active = url.searchParams.has('e');
const presentationMode = url.searchParams.has('pm');


let fileName = 'diagram.bpmn';

const initialDiagram = (() => {
  try {
    return persistent && localStorage['diagram-xml'] || exampleXML;
  } catch (err) {
    return exampleXML;
  }
})();

function showMessage(cls, message) {
  const messageEl = document.querySelector('.drop-message');

  messageEl.textContent = message;
  messageEl.className = `drop-message ${cls || ''}`;

  messageEl.style.display = 'block';
}

function hideMessage() {
  const messageEl = document.querySelector('.drop-message');

  messageEl.style.display = 'none';
}

if (persistent) {
  hideMessage();
}

const ExampleModule = {
  __init__: [
    [ 'eventBus', 'bpmnjs', 'toggleMode', function(eventBus, bpmnjs, toggleMode) {

      if (persistent) {
        eventBus.on('commandStack.changed', function() {
          bpmnjs.saveXML().then(result => {
            localStorage['diagram-xml'] = result.xml;
          });
        });
      }

      if ('history' in window) {
        eventBus.on('tokenSimulation.toggleMode', event => {

          document.body.classList.toggle('token-simulation-active', event.active);

          if (event.active) {
            url.searchParams.set('e', '1');
          } else {
            url.searchParams.delete('e');
          }

          history.replaceState({}, document.title, url.toString());
        });
      }

      eventBus.on('diagram.init', 500, () => {
        toggleMode.toggleMode(active);
      });
    } ]
  ]
};

const modeler = new BpmnModeler({
  container: '#canvas',
  additionalModules: [
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
    spacePropertiesProviderModule,
    TokenSimulationModule,
    AddExporter,
    ExampleModule
  ],
  propertiesPanel: {
    parent: '#properties-panel'
  },
  exporter: {
    name: 'bpmn-js-token-simulation',
    version: process.env.TOKEN_SIMULATION_VERSION
  },
  keyboard: {
    bindTo: document
  },
  moddleExtensions: {
    space: spaceModdleDescriptor
  }
});

function openDiagram(diagram) {
  return modeler.importXML(diagram)
    .then(({ warnings }) => {
      if (warnings.length) {
        console.warn(warnings);
      }

      if (persistent) {
        localStorage['diagram-xml'] = diagram;
      }

      modeler.get('canvas').zoom('fit-viewport');
    })
    .catch(err => {
      console.error(err);
    });
}

if (presentationMode) {
  document.body.classList.add('presentation-mode');
}

function openFile(files) {

  // files = [ { name, contents }, ... ]

  if (!files.length) {
    return;
  }

  hideMessage();

  fileName = files[0].name;

  openDiagram(files[0].contents);
}

document.body.addEventListener('dragover', fileDrop('Open BPMN diagram', openFile), false);

//open diagram
function loadDiagram(xml) {
  var fileInput = document.createElement("input");
  document.body.appendChild(fileInput);

  $(fileInput).attr({ 'type': 'file' }).on('change', function (e) {
      var file = e.target.files[0];
      var reader = new FileReader();
      if (file) {
      reader.readAsText(file, "UTF-8");
      reader.onload = function (evt) {

          var bpmnXML = evt.target.result;
          modeler.importXML(bpmnXML, function(err) {
        if (err) {
          return console.error('could not import BPMN 2.0 diagram', err);
        }
        // access modeler components
        var canvas = modeler.get('canvas');
        var overlays = modeler.get('overlays');
        // zoom to fit full viewport
        canvas.zoom('fit-viewport');
      });
      }
      reader.onerror = function (evt) {
          document.getElementById("fileContents").innerHTML = "error reading file";
      }
    }
    }).trigger('click');
    document.body.removeChild(fileInput);
  }

document.querySelector("#open-diagram").addEventListener('click', (e) =>loadDiagram(e.currentTarget.file));

//download diagram
function downloadDiagram() {
  modeler.saveXML({ format: true }, function(err, xml) {
    if (!err) {
      download(xml, fileName, 'application/xml');
    }
  });
}

document.body.addEventListener('keydown', function(event) {
  if (event.code === 'KeyS' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();

    downloadDiagram();
  }

  if (event.code === 'KeyO' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();

    fileOpen().then(openFile);
  }
});

document.querySelector('#download-button').addEventListener('click', function(event) {
  downloadDiagram();
});

const propertiesPanel = document.querySelector('#properties-panel');

const propertiesPanelResizer = document.querySelector('#properties-panel-resizer');

let startX, startWidth;

function toggleProperties(open) {

  if (open) {
    url.searchParams.set('pp', '1');
  } else {
    url.searchParams.delete('pp');
  }

  history.replaceState({}, document.title, url.toString());

  propertiesPanel.classList.toggle('open', open);
}

propertiesPanelResizer.addEventListener('click', function(event) {
  toggleProperties(!propertiesPanel.classList.contains('open'));
});

propertiesPanelResizer.addEventListener('dragstart', function(event) {
  const img = new Image();
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  event.dataTransfer.setDragImage(img, 1, 1);

  startX = event.screenX;
  startWidth = propertiesPanel.getBoundingClientRect().width;
});

propertiesPanelResizer.addEventListener('drag', function(event) {

  if (!event.screenX) {
    return;
  }

  const delta = event.screenX - startX;

  const width = startWidth - delta;

  const open = width > 200;

  propertiesPanel.style.width = open ? `${width}px` : null;

  toggleProperties(open);
});

const remoteDiagram = url.searchParams.get('diagram');

if (remoteDiagram) {
  fetch(remoteDiagram).then(
    r => {
      if (r.ok) {
        return r.text();
      }

      throw new Error(`Status ${r.status}`);
    }
  ).then(
    text => openDiagram(text)
  ).catch(
    err => {
      showMessage('error', `Failed to open remote diagram: ${err.message}`);

      openDiagram(initialDiagram);
    }
  );
} else {
  openDiagram(initialDiagram);
}

toggleProperties(url.searchParams.has('pp'));



// part for dynamism of the  vertical divider 
var dragTarget = undefined;

window.addEventListener('mousemove', function (e) { dragmove(e); });
window.addEventListener('touchmove', function (e) { dragmove(e); });
window.addEventListener('mouseup', dragend);
window.addEventListener('touchend', dragend);
$('.divider').each((index, divider) => {
    divider.addEventListener('mousedown', function (e) { dragstart(e); });
    divider.addEventListener('touchstart', function (e) { dragstart(e); });
});

function dragstart(e) {
    e.preventDefault();
    dragTarget = e.target;
}

function dragmove(e) {
    if (dragTarget) {
        dragTarget.classList.add('dragged')
        var parent = $(dragTarget).parent()[0];
        var parentStyle = window.getComputedStyle(parent);
        var prev = $(dragTarget).prev('div')[0];
        var next = $(dragTarget).next('div')[0];
        if (dragTarget.classList.contains('vertical')) {
            var parentInnerWidth = parseInt(parentStyle.width, 10) - parseInt(parentStyle.paddingLeft, 10) - parseInt(parentStyle.paddingRight, 10);
            var percentage = ((e.pageX - (parent.getBoundingClientRect().left + parseInt(parentStyle.paddingLeft, 10))) / parentInnerWidth) * 100;
            if (percentage > 5 && percentage < 95) {
                var mainPercentage = 100 - percentage;
                prev.style.width = percentage + '%';
                next.style.width = mainPercentage + '%';
                dragTarget.style.left = 'calc('+ percentage * (parentInnerWidth / parseInt(parentStyle.width, 10)) + '% - 10px - '+ parentStyle.paddingLeft +')';
                next.style.left = 0 + '%';
            }
        } else {
            var parentInnerHeight = parseInt(parentStyle.height, 10) - parseInt(parentStyle.paddingTop, 10) - parseInt(parentStyle.paddingBottom, 10);
            var percentage = ((e.pageY - (parent.getBoundingClientRect().top + parseInt(parentStyle.paddingTop, 10))) / parentInnerHeight) * 100;
            if (percentage > 5 && percentage < 95) {
                var mainPercentage = 100 - percentage;
                prev.style.height = percentage + '%';
                next.style.height = mainPercentage + '%';
                dragTarget.style.top = 'calc('+percentage * (parentInnerHeight / parseInt(parentStyle.height, 10)) + '% - 10px + ' + parentStyle.paddingTop +')';
                next.style.top = 0 + '%';
            }
        }
    }
}

function dragend() {
    $('.divider').each((index, divider) => {
        divider.classList.remove('dragged')
    });
    dragTarget = undefined;
}

//modeler for space
var mediator = new Mediator();
window.mediator = mediator;

var olcModeler = new OlcModeler({
    container: document.querySelector('#olc-canvas'),
    keyboard: { 
      bindTo: document.querySelector('#olc-canvas') 
    },
    additionalModules: [{
      __init__ : ['mediator'],
      mediator : ['type', mediator.OlcModelerHook]
    }]
});