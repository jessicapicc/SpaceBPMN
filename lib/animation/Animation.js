'use strict';

var SVG = require('svg.js');

var domQuery = require('min-dom/dist').query;

var events = require('../util/EventHelper'),
    TOGGLE_MODE_EVENT = events.TOGGLE_MODE_EVENT,
    GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT,
    CONSUME_TOKEN_EVENT = events.CONSUME_TOKEN_EVENT,
    GENERATE_MESSAGE_TOKEN_EVENT = events.GENERATE_MESSAGE_TOKEN_EVENT,
    CONSUME_MESSAGE_TOKEN_EVENT = events.CONSUME_MESSAGE_TOKEN_EVENT,
    RESET_SIMULATION_EVENT = events.RESET_SIMULATION_EVENT,
    PLAY_SIMULATION_EVENT = events.PLAY_SIMULATION_EVENT,
    PAUSE_SIMULATION_EVENT = events.PAUSE_SIMULATION_EVENT,
    TERMINATE_EVENT = events.TERMINATE_EVENT,
    PROCESS_INSTANCE_FINISHED_EVENT = events.PROCESS_INSTANCE_FINISHED_EVENT,
    ANIMATION_CREATED_EVENT = events.ANIMATION_CREATED_EVENT;

var isAncestor = require('../util/ElementHelper').isAncestor;

var geometryUtil = require('../util/GeometryUtil'),
    distance = geometryUtil.distance;
var fixedTime = 2000.0;

function isFirstSegment(index) {
  return index === 1;
}

function isSingleSegment(waypoints) {
  return waypoints.length == 2;
}

var DELAY = 0;

var EASE_LINEAR = '-',
    EASE_IN = '<',
    EASE_OUT = '>',
    EASE_IN_OUT = '<>';

var TOKEN_SIZE = 20;

function Animation(canvas, eventBus) {
  var self = window.animation = this;

  this._eventBus = eventBus;

  this.animations = [];
  this.hiddenAnimations = [];

  this.messageAnimations = [];
  this.messageHiddenAnimations = [];

  this.animationSpeed = 1;

  eventBus.on('import.done', function() {
    var draw = SVG(canvas._svg);

    var viewport = domQuery('.viewport', canvas._svg);

    var groupParent = SVG.adopt(viewport);

    self.group = draw
      .group()
      .attr('id', 'token-simulation');
    self.group = draw
    .group()
    .attr('id', 'message-token-simulation');

    groupParent.put(self.group);
  });

  eventBus.on(TERMINATE_EVENT, function(context) {
    var element = context.element,
        parent = element.parent;

    self.animations.forEach(function(animation) {
      if (isAncestor(parent, animation.element) && animation.processInstanceId === context.processInstanceId) {
        animation.animation.stop();

        self.animations = self.animations.filter(function(a) {
          return a !== animation;
        });
      }
    });
    self.messageAnimations.forEach(function(messageAnimation) {
        if (isAncestor(parent, messageAnimation.element) && messageAnimation.processInstanceId === context.processInstanceId) {
        	messageAnimation.animation.stop();

          self.messageAnimations = self.messageAnimations.filter(function(a) {
            return a !== messageAnimation;
          });
        }
      });
  });

  eventBus.on(PROCESS_INSTANCE_FINISHED_EVENT, function(context) {
    var parent = context.parent;

    if (!parent.parent) {
      self.animations.forEach(function(animation) {
        if (isAncestor(parent, animation.element)) {
          animation.animation.stop();

          self.animations = self.animations.filter(function(a) {
            return a !== animation;
          });
        }
      });
      self.messageAnimations.forEach(function(messageAnimations) {
          if (isAncestor(parent, messageAnimations.element)) {
        	  messageAnimations.animation.stop();

            self.messageAnimations = self.messageAnimations.filter(function(a) {
              return a !== messageAnimations;
            });
          }
        });
    }
  });

  eventBus.on(RESET_SIMULATION_EVENT, function() {
    self.animations.forEach(function(animation) {
      animation.animation.stop();
    });

    self.messageAnimations.forEach(function(messageAnimations) {
    	messageAnimations.animation.stop();
      });

    self.animations = [];
    self.hiddenAnimations = [];

    self.messageAnimations = [];
    self.messageHiddenAnimations = [];
  });

  eventBus.on(PAUSE_SIMULATION_EVENT, function() {
    self.animations.forEach(function(animation) {
      animation.animation.pause();
    });

    self.messageAnimations.forEach(function(messageAnimations) {
    messageAnimations.animation.pause();
      });
  });

  eventBus.on(PLAY_SIMULATION_EVENT, function() {
    self.animations.forEach(function(animation) {
      animation.animation.play();
    });

    self.messageAnimations.forEach(function(messageAnimations) {
    	messageAnimations.animation.play();
      });
  });
}

