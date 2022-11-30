'use strict';

var elementHelper = require('../../util/ElementHelper'), getBusinessObject = elementHelper.getBusinessObject, is = elementHelper.is, getMidaEl = elementHelper.getMidaEl;
var Scope = require('./Scope');
var events = require('../../util/EventHelper'),  TOGGLE_MODE_EVENT = events.TOGGLE_MODE_EVENT, CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT;
var forEach = require('lodash').forEach;
var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;
var init = false;
var self;
var globalScope;
var inputScope;
const COLLECTION_MARK = '_III_'


function Data(eventBus, animation, elementRegistry, log, elementNotifications,
		canvas, processInstances) {
 self = this;
	this._animation = animation;
	this._elementRegistry = elementRegistry;
	this._log = log;
	this._elementNotifications = elementNotifications;
	this._canvas = canvas;
	this._processInstances = processInstances;
	this._eventBus = eventBus;

}
function evaluateDataObj(scope, dStore){
	for(var k = 0; k<dStore.length; k++){
		if(dStore[k].businessObject.extensionElements){
			forEach(dStore[k].businessObject.extensionElements.values, function(v) {
				forEach(v.values, function(value) {
					if(value.dataField){
							var res = value.dataField;
							var assign = res.split("=");
							if(assign.length>1){//is assignment
								assign[0] = clean(assign[0]);
								if(assign[0] != ""){
									Scope.addVariables(scope, [assign[0]]);
									scope.eval(assign[0]+" = "+assign[1]);
								}
							}else{
								res = clean(res);
								if(res != ""){
									Scope.addVariables(scope, [res]);;
								}
							}
					}
				});
			});
		}
	}
	return scope
}
function evaluateDataStores(){
	inputScope = new Scope()
	var elReg = modeler.get('elementRegistry');
	var dInput = elReg.filter(function(el) {
		if (is(el, 'bpmn:DataObjectReference')  ){
			return getBusinessObject(el).dataobjtype && getBusinessObject(el).dataobjtype === 'input' && getBusinessObject(el).dataObjectRef.isCollection
		};
	});
	inputScope = evaluateDataObj(inputScope, dInput)
	globalScope = new Scope()
	var dStore = elReg.filter(function(el) {
		return (is(el, 'bpmn:DataStoreReference'));
	});
	return evaluateDataObj(globalScope, dStore)
}



function evaluateDataObjects(element, scope){
	var elReg = modeler.get('elementRegistry');
	var dObjects = elReg.filter(function(el) {
		return (is(el, 'bpmn:DataObjectReference')  && element.parent === el.parent );
	});
	for(var k = 0; k<dObjects.length; k++){
		var isCollection = getBusinessObject(dObjects[k]).dataObjectRef.isCollection
		var isDataInput = getBusinessObject(dObjects[k]).dataobjtype && getBusinessObject(dObjects[k]).dataobjtype === 'input'
		if(dObjects[k].businessObject.extensionElements){
			forEach(dObjects[k].businessObject.extensionElements.values, function(v) {
				forEach(v.values, function(value) {
					if(value.dataField){
							var res = value.dataField;
							var assign = res.split("=");
							if(assign.length>1){//is assignment
								assign[0] = clean(assign[0]);
								if(assign[0] != ""){
									if(isCollection && !isDataInput){
										Scope.addVariables(scope, [COLLECTION_MARK+assign[0]]);
										scope.eval(COLLECTION_MARK+assign[0]+" = "+assign[1]);
									}
									else if(isCollection && isDataInput){
										var name =  assign[0]
											Scope.addVariables(scope,[name]);
											var unk =  inputScope.eval(name+'.shift()')
											if(typeof unk === 'string'){
												scope.eval(name+" = '"+unk+"'")
											}else {
												scope.eval(name+" = "+unk)
											}
									}
									else{
										Scope.addVariables(scope, [assign[0]]);
										scope.eval(assign[0]+" = "+assign[1]);
									}
								}

							}else{
								res = clean(res);
								if(res != ""){
									if(isCollection){
										Scope.addVariables(scope, [COLLECTION_MARK+res]);
										scope.eval(COLLECTION_MARK+res+" = []");
									}else{
										Scope.addVariables(scope, [res]);
									}
								}
							}
					}
				});
			});
		}
	}
};



function evaluateGuard(activity, scope){
	var guard = getMidaEl(activity, 'Guard', 'exp')
	if(guard===undefined || guard === ''){
		return true;
	}
	var mergedScope = mergeScopes(scope, globalScope);
	return mergedScope.eval(guard);
};

function evaluateCondition(condition, scope){
	var mergedScope = mergeScopes(scope, globalScope);
	return mergedScope.eval(condition);
};

