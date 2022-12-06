'use strict';
 var inherits = require('inherits');
 var ContextPadProvider = require('bpmn-js/lib/features/context-pad/ContextPadProvider');
 var isAny = require('bpmn-js/lib/features/modeling/util/ModelingUtil').isAny;
 var assign = require('lodash/assign'),
    bind = require('lodash/bind');

    function MidaContextPadProvider(contextPad, modeling, elementFactory, connect,
                                      create, popupMenu, canvas, rules, translate) {
       ContextPadProvider.call(this, contextPad, modeling, elementFactory, connect, create,
                        popupMenu, canvas, rules, translate);
       var cached = bind(this.getContextPadEntries, this);
       this.getContextPadEntries = function(element) {
        var actions = cached(element);
         var businessObject = element.businessObject;
         function startConnect(event, element, autoActivate) {
          connect.start(event, element, autoActivate);
        }
        if (isAny(businessObject, [ 'bpmn:DataObjectReference', 'bpmn:DataStoreReference'])) {
          assign(actions, {
            'connect': {
              group: 'connect',
              className: 'bpmn-icon-connection-multi',
              title: translate('Connect using DataInputAssociation'),
              action: {
                click: startConnect,
                dragstart: startConnect
              }
            }
          });
        }
         return actions;
      };
    }
     util.inherits(MidaContextPadProvider, ContextPadProvider);
     MidaContextPadProvider.$inject = [
      'contextPad',
      'modeling',
      'elementFactory',
      'connect',
      'create',
      'popupMenu',
      'canvas',
      'rules',
      'translate'
    ];
     module.exports = MidaContextPadProvider;
