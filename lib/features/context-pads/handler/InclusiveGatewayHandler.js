'use strict';

var is = require('../../../util/ElementHelper').is;

var domify = require('min-dom/dist').domify, 
domClasses = require('min-dom/dist').classes, 
domEvent = require('min-dom/dist').event;

function InclusiveGatewayHandler(inluciveGatewaySettings) {
  this._inclusiveGatewaySettings = inluciveGatewaySettings;
}

InclusiveGatewayHandler.prototype.createContextPad = function(element) {
	//The path is choosed by data.
//  var self = this;
//
//  var outgoingSequenceFlows = element.outgoing.filter(function(outgoing) {
//    return is(outgoing, 'bpmn:SequenceFlow');
//  });
//
//  if (outgoingSequenceFlows.length < 2) {
//    return;
//  }
//
//  var contextPad = domify('<div class="context-pad" title="Set Sequence Flow"><i class="fa fa-code-fork"></i></div>');
//  
//  domEvent.bind(contextPad, 'click', function() {
//    self._inclusiveGatewaySettings.setSequenceFlow(element);
//  });
//
//  return contextPad;
};

InclusiveGatewayHandler.$inject = [ 'inclusiveGatewaySettings' ];

module.exports = InclusiveGatewayHandler;