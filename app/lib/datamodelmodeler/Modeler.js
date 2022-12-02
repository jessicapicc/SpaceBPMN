import inherits from 'inherits';

import BaseModeler from './BaseModeler';

import Viewer from './Viewer';
import NavigatedViewer from './NavigatedViewer';

import KeyboardMoveModule from 'diagram-js/lib/navigation/keyboard-move';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas';
import TouchModule from 'diagram-js/lib/navigation/touch';
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll';

import AlignElementsModule from 'diagram-js/lib/features/align-elements';
import AutoScrollModule from 'diagram-js/lib/features/auto-scroll';
import BendpointsModule from 'diagram-js/lib/features/bendpoints';
import ConnectModule from 'diagram-js/lib/features/connect';
import ConnectionPreviewModule from 'diagram-js/lib/features/connection-preview';
import ContextPadModule from './features/context-pad';
import CopyPasteModule from './features/copy-paste';
import CreateModule from 'diagram-js/lib/features/create';
import EditorActionsModule from '../common/editor-actions';
import GridSnappingModule from './features/grid-snapping';
import KeyboardModule from '../common/keyboard';
import AutoplaceModule from './features/auto-place';
import KeyboardMoveSelectionModule from 'diagram-js/lib/features/keyboard-move-selection';
import LabelEditingModule from './features/label-editing';
import ModelingModule from './features/modeling';
import MoveModule from 'diagram-js/lib/features/move';
import PaletteModule from './features/palette';
import ResizeModule from 'diagram-js/lib/features/resize';
import SpaceToolBehaviorModule from './behavior';
import SnappingModule from './features/snapping';
import { nextPosition } from '../util/Util';

var initialDiagram =
  `<?xml version="1.0" encoding="UTF-8"?>
<od:definitions xmlns:od="http://tk/schema/od" xmlns:odDi="http://tk/schema/odDi">
    <od:odBoard id="Board_debug" />
    <odDi:odRootBoard id="RootBoard_debug">
        <odDi:odPlane id="Plane_debug" boardElement="Board_debug" />
    </odDi:odRootBoard>
</od:definitions>`;

export default function Modeler(options) {
  BaseModeler.call(this, options);
}

inherits(Modeler, BaseModeler);


Modeler.Viewer = Viewer;
Modeler.NavigatedViewer = NavigatedViewer;

/**
* The createDiagram result.
*
* @typedef {Object} CreateDiagramResult
*
* @property {Array<string>} warnings
*/

/**
* The createDiagram error.
*
* @typedef {Error} CreateDiagramError
*
* @property {Array<string>} warnings
*/

/**
 * Create a new diagram to start modeling.
 *
 * @returns {Promise<CreateDiagramResult, CreateDiagramError>}
 *
 */
Modeler.prototype.createDiagram = function() {
  return this.importXML(initialDiagram);
};


Modeler.prototype._interactionModules = [

  // non-modeling components
  KeyboardMoveModule,
  MoveCanvasModule,
  TouchModule,
  ZoomScrollModule
];

Modeler.prototype._modelingModules = [

  // modeling components
  AutoplaceModule,
  AlignElementsModule,
  AutoScrollModule,
  BendpointsModule,
  ConnectModule,
  ConnectionPreviewModule,
  ContextPadModule,
  CopyPasteModule,
  CreateModule,
  EditorActionsModule,
  GridSnappingModule,
  KeyboardModule,
  KeyboardMoveSelectionModule,
  LabelEditingModule,
  ModelingModule,
  MoveModule,
  PaletteModule,
  ResizeModule,
  SnappingModule,
  SpaceToolBehaviorModule
];


// modules the modeler is composed of
//
// - viewer modules
// - interaction modules
// - modeling modules

Modeler.prototype._modules = [].concat(
  Viewer.prototype._modules,
  Modeler.prototype._interactionModules,
  Modeler.prototype._modelingModules
);

Modeler.prototype.createDataclass = function (name) {
  const modeling = this.get('modeling');
  const canvas = this.get('canvas');
  const diagramRoot = canvas.getRootElement();

  const {x,y} = nextPosition(this, 'od:Class');
  const shape = modeling.createShape({
    type: 'od:Class',
    name: name
  }, {x,y}, diagramRoot);
  return shape.businessObject;
}

Modeler.prototype.renameClass = function (clazz, name) {
  this.get('modeling').updateLabel(this.get('elementRegistry').get(clazz.id), name);
}

Modeler.prototype.deleteClass = function (clazz) {
  this.get('modeling').removeShape(this.get('elementRegistry').get(clazz.id));
}

Modeler.prototype.updateProperty = function (clazz, property) {
  this.get('modeling').updateProperties(clazz, property);
}
