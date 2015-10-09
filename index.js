'use strict';
var util          = require('util');
var EventEmitter  = require('events').EventEmitter;
var debug         = require('debug')('meshblu-cam')
var MeshbluConfig = require('meshblu-config');
var meshbluConfig = new MeshbluConfig({});
var meshbluJSON   = meshbluConfig.toJSON();
var av            = require('audiovideo');
var fs            = require('fs');
var base64Img     = require('base64-img');
var _             = require("lodash");

var cameratwo;

var SURL = "https://s3-us-west-2.amazonaws.com/octoblu.com/camera.html?uuid=" + meshbluJSON.uuid + "&token=" + meshbluJSON.token + "&camera=" + meshbluJSON.uuid;

var MESSAGE_SCHEMA = {
  "type": 'object',
  "properties": {
    "snapshot": {
      "type": "boolean",
      "title": "Take picture",
      "default": true
    },
    "send_as_raw": {
      "type": "boolean",
      "title": "Raw base64 (works with twitter)",
      "default": false
    }
  }
};

var OPTIONS_FORM = [
  {
    "type": "help",
    "helpvalue": SURL
  },
  "interval"
];

var OPTIONS_SCHEMA = {
  "type": "object",
  "properties": {
    "interval": {
      "type": 'number',
      "description": SURL,
      "enum": [1500, 2000, 3000, 4000, 5000, 6000, 10000],
      "required": true,
      "default": 1500
    },
    "broadcast": {
      "type": "boolean",
      "title": "broadcast at interval?",
      "default": false
    }
  }
};

function Plugin(){
  this.options = {};
  this.messageSchema = MESSAGE_SCHEMA;
  this.optionsSchema = OPTIONS_SCHEMA;
  this.optionsForm = OPTIONS_FORM;
  this.running = false;
  return this;
}
util.inherits(Plugin, EventEmitter);

Plugin.prototype.CameraOn = function(){
  var self = this;
  self.running = true;
  av.acquireCamera(function (err, camera) {
    cameratwo = camera;
    setInterval(function() {
      if(self.options.broadcast){
        camera.captureShot('jpeg').pipe(fs.createWriteStream('out.jpg'));
        base64Img.base64('out.jpg', function(err, data) {
          var image = data;
          var payload =  {
            "pictures": image
          };
          self.emit('message', { devices: ['*'], payload: {pictures: image} });
        });
      }
    }, self.options.interval);
  });
};

Plugin.prototype.onMessage = function(message){
  var self = this;
  var payload = message.payload;
  if(payload.snapshot){
    cameratwo.captureShot('jpeg').pipe(fs.createWriteStream('out.jpg'));
    base64Img.base64('out.jpg', function(err, data) {
      if(payload.send_as_raw == false){
          self.emit('message', { devices: ['*'], "payload": {"pictures": data} });
        }else if(payload.send_as_raw == true){
          var data = fs.readFileSync('out.jpg', { encoding: 'base64' });
          self.emit('message', { "devices": ['*'], "payload": {"pictures": data}});
        }
    });
   }
};

Plugin.prototype.onConfig = function(device){
  var self = this;
  self.setOptions(device.options||{});

  if(self.running){
    return;
  }
  self.CameraOn();
};

Plugin.prototype.setOptions = function(options){
  this.options = _.defaults(options, {interval: 1500});
};

module.exports = {
  messageSchema: MESSAGE_SCHEMA,
  optionsSchema: OPTIONS_SCHEMA,
  optionsForm: OPTIONS_FORM,
  Plugin: Plugin
};
