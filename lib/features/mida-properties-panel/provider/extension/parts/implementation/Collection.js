'use strict';

var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

var entryFieldDescription = require('bpmn-js-properties-panel/lib/factory/EntryFieldDescription');


function updateProperties(element, res){
    getBusinessObject(element).get('dataObjectRef').isCollection = res.isCollection
    modeler.get('modeling').updateProperties(element, {
      name : getBusinessObject(element).name
    });
}

var collectionbox = function(options, defaultParameters) {
  var resource      = defaultParameters,
      label         = options.label || resource.id,
      canBeDisabled = !!options.disabled && typeof options.disabled === 'function',
      canBeHidden   = !!options.hidden && typeof options.hidden === 'function',
      description   = options.description;

  resource.html =
    '<input id="camunda-' + resource.id + '" ' +
         'type="checkbox" ' +
         'name="' + options.modelProperty + '" ' +
         (canBeDisabled ? 'data-disable="isDisabled"' : '') +
         (canBeHidden ? 'data-show="isHidden"' : '') +
         ' />' +
    '<label for="camunda-' + resource.id + '" ' +
         (canBeDisabled ? 'data-disable="isDisabled"' : '') +
         (canBeHidden ? 'data-show="isHidden"' : '') +
         '>' + label + '</label>';

  // add description below checkbox entry field
  if (description) {
    resource.html += entryFieldDescription(description);
  }

  resource.get = function(element) {
    var bo = getBusinessObject(element).get('dataObjectRef'),
        res = {};

    res[options.modelProperty] = bo.get(options.modelProperty);

    return res;
  };
  resource.set = function(element, values) {
    var res = {};

    res[options.modelProperty] = !!values[options.modelProperty];

    return updateProperties(element, res);
  };

  if (typeof options.set === 'function') {
    resource.set = options.set;
  }

  if (typeof options.get === 'function') {
    resource.get = options.get;
  }

  if (canBeDisabled) {
    resource.isDisabled = function() {
      return options.disabled.apply(resource, arguments);
    };
  }

  if (canBeHidden) {
    resource.isHidden = function() {
      return !options.hidden.apply(resource, arguments);
    };
  }

  resource.cssClasses = ['bpp-checkbox'];

  return resource;
};

module.exports = collectionbox;
