'use strict';

var domify = require('min-dom/dist').domify, 
domClasses = require('min-dom/dist').classes, 
domEvent = require('min-dom/dist').event;

var is = require('../../../util/ElementHelper').is;

var events = require('../../../util/EventHelper'),
GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT, 
GENERATE_MESSAGE_TOKEN_EVENT = events.GENERATE_MESSAGE_TOKEN_EVENT, 
CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT, 
CONSUME_MESSAGE_TOKEN_EVENT = events.CONSUME_MESSAGE_TOKEN_EVENT;

function IntermeditateThrowEventHandler(eventBus) {
  this._eventBus = eventBus;
}

IntermeditateThrowEventHandler.prototype.createContextPad = function(element) {
  var processInstanceId = element.parent.shownProcessInstance;

  var incomingSequenceFlows = element.incoming.filter(function(incoming) {
    return is(incoming, 'bpmn:SequenceFlow');
  });

  var eventBasedGatewaysHaveTokens = [];
  
  incomingSequenceFlows.forEach(function(incoming) {
    var source = incoming.source;
    
    if (is(source, 'bpmn:EventBasedGateway') && source.tokenCount && source.tokenCount[processInstanceId]) {
      eventBasedGatewaysHaveTokens.push(source);
    }
  });

  var outgoingSequenceFlows = element.outgoing.filter(function(outgoing) {
    return is(outgoing, 'bpmn:SequenceFlow');
  });

  if (!incomingSequenceFlows.length || !outgoingSequenceFlows.length) {
    return;
  }

  var self = this;

  var contextPad;

  if (element.tokenCount && element.tokenCount[processInstanceId]) {
    contextPad = domify('<div class="context-pad" title="Trigger Event"><i class="fa fa-play"></i></div>');
    
    domEvent.bind(contextPad, 'click', function() {
      element.tokenCount[processInstanceId]--;
  
      self._eventBus.fire(GENERATE_TOKEN_EVENT, {
        element: element,
        processInstanceId: processInstanceId
      });
    });
  } else if (eventBasedGatewaysHaveTokens.length) {
    contextPad = domify('<div class="context-pad" title="Trigger Event"><i class="fa fa-play"></i></div>');
    
    domEvent.bind(contextPad, 'click', function() {
      eventBasedGatewaysHaveTokens.forEach(function(eventBasedGateway) {
        eventBasedGateway.tokenCount[processInstanceId]--;
      });
  
      self._eventBus.fire(GENERATE_MESSAGE_TOKEN_EVENT, {
        element: element,
        processInstanceId: processInstanceId
      });
    });
  }

  return contextPad;
};

IntermeditateThrowEventHandler.$inject = [ 'eventBus' ];

module.exports = IntermeditateThrowEventHandler;