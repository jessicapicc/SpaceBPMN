'use strict';

var domQuery = require('min-dom').query,
cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
is = require('bpmn-js/lib/util/ModelUtil').is;
var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

module.exports = function(group, element, translate, bpmnFactory) {

  if (is(element, 'bpmn:Task')) {

    var options = { id: 'exp', label: 'Guard' };
    var getEl = function(element){
      var bo = getBusinessObject(element);
      var extEl = bo.extensionElements;

      if(!extEl){
        extEl = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        bo.extensionElements = extEl
      }
      var guardEl;
      extEl.values.forEach(function(val) {
        if(is(val, 'mida:Guard')){
          guardEl = val;
          return
        }
      });
      if(!guardEl){
        guardEl = elementHelper.createElement('mida:Guard', {}, extEl, bpmnFactory);
        extEl.values.push(guardEl)
      }
      if (!(guardEl)) {
        return;
      }
      return guardEl
    };

    group.entries.push({
      id: options.id,
      label: options.label,
      html:
              // expression
              '<div class="bpp-row">' +
                '<label for="cam-condition" >'+translate('Guard')+'</label>' +
                '<div class="bpp-field-wrapper" >' +
                  '<input id="cam-condition" type="text" name="exp" />' +
                  '<button class="clear" data-action="clear" data-show="canClear">' +
                    '<span>X</span>' +
                  '</button>' +
                '</div>' +
              '</div>',
      get: function(element) {
        var guardEl = getEl(element)
        return {exp : guardEl.exp};
      },
      set: function(element, values, containerElement) {
        var guardEl = getEl(element)
        guardEl.exp = values.exp
        modeler.get('modeling').updateProperties(element, {
          name : getBusinessObject(element).name
        });
      },
      validate: function(guardEl, values) {
        return true;
      },
      clear: function(guardEl, inputNode) {
        // clear text input
        domQuery('input[name=exp]', inputNode).value='';
        return true;
      },
      cssClasses: [ 'bpp-textfield' ]
    });
  }

};
