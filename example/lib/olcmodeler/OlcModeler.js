import inherits from 'inherits';
import { groupBy, without } from 'min-dash'

import Diagram from 'diagram-js';

import ConnectModule from 'diagram-js/lib/features/connect';
import ConnectionPreviewModule from 'diagram-js/lib/features/connection-preview';
import ContextPadModule from 'diagram-js/lib/features/context-pad';
import CreateModule from 'diagram-js/lib/features/create';
import LassoToolModule from 'diagram-js/lib/features/lasso-tool';
import ModelingModule from 'diagram-js/lib/features/modeling';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas';
import MoveModule from 'diagram-js/lib/features/move';
import OutlineModule from 'diagram-js/lib/features/outline';
import PaletteModule from 'diagram-js/lib/features/palette';
import RulesModule from 'diagram-js/lib/features/rules';
import SelectionModule from 'diagram-js/lib/features/selection';
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll';
import EditorActionsModule from '../common/editor-actions';
import CopyPasteModule from 'diagram-js/lib/features/copy-paste';
import KeyboardModule from '../common/keyboard';

import OlcPaletteModule from './palette';
import OlcDrawModule from './draw';
import OlcRulesModule from './rules';
import OlcModelingModule from './modeling';
import OlcAutoPlaceModule from './auto-place';

import OlcModdle from './moddle';
import OlcEvents from './OlcEvents';
import { nextPosition, root, is } from '../util/Util';

var emptyDiagram =
  `<?xml version="1.0" encoding="UTF-8"?>
<olc:definitions xmlns:olc="http://bptlab/schema/olc" >
<olc:olc name="SpaceDiagram" id="Space_Diagram">
</olc:olc>
</olc:definitions>`;

/**
 * Our editor constructor
 *
 * @param { { container: Element, additionalModules?: Array<any> } } options
 *
 * @return {Diagram}
 */
export default function OlcModeler(options) {

  const {
    container,
    additionalModules = [],
    keyboard
  } = options;

  // default modules provided by the toolbox
  const builtinModules = [
    ConnectModule,
    ConnectionPreviewModule,
    ContextPadModule,
    CreateModule,
    LassoToolModule,
    ModelingModule,
    MoveCanvasModule,
    MoveModule,
    OutlineModule,
    PaletteModule,
    RulesModule,
    SelectionModule,
    ZoomScrollModule,
    EditorActionsModule,
    KeyboardModule,
    CopyPasteModule
  ];

  // our own modules, contributing controls, customizations, and more
  const customModules = [
    OlcPaletteModule,
    OlcDrawModule,
    OlcRulesModule,
    OlcModelingModule,
    OlcAutoPlaceModule,
    {
      moddle: ['value', new OlcModdle({})],
      olcModeler: ['value', this]
    }

  ];

  const diagramOptions = {
    canvas: {
      container
    },
    keyboard,
    modules: [
      ...builtinModules,
      ...customModules,
      ...additionalModules
    ]
  };

  Diagram.call(this, diagramOptions);
  
  this.get('eventBus').fire('attach'); // Needed for key listeners to work

}
inherits(OlcModeler, Diagram);


OlcModeler.prototype.createNew = function () {
  return this.importXML(emptyDiagram);
}


OlcModeler.prototype.importXML = function (xml) {

  var self = this;

  return new Promise(function (resolve, reject) {

    // hook in pre-parse listeners +
    // allow xml manipulation
    xml = self._emit('import.parse.start', { xml: xml }) || xml;
    console.log(xml);

    self.get('moddle').fromXML(xml).then(function (result) {
      console.log(result.rootElement)
      var definitions = result.rootElement;
      var references = result.references;
      var parseWarnings = result.warnings;
      var elementsById = result.elementsById;

      var context = {
        references: references,
        elementsById: elementsById,
        warnings: parseWarnings
      };

      for (let id in elementsById) {
        self.get('elementFactory')._ids.claim(id, elementsById[id]);
      }

      // hook in post parse listeners +
      // allow definitions manipulation
      definitions = self._emit('import.parse.complete', {
        definitions: definitions,
        context: context
      }) || definitions;
      console.log(definitions);
      self.importDefinitions(definitions);
      self._emit('import.done', { error: null, warnings: null });
      resolve();
    }).catch(function (err) {

      self._emit('import.parse.failed', {
        error: err
      });

      self._emit('import.done', { error: err, warnings: err.warnings });

      return reject(err);
    });

  });
};

//TODO handle errors during import
OlcModeler.prototype.importDefinitions = function (definitions) {
  var self = this;
  self.get('elementFactory')._ids.clear();
  this._definitions = definitions;
  console.log(this._definitions);
  self._emit(OlcEvents.DEFINITIONS_CHANGED, { definitions: definitions });
  self._emit('import.render.start', { definitions: definitions });
  console.log(definitions.olcs)
  self.showOlc(definitions.olcs);
  self._emit('import.render.complete', {});
}

