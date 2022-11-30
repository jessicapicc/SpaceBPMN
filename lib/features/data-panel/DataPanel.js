'use strict';
var is = require('../../util/ElementHelper').is;
var forEach = require('lodash').forEach;


var domify = require('min-dom/dist').domify,
    domClasses = require('min-dom/dist').classes,
    domEvent = require('min-dom/dist').event,
    domQuery = require('min-dom/dist').query;

var events = require('../../util/EventHelper'),
    TOGGLE_MODE_EVENT = events.TOGGLE_MODE_EVENT,
    DATA_UPDATE_EVENT = events.DATA_UPDATE_EVENT,
    GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT,
    RESET_SIMULATION_EVENT = events.RESET_SIMULATION_EVENT,
    TERMINATE_EVENT = events.TERMINATE_EVENT,
    CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT,
    SHOW_INSTANCE_DATA = events.SHOW_INSTANCE_DATA;

var Scope = require('../data/Scope');


function DataPanel(eventBus, canvas, selection, contextPad) {
  var self = this;

  this._eventBus = eventBus;
  this._canvas = canvas;
  this._selection = selection;
  this._contextPad = contextPad;

  eventBus.on('import.done', function() {
    self.canvasParent =  self._canvas.getContainer().parentNode;
    self.palette = domQuery('.djs-palette', self._canvas.getContainer());
  });
}

DataPanel.prototype._init = function() {

};



DataPanel.prototype.dataMode = function(processInstancesWithParent, instanceScope) {
  console.log(instanceScope);
  var globalHTML = "";
  var scope = instanceScope.get('_global_');
  var variables = scope.names;
  var selectHTML = "";
  selectHTML='<div id="instanceData" class="label" title="View Global Data">Global Data'
  selectHTML+='<table id="selectedData" class="selectedData">';
  for(var i = 0; i < variables.length; i++) {
    var value = scope.eval(variables[i]);
    // if(!value){
    //   value = "---";
    // }
    if(variables[i]==='instance'){
      //INSTANCE DO NOT HAS TO BE SHOWN
    }else{
      selectHTML += "<tr><td>"+ variables[i] + "</td><td>" +JSON.stringify(value) + "</td>";
    }
  }
  selectHTML += "</table><hr></div>";
  globalHTML += selectHTML
  processInstancesWithParent.forEach(function(processInstance) {
    var instance = processInstance.processInstanceId;
    var scope = instanceScope.get(instance);
    var variables = scope.names;
	  var selectHTML = "";
    selectHTML='<div id="instanceData" class="label" title="View Data of Instance '+instance+'">Instance '+instance+' of '+processInstance.parent.businessObject.name
	  selectHTML+='<table id="selectedData" class="selectedData">';
    for(var i = 0; i < variables.length; i++) {
      var value = scope.eval(variables[i]);
      // if(!value){
      //   value = "---";
      // }
      if(variables[i]==='instance'){
        //INSTANCE DO NOT HAS TO BE SHOWN
      }else{
        var coll = ''
        var name = variables[i]
        if(name.includes('_III_')){
          name = name.replace('_III_', '')
          coll = '<i class="fa fa-bars fa-rotate-90" aria-hidden="true"></i> '
        }
        selectHTML += "<tr><td>"+ coll +name + "</td><td>" +JSON.stringify(value) + "</td>";
      }
    }
	  selectHTML += "</table><hr></div>";
    globalHTML += selectHTML
  });
  document.getElementById('data-perspective').innerHTML = globalHTML;
	};



DataPanel.$inject = [ 'eventBus', 'canvas', 'selection', 'contextPad' ];

module.exports = DataPanel;
