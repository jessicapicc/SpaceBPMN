'use strict';


var domify = require('min-dom/dist').domify,
    domClasses = require('min-dom/dist').classes,
    domEvent = require('min-dom/dist').event,
    domQuery = require('min-dom/dist').query,
    domQueryAll = require('min-dom/dist').queryAll,
    domClear = require('min-dom/dist').clear;


var events = require('../../util/EventHelper'),
    TOGGLE_MODE_EVENT = events.TOGGLE_MODE_EVENT;

function SetAnimationSpeed(canvas, animation, eventBus) {
  var self = this;

  this._canvas = canvas;
  this._animation = animation;
  this._eventBus = eventBus;

  this._init();

  eventBus.on(TOGGLE_MODE_EVENT, function(context) {
    var simulationModeActive = context.simulationModeActive;

    if (!simulationModeActive) {
      document.getElementById('speed-palette').style.display = 'none';
      // domClasses(self.container).add('hidden');
    } else {
      document.getElementById('speed-palette').style.display = 'block';
    }
  });
}

SetAnimationSpeed.prototype._init = function() {
  var self = this;


  	document.getElementById('speed-palette').innerHTML = '<div  style="float:left;"><i title="Set Animation Speed" class="fa fa-tachometer" aria-hidden="true"></i> Speed&emsp;</div>'+
        '<div title="Slow" id="animation-speed-1" style="padding:0px 8px 0px 8px; float:left;"><i class="fa fa-caret-right" aria-hidden="true"></i> 1x</div>' +
        '<div title="Normal" id="animation-speed-2" style="padding:0px 8px 0px 8px; float:left;"><i class="fa fa-caret-right" aria-hidden="true"></i><i class="fa fa-caret-right" aria-hidden="true"></i> 2x</div>' +
        '<div title="Fast" id="animation-speed-3" style="padding:0px 8px 0px 8px; float:left;"><i class="fa fa-caret-right" aria-hidden="true"></i><i class="fa fa-caret-right" aria-hidden="true"></i><i class="fa fa-caret-right" aria-hidden="true"></i> 3x</div>' ;


  var speed1 = document.getElementById('animation-speed-1'),
      speed2 = document.getElementById('animation-speed-2'),
      speed3 = document.getElementById('animation-speed-3');

  domEvent.bind(speed1, 'click', function() {
    self.setActive(speed1);
    document.getElementById('animation-speed-1').style.borderBottom ='2px solid';
    document.getElementById('animation-speed-2').style.borderBottom ='0px solid';
    document.getElementById('animation-speed-3').style.borderBottom ='0px solid';
    self._animation.setAnimationSpeed(0.5);
  });

  domEvent.bind(speed2, 'click', function() {
    self.setActive(speed2);
    document.getElementById('animation-speed-1').style.borderBottom ='0px solid';
    document.getElementById('animation-speed-2').style.borderBottom ='2px solid';
    document.getElementById('animation-speed-3').style.borderBottom ='0px solid';
    self._animation.setAnimationSpeed(1);
  });

  domEvent.bind(speed3, 'click', function() {
    self.setActive(speed3);
    document.getElementById('animation-speed-1').style.borderBottom ='0px solid';
    document.getElementById('animation-speed-2').style.borderBottom ='0px solid';
    document.getElementById('animation-speed-3').style.borderBottom ='2px solid';
    self._animation.setAnimationSpeed(1.5);
  });

//  this._canvas.getContainer().appendChild(this.container);
};

SetAnimationSpeed.prototype.setActive = function(element) {
  // domQueryAll('.animation-speed-button', this.container).forEach(function(button) {
  //   // domClasses(button).remove('active');
  // });

  // domClasses(element).add('active');
};

SetAnimationSpeed.$inject = [ 'canvas', 'animation', 'eventBus' ];

module.exports = SetAnimationSpeed;
