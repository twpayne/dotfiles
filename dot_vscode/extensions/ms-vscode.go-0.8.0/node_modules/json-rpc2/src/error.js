module.exports = function (classes){
  'use strict';

  /*
   JSON-RPC 2.0 Specification Errors codes by dcharbonnier
   */
  var Errors = {};

  Errors.AbstractError = classes.ES5Class.$define('AbstractError', {
    construct: function(message, extra){
      this.name = this.$className;
      this.extra = extra || {};
      this.message = message || this.$className;

      Error.captureStackTrace(this, this.$class);
    },
    toString: function(){
      return this.message;
    }
  }).$inherit(Error, []);

  Errors.ParseError = Errors.AbstractError.$define('ParseError', {
    code: -32700
  });

  Errors.InvalidRequest = Errors.AbstractError.$define('InvalidRequest', {
    code: -32600
  });

  Errors.MethodNotFound = Errors.AbstractError.$define('MethodNotFound', {
    code: -32601
  });

  Errors.InvalidParams = Errors.AbstractError.$define('InvalidParams', {
    code: -32602
  });

  Errors.InternalError = Errors.AbstractError.$define('InternalError', {
    code: -32603
  });

  Errors.ServerError = Errors.AbstractError.$define('ServerError', {
    code: -32000
  });

  return Errors;
};