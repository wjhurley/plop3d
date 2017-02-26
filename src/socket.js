/* global io location navigator */

var host = location.protocol + '//' + location.host;
var socket = io(host);
window.socket = socket;
var stroke = null;
var strokes = [];
var shapes = {
  cube: 'cubes',
  sphere: 'spheres'
};

document.addEventListener('DOMContentLoaded', function () {
  var brushSystem = document.querySelector('a-scene').systems.brush;
  socket.on('plop', function (shape) {
    brushSystem.addShape(shapes[shape] || shape);
  });
  socket.on('stroke', function (data) {
    brushSystem.addEvent(data);
  });
});

socket.on('connect', function () {
  var room = location.pathname.split('/')[2];
  socket.emit('join', room);
});

// These are just some desktop and mobile device events.
// TODO: Figure out what events actually get sent by the VIVE.
var types = {
  mousedown: 'start',
  mousemove: 'move',
  mouseup: 'end',
  touchstart: 'start',
  touchmove: 'move',
  touchend: 'end'
};

for (var type in types) {
  document.addEventListener(type, relay);
}

function relay (event) {
  var type = types[event.type];

  // Start or stop a stroke.
  if (type === 'start') {
    stroke = new Stroke();
  } else if (type === 'stop') {
    strokes.push(stroke);
    stroke = null;
  }

  if (!stroke) {
    return;
  }

  var x = event.x || event.pageX;
  var y = event.y || event.pageY;
  var z = event.z || event.pageZ || 0; // Doesn't actually exist now.
  var t = Date.now();
  var data = { type: type, x: x, y: y, z: z, t: t };
  socket.emit('event', data);
  stroke.add(x, y, z, t);
}

function Stroke () {
  this.points = [];
}

function Point(x, y, z, t) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.t = t;
}

Stroke.prototype.add = function(x, y, z, t) {
  this.points.push(new Point(x, y, z, t));
};
