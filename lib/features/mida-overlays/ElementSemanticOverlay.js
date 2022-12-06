'use strict';
var is = require('../../util/ElementHelper').is;
var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

var elementHelper = require('../../util/ElementHelper'), is = elementHelper.is, isAncestor = elementHelper.isAncestor;
var bpmnFactory = require('bpmn-js/lib/features/modeling/BpmnFactory');
var elementHelper1 = require('bpmn-js-properties-panel/lib/helper/ElementHelper');
var events = require('../../util/EventHelper'), UPDATE_TASK_TYPE = events.UPDATE_TASK_TYPE,  UPDATE_DATAOBJ_TYPE = events.UPDATE_DATAOBJ_TYPE;
var LOW_PRIORITY = 500;

var TASK_OFFSET_TOP = 61, TASK_OFFSET_LEFT = 1;
var DOBJ_OFFSET_TOP = 1, DOBJ_OFFSET_LEFT = 2;
var mdiArrowRightBoldOutline = require('@mdi/js').mdiArrowRightBoldOutline;
var mdiArrowRightBold = require('@mdi/js').mdiArrowRightBold;


function ElementSemanticOverlay(eventBus, elementRegistry, overlays, injector, canvas,
		processInstances) {

	var self = this;
	this._elementRegistry = elementRegistry;
	this._overlays = overlays;
	this._injector = injector;
	this._canvas = canvas;
	this._processInstances = processInstances;
	this.overlayIds = {};
  this.overlayLabel = {};



	eventBus.on(UPDATE_TASK_TYPE, function(context) {
		var element = context.element;
    var type = context.tasktype;
    if(type != self.overlayLabel[element.id]){
  			self.closeElementSemantic(element);
  			self.openTaskType({element : element, type : type});
    }
	});

  eventBus.on(UPDATE_DATAOBJ_TYPE, function(context) {
		var element = context.element;
    var type = context.dataobjtype;
    if(type != self.overlayLabel[element.id]){
  			self.closeElementSemantic(element);
  			self.openDataObjType({element : element, type : type});
    }
	});


  eventBus.on('import.done', function(context) {
    self.openElementSemanticOverlay();
	});

}



ElementSemanticOverlay.prototype.openElementSemanticOverlay = function() {

	var self = this;
  var  elReg = self._elementRegistry;
  this._elementRegistry.forEach(function(element) {
		if (is(element, 'bpmn:Task') || is(element, 'bpmn:SendTask') || is(element, 'bpmn:ReceiveTask')) {
			var type;
			var extEl = getBusinessObject(element).extensionElements;
			if(extEl){
				extEl.values.forEach(function(val) {
		      if(is(val, 'mida:TaskType')){
		        type = val;
		        return
		      }
		    });
			}
			self.openTaskType({element : element, type : type || 'a'});
		}else if (is(element, 'bpmn:DataObjectReference')) {
  			self.openDataObjType({element : element, type : getBusinessObject(element).$attrs.dataobjtype});
  	}
	});
};

ElementSemanticOverlay.prototype.openDataObjType = function(context) {
 var type =  context.type;
 var element  = context.element;
 if(!type){
   type = 'none';
 }
 getBusinessObject(element).dataobjtype = type;
 var marker = '';
if(element.type === 'label') return
 if(type == 'output'){
	 marker = '<svg style="width:15px;height:15px" viewBox="0 0 24 24"><path fill="#000000" d="'+mdiArrowRightBold+'"></path><svg>';
 }else if(type == 'input'){
	 marker = '<svg style="width:15px;height:15px" viewBox="0 0 24 24"><path fill="#000000" d="'+mdiArrowRightBoldOutline+'"></path><svg>';
 }
 var contextPad = '<div class="mida-dobj-overlay">'+marker+'</div>';

	var position = {
		top : DOBJ_OFFSET_TOP,
		left : DOBJ_OFFSET_LEFT
	};
	var overlayId = this._overlays.add(element, 'context-menu', {
		position : position,
		html : contextPad
	});

  this.overlayIds[element.id] = overlayId;
  this.overlayLabel[element.id] = type;

};


ElementSemanticOverlay.prototype.openTaskType = function(context) {
 var type =  context.type;
 var element  = context.element;
	var contextPad = '<div class="mida-task-overlay">'+type+'</div>';
	var position = {
		top : TASK_OFFSET_TOP,
		left : TASK_OFFSET_LEFT
	};
	var overlayId = this._overlays.add(element, 'context-menu', {
		position : position,
		html : contextPad
	});

 	 // var bo = getBusinessObject(element);
 	 // var extEl = bo.extensionElements;
	 //
 	 // if(!extEl){
 		//  extEl = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
 		//  bo.extensionElements = extEl
 	 // }
 	 // var guardEl;
 	 // extEl.values.forEach(function(val) {
 		//  if(is(val, 'mida:TaskType')){
 		// 	 guardEl = val;
 		// 	 return
 		//  }
 	 // });
 	 // if(!guardEl){
 		//  guardEl = elementHelper.createElement('mida:TaskType', {type: 'a'}, extEl, bpmnFactory);
 		//  extEl.values.push(guardEl)
 	 // }
  this.overlayIds[element.id] = overlayId;
  this.overlayLabel[element.id] = type;

};

ElementSemanticOverlay.prototype.closeElementSemanticOverlay = function(parent) {
	var self = this;

	if (!parent) {
		parent = this._canvas.getRootElement();
	}

	this._elementRegistry.forEach(function(element) {
		if (isAncestor(parent, element)) {
			self.closeElementSemantic(element);
		}
	});
};




ElementSemanticOverlay.prototype.closeElementSemantic = function(element) {
	var overlayId = this.overlayIds[element.id];

	if (!overlayId) {

		return;
	}
  delete this.overlayLabel[element.id];
	delete this.overlayIds[element.id];
	this._overlays.remove(overlayId);
};

ElementSemanticOverlay.$inject = [ 'eventBus', 'elementRegistry', 'overlays', 'injector',
		'canvas', 'processInstances' ];

module.exports = ElementSemanticOverlay;