function get_createDataCollectionItem(name, scope, instanceScope ,type){
	name = name.substring(name.indexOf('(')+1, name.indexOf(')'))
	var collection = modeler.get('elementRegistry').filter(function(el) {
		return (el.businessObject.name === name && is(el, 'bpmn:DataObjectReference'));
	});
	if(collection[0].businessObject.extensionElements){
		forEach(collection[0].businessObject.extensionElements.values, function(v) {
			forEach(v.values, function(value) {
				var dField = value.dataField.split('=')[0].trim()
				if(dField){
					Scope.addVariables(scope, [dField])
					Scope.addVariables(instanceScope, [dField])
						scope.eval(dField+" = undefined")
					if(type === 'get'){
						var unk = scope.eval(COLLECTION_MARK+dField+".splice(0, 1)[0]")
						if(typeof unk === 'string'){
							scope.eval(dField+" ='"+unk+"'" )
						}else {
							scope.eval(dField+" ="+ unk)
						}
					}
				}
			});
		});
	}
};

function putDataCollectionItem(name, scope){
	name = name.substring(name.indexOf('(')+1, name.indexOf(')'))
	var collection = modeler.get('elementRegistry').filter(function(el) {
		return (el.businessObject.name === name && is(el, 'bpmn:DataObjectReference'));
	});
	if(collection[0].businessObject.extensionElements){
		forEach(collection[0].businessObject.extensionElements.values, function(v) {
			forEach(v.values, function(value) {
				var dField = value.dataField.split('=')[0].trim()
				var val;
				if(typeof scope.eval(dField) == 'string'){
					val  = '"'+scope.eval(dField)+'"'
				}else if(typeof scope.eval(dField) == 'object'){
					val = JSON.stringify(scope.eval(dField))
				}else{
					val = scope.eval(dField)
				}
				scope.eval( COLLECTION_MARK+dField+".push("+val+")")
			});
		});
	}
};

function applyFn(scope, assignment){
	var unk = assignment.substring(assignment.indexOf('(')+1, assignment.indexOf(')'));
	var val;
	if(typeof unk == 'object'){
		val = scope.eval('JSON.stringify('+unk+')')
	}else{
		val = scope.eval(unk)
	}
	var fn = assignment.substring(0, assignment.indexOf('('))
	var ret;
	if(typeof val === 'string'){
	  ret =	scope.eval(fn+'("'+val+'")')
	}else {
		ret = scope.eval(fn+'('+val+')')
	}
	return [ret,scope]
}

function fnEval(scope, assign){
	var assignment = assign.split('=');
	if(assignment.length === 1){
		scope = applyFn(scope, assignment[0])[1]
	}else {
		var result = applyFn(scope, assignment[1])
		scope = result[1];
		var ret = result[0]
 	 if(typeof ret === 'string'){
 		 scope.eval(assignment[0]+'= "'+ret+'"')
 	 }else {
 		 scope.eval(assignment[0]+'= '+ret)
 	 }
	}
	return scope
}

function randStr(size) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < size; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function randEval(scope, assign){
	var assignment = assign.split('=');
	var max = parseInt(assignment[1].substring(assignment[1].indexOf(',')+1, assignment[1].indexOf(')')))
	var rand;
	if(assignment[1].length > 1){
		if(assignment[1].match(/string/g)){
			rand = randStr(max)
			scope.eval(assignment[0]+' = "'+rand+'"')
		}else{
			rand = Math.floor(Math.random() * max)
			scope.eval(assignment[0]+' = '+rand)
		}
	}
	return scope
}

function evaluateAssignments(activity, scope){
	var mergedScope = mergeScopes(scope, globalScope);
	var hasCollection = false;
	if(activity.businessObject.extensionElements){
		forEach(activity.businessObject.extensionElements.values, function(v) {
			forEach(v.values, function(value) {
				if(value.assignment){
					var assignment = value.assignment;
					var dColl;
					if(assignment.match(/getItem\(([^)]+)\)/g)){
						dColl = assignment.trim()
						hasCollection = true;
						get_createDataCollectionItem(dColl, mergedScope, scope, 'get')
					}else if(assignment.match(/putItem\(([^)]+)\)/g)){
						hasCollection = true;
						dColl = assignment.trim()
						putDataCollectionItem(dColl, mergedScope)
					}else if(assignment.match(/createItem\(([^)]+)\)/g)){
						hasCollection = true;
						dColl = assignment.trim()
						get_createDataCollectionItem(dColl, mergedScope, scope, 'create')
					}else if(assignment.match(/push\(([^)]+)\)/g) || assignment.match(/pop\(([^)]+)\)/g)){
						mergedScope = fnEval(mergedScope, assignment)
					} else if (assignment.match(/random\(([^)]+)\)/g)) {
						mergedScope = randEval(mergedScope, assignment)
					} else {
						mergedScope.eval(assignment);
					}
					unmergeScope(mergedScope, scope)
					unmergeScope(mergedScope, globalScope)
				}
			});
		});
		if(hasCollection){
			//removeTmpItem(scope, )
		}
	}
};

function unmergeScope(from, to){
	forEach(from.names, function(name) {
		try{
			to.eval(name)
			to = copyVariable(from, to, name)
		}catch(e){
			//Do nothing
		}
	});
}

