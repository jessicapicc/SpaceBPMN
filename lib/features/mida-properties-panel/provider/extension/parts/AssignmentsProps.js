'use strict';

var assignment = require('./implementation/Assignment'),
    elementHelper = require('../../../helper/ElementHelper'),
    cmdHelper = require('../../../helper/CmdHelper'),
    is = require('bpmn-js/lib/util/ModelUtil').is;


module.exports = function(group, element, bpmnFactory, translate) {
if (is(element, 'bpmn:Task')) {
  var assignementsEntry = assignment(element, bpmnFactory, {
    id: 'assignments',
    modelProperties: [ 'assignment' ],
    labels: [ translate('Assignments') ],

    getParent: function(element, node, bo) {
      return bo.extensionElements;
    },

    createParent: function(element, bo) {
      var parent = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
      var cmd = cmdHelper.updateBusinessObject(element, bo, { extensionElements: parent });
      return {
        cmd: cmd,
        parent: parent
      };
    }
  }, translate);

  if (assignementsEntry) {
    group.entries.push(assignementsEntry);
  }
}
};
