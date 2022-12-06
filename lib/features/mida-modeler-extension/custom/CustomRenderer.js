import inherits from 'inherits';

import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import BpmnRenderer from 'bpmn-js/lib/draw/BpmnRenderer';

import {
  componentsToPath,
  createLine
} from 'diagram-js/lib/util/RenderUtil';

import {
  isObject,
  assign,
  forEach
} from 'min-dash';

import {
  isTypedEvent,
  isThrowEvent,
  isCollection,
  getDi,
  getSemantic,
  getCirclePath,
  getRoundRectPath,
  getDiamondPath,
  getRectPath,
  getFillColor,
  getStrokeColor
} from 'bpmn-js/lib/draw/BpmnRenderUtil';

import {
  getScaledPath
} from './PathMap';

import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  classes as svgClasses
} from 'tiny-svg';

var DEFAULT_FILL_OPACITY = .95,
    HIGH_FILL_OPACITY = .35;

/**
 * A renderer that knows how to render custom elements.
 */
export default function CustomRenderer(
  config, eventBus, styles, pathMap,
  canvas, textRenderer, priority)
{
  BpmnRenderer.call(this, config, eventBus, styles, pathMap,
    canvas, textRenderer, priority);

  var defaultFillColor = config && config.defaultFillColor,
      defaultStrokeColor = config && config.defaultStrokeColor;

  var tokenRegex = /\{([^}]+)\}/g,
      objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g;

  var computeStyle = styles.computeStyle;

  function renderer(type)
  {
    return handlers[type];
  }

  var handlers = this.handlers = {
    'custom:data-input': function(parentGfx, element)
    {
      var rawPath = {
        d:'m 0,0 25.098039215686274,0 6.2745098039215685,6.557377049180327 0,32.78688524590164 '+
        '-31.372549019607842,0 0,-39.34426229508196 25.098039215686274,0 '+
        '0,6.557377049180327 6.2745098039215685,0 ',
        height: 61,
        width:  51,
        heightElements: [10, 50, 60],
        widthElements: [10, 40, 50, 60]
      };
      var arrowPathData = {
      d:'m 5,9 9,0 0,-3 5,5 -5,5 0,-3 -9,0 z',
      height: 61,
      width:  51,
      heightElements: [],
      widthElements: []
      };
      // positioning
    // compute the start point of the path
    var mx, my;
    var param = {
      xScaleFactor: 1,
      yScaleFactor: 1,
      containerWidth: element.width,
      containerHeight: element.height,
      position: {
        mx: 0.474,
        my: 0.296
      }
    };
    if (param.abspos) {
      mx = param.abspos.x;
      my = param.abspos.y;
    } else {
      mx = param.containerWidth * param.position.mx;
      my = param.containerHeight * param.position.my;
    }

    var coordinates = {}; // map for the scaled coordinates
    if (param.position) {

      // path
      var heightRatio = (param.containerHeight / rawPath.height) * param.yScaleFactor;
      var widthRatio = (param.containerWidth / rawPath.width) * param.xScaleFactor;


      // Apply height ratio
      for (var heightIndex = 0; heightIndex < rawPath.heightElements.length; heightIndex++) {
        coordinates['y' + heightIndex] = rawPath.heightElements[heightIndex] * heightRatio;
      }

      // Apply width ratio
      for (var widthIndex = 0; widthIndex < rawPath.widthElements.length; widthIndex++) {
        coordinates['x' + widthIndex] = rawPath.widthElements[widthIndex] * widthRatio;
      }
    }

    // Apply value to raw path
    var path = format(
      rawPath.d, {
        mx: mx,
        my: my,
        e: coordinates
      }
    );

      var pathData = path;
      var elementObject = drawPath(parentGfx, pathData, {
        fill: 'white',
        strokeWidth: '2px',
        fillOpacity: 0.95,
        stroke: 'black'
      });

      /* input arrow path */
      drawPath(parentGfx, arrowPathData.d, { strokeWidth: 1 });

      return elementObject;
    },
    'custom:data-output': function(parentGfx, element)
    {
      var rawPath = {
        d:'m 0,0 25.098039215686274,0 6.2745098039215685,6.557377049180327 0,32.78688524590164 '+
        '-31.372549019607842,0 0,-39.34426229508196 25.098039215686274,0 '+
        '0,6.557377049180327 6.2745098039215685,0 ',
        height: 61,
        width:  51,
        heightElements: [10, 50, 60],
        widthElements: [10, 40, 50, 60]
      };
      var arrowPathData = {
      d:'m 5,9 9,0 0,-3 5,5 -5,5 0,-3 -9,0 z',
      height: 61,
      width:  51,
      heightElements: [],
      widthElements: []
      };
      // positioning
    // compute the start point of the path
    var mx, my;
    var param = {
      xScaleFactor: 1,
      yScaleFactor: 1,
      containerWidth: element.width,
      containerHeight: element.height,
      position: {
        mx: 0.474,
        my: 0.296
      }
    };
    if (param.abspos) {
      mx = param.abspos.x;
      my = param.abspos.y;
    } else {
      mx = param.containerWidth * param.position.mx;
      my = param.containerHeight * param.position.my;
    }

    var coordinates = {}; // map for the scaled coordinates
    if (param.position) {

      // path
      var heightRatio = (param.containerHeight / rawPath.height) * param.yScaleFactor;
      var widthRatio = (param.containerWidth / rawPath.width) * param.xScaleFactor;


      // Apply height ratio
      for (var heightIndex = 0; heightIndex < rawPath.heightElements.length; heightIndex++) {
        coordinates['y' + heightIndex] = rawPath.heightElements[heightIndex] * heightRatio;
      }

      // Apply width ratio
      for (var widthIndex = 0; widthIndex < rawPath.widthElements.length; widthIndex++) {
        coordinates['x' + widthIndex] = rawPath.widthElements[widthIndex] * widthRatio;
      }
    }

    // Apply value to raw path
    var path = format(
      rawPath.d, {
        mx: mx,
        my: my,
        e: coordinates
      }
    );

      var pathData = path;
      var elementObject = drawPath(parentGfx, pathData, {
        fill: 'white',
        strokeWidth: '2px',
        fillOpacity: 0.95,
        stroke: 'black'
      });

      /* input arrow path */
      drawPath(parentGfx, arrowPathData.d, {
        fill:'black',
        strokeWidth: 1
      });

      return elementObject;
    }
  }
  this.drawTriangle = function(p, side)
  {
    var halfSide = side / 2,
        points,
        attrs;

    points = [ halfSide, 0, side, side, 0, side ];

    attrs = computeStyle(attrs, {
      stroke: '#3CAA82',
      strokeWidth: 2,
      fill: '#3CAA82'
    });

    var polygon = svgCreate('polygon');

    svgAttr(polygon, {
      points: points
    });

    svgAttr(polygon, attrs);

    svgAppend(p, polygon);

    return polygon;
  };

  this.getTrianglePath = function(element)
  {
    var x = element.x,
        y = element.y,
        width = element.width,
        height = element.height;

    var trianglePath = [
      ['M', x + width / 2, y],
      ['l', width / 2, height],
      ['l', -width, 0 ],
      ['z']
    ];

    return componentsToPath(trianglePath);
  };

  function drawPath(parentGfx, d, attrs)
  {
    attrs = computeStyle(attrs, [ 'no-fill' ], {
      strokeWidth: 2,
      stroke: 'black'
    });

    var path = svgCreate('path');
    svgAttr(path, { d: d });
    svgAttr(path, attrs);

    svgAppend(parentGfx, path);

    return path;
  }

  function format(str, obj) {
    return String(str).replace(tokenRegex, function(all, key) {
      return replacer(all, key, obj);
    });
  }

  this.drawCustomConnection = function(p, element) {
    var attrs = computeStyle(attrs, {
      stroke: '#ff471a',
      strokeWidth: 2
    });

    return svgAppend(p, createLine(element.waypoints, attrs));
  };

  this.getCustomConnectionPath = function(connection) {
    var waypoints = connection.waypoints.map(function(p) {
      return p.original || p;
    });

    var connectionPath = [
      ['M', waypoints[0].x, waypoints[0].y]
    ];

    waypoints.forEach(function(waypoint, index) {
      if (index !== 0) {
        connectionPath.push(['L', waypoint.x, waypoint.y]);
      }
    });

    return componentsToPath(connectionPath);
  };
}

