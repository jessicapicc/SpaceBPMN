'use strict';

const axios = require('axios');
var domify = require('min-dom/dist').domify,
    domClasses = require('min-dom/dist').classes,
    domEvent = require('min-dom/dist').event,
    domQuery = require('min-dom/dist').query;



var elementHelper = require('../../util/ElementHelper'),
    getBusinessObject = elementHelper.getBusinessObject,
    is = elementHelper.is,
    isTypedEvent = elementHelper.isTypedEvent;

var events = require('../../util/EventHelper'),
    TOGGLE_MODE_EVENT = events.TOGGLE_MODE_EVENT;

var address;

function ModelSaver(eventBus, canvas) {
  var self = this;

  this._canvas = canvas;


  // eventBus.on(TOGGLE_MODE_EVENT, function(context) {
  //   var simulationModeActive = context.simulationModeActive;
  //
  //   if (simulationModeActive) {
  //     modeler.saveXML({
  // 			format : true
  // 		}, function(err, xml) {
  // 			if (err) {
  // 				return console.error('could not save BPMN 2.0 diagram', err);
  // 			}
  //       else{
  //         saveModel(xml)
  //       }
  // 		});
  //   }
  // });
}


function saveModel(xml) {
   var json = {};
   json['xml'] = xml.replace(/[\r\n]+/gm, "");
   json['address'] = getAddress();

const xhr = new XMLHttpRequest();

xhr.open('POST', 'http://localhost:3001/saver');
//xhr.setRequestHeader('Access-Control-Allow-Headers' 'Content-Type');
//xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
xhr.setRequestHeader('Content-Type', 'application/json');
console.log(JSON.stringify(json));
xhr.send(JSON.stringify(json));
// axios.post('http://pros.unicam.it:8080/ModelSaver/save',
// JSON.stringify(json),   {headers: {
//       'Content-Type': 'application/json;charset=UTF-8',
//       "Access-Control-Allow-Origin": "*",
//   }}
// )
// .then((res) => {
// console.log(`statusCode: ${res.statusCode}`)
// console.log(res)
// })
// .catch((error) => {
// console.error(error)
// })
};

function getAddress() {
  var xmlhttp;
    if (window.XMLHttpRequest) xmlhttp = new XMLHttpRequest();
    else xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");

    xmlhttp.open("GET","http://ip-api.com/json/",false);
    xmlhttp.send();
  return xmlhttp.responseText

}

ModelSaver.$inject = [ 'eventBus', 'canvas' ];

module.exports = ModelSaver;
