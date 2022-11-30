var elementHelper = require('../../util/ElementHelper'), getBusinessObject = elementHelper.getBusinessObject, is = elementHelper.is;

var events = require('../../util/EventHelper'),  GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT, CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT;

var init = false;
var self;

function Scope() {
  "use strict";
  this.names = [];
  this.eval = function(s) {
    return eval(s);
  };
}
function assignments(scope, assigements){
  "use strict";
  var assignements = [].slice.call(assignements);
  var newNames = names.filter((x)=> !scope.names.includes(x));

  var code = "(function() {\n";

  for (var i = 0; i < assignements.length; i++) {
    code += assigements[i]+'\n';
  }
  code += 'return function(str) {return eval(str)};\n})()';
  scope.eval = scope.eval(code);
}

function addVariables(scope, variables){
  "use strict";
  var names = [].slice.call(variables);
  var newNames = names.filter((x)=> !scope.names.includes(x));

  if (newNames.length) {
    var i, len;
    var totalNames = newNames.concat(scope.names);
    var code = "(function() {\n";

    for (i = 0, len = newNames.length; i < len; i++) {
      code += 'var ' + newNames[i] + ' = null;\n';
    }
    code += 'return function(str) {return eval(str)};\n})()';
    scope.eval = scope.eval(code);
    scope.names = totalNames;
}
}

module.exports = Scope;
module.exports.addVariables = addVariables;