Animation.prototype.createAnimation = function(connection, processInstanceId, done) {
  var self = this;

  if (!this.group) {
    return;
  }

  var tokenGfx = this._createTokenGfx(processInstanceId);

  var animation;

  animation = new _Animation(tokenGfx, connection.waypoints, processInstanceId,function() {
    self.animations = self.animations.filter(function(a) {
      return a.animation !== animation;
    });

    if (done) {
      done();
    }
  });

  if (this.hiddenAnimations.includes(processInstanceId)) {
  }

  tokenGfx.fx._speed = this.animationSpeed;

  this.animations.push({
    tokenGfx: tokenGfx,
    animation: animation,
    element: connection,
    processInstanceId: processInstanceId
  });

  this._eventBus.fire(ANIMATION_CREATED_EVENT, {
    tokenGfx: tokenGfx,
    animation: animation,
    element: connection,
    processInstanceId: processInstanceId
  });

  return animation;
};

Animation.prototype.createMessageAnimation = function(connection, processInstanceId, done) {
	  var self = this;

	  if (!this.group) {
	    return;
	  }

	  var messageTokenGfx = this._createMessageTokenGfx(processInstanceId);

	  var animation;

	  animation = new _Animation(messageTokenGfx, connection.waypoints,processInstanceId,  function() {
	    self.messageAnimations = self.messageAnimations.filter(function(a) {
	      return a.animation !== animation;
	    });

	    if (done) {
	      done();
	    }
	  });


	  if (this.hiddenAnimations.includes(processInstanceId)) {
	    messageTokenGfx.hide();
	  }

	  messageTokenGfx.fx._speed = this.animationSpeed;


	  this.messageAnimations.push({
		  tokenGfx: messageTokenGfx,
		  animation: animation,
		    element: connection,
		    processInstanceId: processInstanceId
		  });

	  this._eventBus.fire(ANIMATION_CREATED_EVENT, {
		  tokenGfx: messageTokenGfx,
		  animation: animation,
	    element: connection,
	    processInstanceId: processInstanceId
	  });

	  return animation;
	};

	Animation.prototype.setAnimationSpeed = function(speed) {
		  this.animations.forEach(function(animation) {
		    animation.tokenGfx.fx._speed = speed;
		  });

		  this.animationSpeed = speed;
		};

Animation.prototype._createTokenGfx = function(processInstanceId) {
  var parent = this.group
    .group()
    .attr('class', 'token')
    .hide();

  parent
    .circle(TOKEN_SIZE, TOKEN_SIZE)
    .attr('fill', '#bfa100')
    .attr('animation', 'jump 1s infinite')
    .attr('animation-timing-function', 'ease')
    .attr('class', 'circle');

  parent
    .text(processInstanceId.toString())
    .attr('transform', 'translate(10, -7)')
    .attr('text-anchor', 'middle')
    .attr('class', 'text');

  return parent;
};

Animation.prototype._createMessageTokenGfx = function(processInstanceId) {
	  var parent = this.group
	    .group()
	    .attr('class', 'message-token')
	    .hide();

	  parent
	    .circle(TOKEN_SIZE, TOKEN_SIZE)
	    .attr('fill', '#008000')
	    .attr('class', 'circle');

	  parent
	    .text(processInstanceId.toString())
	    .attr('transform', 'translate(10, -7)')
	    .attr('text-anchor', 'middle')
	    .attr('class', 'text');

	  return parent;
	};

Animation.prototype.showProcessInstanceAnimations = function(processInstanceId) {
  this.animations.forEach(function(animation) {
    if (animation.processInstanceId === processInstanceId) {
      animation.tokenGfx.show();
    }
  });

  this.hiddenAnimations = this.hiddenAnimations.filter(function(id) {
    return id !== processInstanceId;
  });
};

Animation.prototype.hideProcessInstanceAnimations = function(processInstanceId) {
  this.animations.forEach(function(animation) {
    if (animation.processInstanceId === processInstanceId) {
      animation.tokenGfx.hide();
    }
  });
	  this.hiddenAnimations.push(processInstanceId);
};

Animation.$inject = [ 'canvas', 'eventBus' ];

module.exports = Animation;

function _Animation(gfx, waypoints, processInstanceId, done) {
  this.gfx = this.fx = gfx;
  this.waypoints = waypoints;
  this.done = done;
  this.create(processInstanceId);
}

_Animation.prototype.create = function(id) {
  var self = this;

  var gfx = this.gfx,
      waypoints = this.waypoints,
      done = this.done,
      fx = this.fx;

  gfx
    .show()
    .move(waypoints[0].x - TOKEN_SIZE / 2, waypoints[0].y - TOKEN_SIZE / 2);
  // Set same duration for each seq flow
var duration = (id*100+2000.0)/ (waypoints.length-1);

  waypoints.forEach(function(waypoint, index) {
    if (index > 0) {
      var x = waypoint.x - TOKEN_SIZE / 2,
          y = waypoint.y - TOKEN_SIZE / 2;

      var ease = isFirstSegment(index) ? EASE_IN : EASE_LINEAR;

      if (isSingleSegment(waypoints)) {
        ease = EASE_IN_OUT;
      }

// var duration = distance(waypoints[index - 1], waypoint) * 20;

      fx = fx
        .animate(duration, ease, DELAY)
        .move(x, y);
    }
  });

  fx.after(function() {
    gfx.remove();

    done();
  });
};

_Animation.prototype.play = function() {
  this.gfx.play();
};

_Animation.prototype.pause = function() {
  this.gfx.pause();
};

_Animation.prototype.stop = function() {
  this.fx.stop();
  this.gfx.remove();
};