OlcModeler.prototype.showOlc = function (olc) {
  this.clear();
  this._olc = olc;
  if (olc) {
    const elementFactory = this.get('elementFactory');
    var diagramRoot = elementFactory.createRoot({ type: 'olc:Olc', businessObject: olc });
    const canvas = this.get('canvas');
    canvas.setRootElement(diagramRoot);

    var elements = groupBy(olc.get('Elements'), element => element.$type);
    var states = {};

    (elements['olc:State'] || []).forEach(state => {
      var stateVisual = elementFactory.createShape({
        type: 'olc:State',
        businessObject: state,
        x: parseInt(state.get('x')),
        y: parseInt(state.get('y'))
      });
      states[state.get('id')] = stateVisual;
      canvas.addShape(stateVisual, diagramRoot);
    });

    (elements['olc:Transition'] || []).forEach(transition => {
      var source = states[transition.get('sourceState').get('id')];
      var target = states[transition.get('targetState').get('id')];
      var transitionVisual = elementFactory.createConnection({
        type: 'olc:Transition',
        businessObject: transition,
        source: source,
        target: target,
        waypoints: this.get('olcUpdater').connectionWaypoints(source, target)
      });
      canvas.addConnection(transitionVisual, diagramRoot);
    });
  }

  this._emit(OlcEvents.SELECTED_OLC_CHANGED, { olc: olc });
}

OlcModeler.prototype.getDefinitions = function() {
  return this._definitions;
};

OlcModeler.prototype.on = function(event, priority, callback, target) {
  return this.get('eventBus').on(event, priority, callback, target);
};

OlcModeler.prototype.showOlcById = function (id) {
  if (id && this._definitions && id !== (this._olc && this._olc.get('id'))) {
    var olc = this._definitions.get('olcs').filter(olc => olc.get('id') === id)[0];
    if (olc) {
      this.showOlc(olc);
    } else {
      throw 'Unknown olc with class id \"'+id+'\"';
    }
  }
}

OlcModeler.prototype.getCurrentOlc = function () {
  return this._olc;
}

OlcModeler.prototype.getOlcById = function(id) {
  return this.getOlcs().filter(olc => olc.id === id)[0];
}

OlcModeler.prototype.getStateById = function(id) {
  return this.getOlcs().flatMap(olc => olc.get('Elements')).filter(element => is(element, 'olc:State')).filter(state => state.id === id)[0];
}

OlcModeler.prototype.getOlcs = function() {
  return this._definitions.get('olcs');
}

OlcModeler.prototype.getReferencesInState = function (olcState) {
  return this.get('elementRegistry').filter((element) =>
      is(element, 'olc:State') &&
      element.type !== 'label' &&
      element.businessObject.states?.includes(olcState)
  );
}

//change label
OlcModeler.prototype.renameOlcState = function (olcState) {
  this.getReferencesInState(olcState.id).forEach((element) =>
      this.get('eventBus').fire('element.updateLabel', {
          element
      })
  );
}

//delete olc
OlcModeler.prototype.deleteOlcState = function (olcState) {
  this.getReferencesInState(olcState).forEach((element, gfx) => {
      element.businessObject.states = without(element.businessObject.states, olcState);
      this.get('eventBus').fire('element.delete', {
          element
      });
  });
}

OlcModeler.prototype.handleOlcListChanged = function (olcs) {
  this._olcs = olcs;
  console.log(this._olcs)
}

OlcModeler.prototype.saveXML = function (options) {

  options = options || {};

  var self = this;

  var definitions = this._definitions;
  console.log(definitions);

  return new Promise(function (resolve, reject) {
    
    if (!definitions) {
      var err = new Error('no xml loaded');

      return reject(err + definitions);
    }

    // allow to fiddle around with definitions
    definitions = self._emit('saveXML.start', {
      definitions: definitions
    }) || definitions;

    self.get('moddle').toXML(definitions, options).then(function (result) {

      var xml = result.xml;

      try {
        xml = self._emit('saveXML.serialized', {
          error: null,
          xml: xml
        }) || xml;

        self._emit('saveXML.done', {
          error: null,
          xml: xml
        });
      } catch (e) {
        console.error('error in saveXML life-cycle listener', e);
      }

      return resolve({ xml: xml });
    }).catch(function (err) {

      return reject(err);
    });
  });
};

OlcModeler.prototype._emit = function (type, event) {
  return this.get('eventBus').fire(type, event);
};

OlcModeler.prototype.ensureElementIsOnCanvas = function (element) {
  if (!this.get('elementRegistry').get(element.id)) {
    const rootElement = root(element);
    if (this.getOlcs().includes(rootElement)) {
      this.showOlc(rootElement);
    } else {
      throw 'Cannot display element. Is not part of a known olc';
    }
  }
}