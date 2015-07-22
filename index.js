'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('meshblu-cam')
var av = require('audiovideo');
var fs = require('fs');
var base64Img = require('base64-img');
var _ = require("underscore");
var interval = 1500;

var MESSAGE_SCHEMA = {
  type: 'object',
  properties: {
    exampleBoolean: {
      type: 'boolean',
      required: true
    }
  }
};


function Plugin(){
  this.options = {};
  this.messageSchema = MESSAGE_SCHEMA;
  return this;
}
util.inherits(Plugin, EventEmitter);

Plugin.prototype.CameraOn = function(){

var self = this;

av.acquireCamera(function (err, camera) {
setInterval(function() {

  camera.captureShot('jpeg').pipe(fs.createWriteStream('out.jpg'));

  base64Img.base64('out.jpg', function(err, data) {
    var image = data;
    //console.log(image);
    var payload =  {
      "pictures": image
    };

    self.emit('message',{
      devices: ['*'], payload: payload
      });

  })
}, interval);
});

};

Plugin.prototype.onMessage = function(message){
  var payload = message.payload;
};

Plugin.prototype.onConfig = function(device){
  this.setOptions(device.options||{});

  var self = this;

  interval = device.options.interval || 1500;



};

Plugin.prototype.setOptions = function(options){
  this.options = options;
};

module.exports = {
  messageSchema: MESSAGE_SCHEMA,
  Plugin: Plugin
};
