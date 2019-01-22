module.exports = function (classes){
  'use strict';

  var debug = require('debug')('jsonrpc');

  var EventEmitter = classes.ES5Class.$define('EventEmitter', {}, {
    /**
     * Output a piece of debug information.
     */
    trace : function (direction, message){
      var msg = '   ' + direction + '   ' + message;
      debug(msg);
      return msg;
    },
    /**
     * Check if current request has an id adn it is of type integer (non fractional) or string.
     *
     * @param {Object} request
     * @return {Boolean}
     */
    hasId : function (request) {
      return request && typeof request['id'] !== 'undefined' &&
      (
        (typeof(request['id']) === 'number' && /^\-?\d+$/.test(request['id'])) ||
        (typeof(request['id']) === 'string') || (request['id'] === null)
      );
    }
  }).$inherit(require('eventemitter3'), []);

  return EventEmitter;
};