inherits(CustomRenderer, BaseRenderer);

CustomRenderer.$inject = [
  'config.bpmnRenderer',
  'eventBus',
  'styles',
  'pathMap',
  'canvas',
  'textRenderer' ];


CustomRenderer.prototype.canRender = function(element) {
  return /^custom:/.test(element.type);
};

CustomRenderer.prototype.drawShape = function(p, element) {
  var type = element.type;
  var h = this.handlers[type];

  if (type === 'custom:triangle')
  {
    return this.drawTriangle(p, element.width);
  }

  if (type === 'custom:data-input' || type === 'custom:data-output')
  {
    return h(p, element);
  }
};

CustomRenderer.prototype.getShapePath = function(shape) {
  var type = shape.type;

  if (type === 'custom:triangle') {
    return this.getTrianglePath(shape);
  }

  if (type === 'custom:data-input' || type === 'custom:data-output')
  {
    return getRectPath(element);
  }
};

CustomRenderer.prototype.drawConnection = function(p, element) {

  var type = element.type;

  if (type === 'custom:connection')
  {
    return this.drawCustomConnection(p, element);
  }
};


CustomRenderer.prototype.getConnectionPath = function(connection) {

  var type = connection.type;

  if (type === 'custom:connection')
  {
    return this.getCustomConnectionPath(connection);
  }
};