function copyVariable(from, to, name){
	try{
		var x = from.eval(name);
		if(typeof x  === 'object'){
			if(Array.isArray(x)){
				to.eval(name+"= []");
				for(var k =0; k<x.length; k++){
					if(typeof x[k] === 'string'){
						to.eval(name+".push('"+x[k]+"')");
					}else{
						to.eval(name+".push("+x[k]+")");
					}
				}
			}else{
				to.eval(name+"= {}");
				Object.keys(x).forEach(function(key) {
					if(typeof key === 'string'){
						if(typeof x[key] === 'string'){
							to.eval(name+"['"+key+"'] = '"+x[key]+"'");
						}else{
							to.eval(name+"['"+key+"'] = "+x[key]);
						}
					}else{
						if(typeof x[key] === 'string'){
							to.eval(name+"["+key+"] = '"+x[key]+"'");
						}else{
							to.eval(name+"["+key+"] = "+x[key]);
						}
					}
				});
			}
		}else{
			if(typeof x === 'string'){
				to.eval(name+" = '"+x+"'");
			}else {
				to.eval(name+" = "+x);
			}
		}
		return to
	}catch(e){}
}

function clean(exp){
	exp = exp.replace('var', '');
	exp = exp.replace(/\s/g, '');
	return exp;
}

function prepareMessage(element, scope){
	if(element.businessObject.extensionElements){
		var msg = [];
		var mergedScope = mergeScopes(scope, globalScope);
		forEach(element.businessObject.extensionElements.values, function(v) {
			forEach(v.values, function(value) {
				if(value.field){
						var tmp =mergedScope.eval(value.field);
						if(typeof tmp === 'string' && (tmp.includes("\'") || tmp.includes("\""))){
							tmp = tmp.replace(/\'/g, '')
							tmp = tmp.replace(/\"/g, '')
						}
						if(value.field === tmp){ //Costant field
							msg.push(messageFields[i]);
						}else {
							msg.push(tmp);
						}

				}
			});
		});
		return msg;
	}
};

function prepareTemplate(templ){
	var fields = [], corr = [];
	forEach(templ, function(v) {
		forEach(v.values, function(value) {
			if(value.field){
				fields.push(value.field);
				corr.push(value.isCorrelation);
			}
		});
	});
	return [fields, corr];
}


function patterMatching(msg, templ){
console.log([msg,templ]);
	var template = templ.template[0];
	var isCorrelation = templ.template[1];
	var message = msg; //Already evalued
	var scope = mergeScopes(templ.scope, globalScope);
	if( (template.length - message.length )!= 0){
		console.log('Message lenght != Template length')
		return false;
	}
	var operations = [];
	var match = true;
	for(var i = 0; i<template.length; i++){

		var field = template[i];
		if(isCorrelation[i]){ //patterMatching field
			if(scope.eval(field)!=message[i]){
				console.log('NO patterMatching')
				match = false;
			}
		}else{
			if(typeof message[i] === 'string'){
				operations.push(field +" = '"+message[i]+"'");
			}else if(typeof message[i] === 'boolean' || typeof message[i] === 'number' ){
				operations.push(field +" = "+message[i]);
			}else if(typeof message[i] === 'object'){
				operations.push(field +" = "+JSON.stringify(message[i]));
			}else{
				if(message[i].length >1 && typeof message[i][0] === 'string'){
					for(var k =0; k<message[i].length; k++){
						message[i][k] = "'"+message[i][k]+"'";
					}
				}
				operations.push(field +" = ["+message[i]+"]");
			}
		}
	}
	if (!match){
		console.log('NO patterMatching')
		return false;
	}
	operations.forEach(function(op){
		var mergedScope = mergeScopes(templ.scope, globalScope);
		mergedScope.eval(op)
		unmergeScope(mergedScope, templ.scope)
		unmergeScope(mergedScope, globalScope)
	});
	console.log('YES patterMatching')
	return true;
};



function mergeScopes(scope1, scope2){
	if(!scope1 || scope1.names.length === 0){
		return scope2;}
	if(!scope2 || scope2.names.length === 0){
		return scope1;}
	var mergedScope = new Scope();
	forEach(scope1.names, function(name) {
		Scope.addVariables(mergedScope, [name]);
		copyVariable(scope1, mergedScope, name);
	});

	forEach(scope2.names, function(name) {
		Scope.addVariables(mergedScope, [name]);
		copyVariable(scope2, mergedScope, name);
	});
	return mergedScope
}

Data.$inject = [ 'eventBus', 'animation', 'elementRegistry', 'log',
		'elementNotifications', 'canvas', 'processInstances' ];

module.exports = Data;
module.exports.evaluateCondition = evaluateCondition;
module.exports.evaluateDataStores = evaluateDataStores;
module.exports.evaluateDataObjects = evaluateDataObjects;
module.exports.evaluateGuard = evaluateGuard;
module.exports.evaluateAssignments = evaluateAssignments;
module.exports.prepareMessage = prepareMessage;
module.exports.prepareTemplate = prepareTemplate;
module.exports.patterMatching = patterMatching;
