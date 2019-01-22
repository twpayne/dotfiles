module.exports = function (classes){
  'use strict';

  var
    _ = classes._,
    EventEmitter = classes.EventEmitter,
    Error = classes.Error,
    /**
     * Abstract base class for RPC endpoints.
     *
     * Has the ability to register RPC events and expose RPC methods.
     */
      Endpoint = EventEmitter.$define('Endpoint', {
      construct : function ($super){
        $super();

        this.functions = {};
        this.scopes = {};
        this.defaultScope = this;
        this.exposeModule = this.expose;
      },
      /**
       * Define a callable method on this RPC endpoint
       */
      expose    : function (name, func, scope){
        if (_.isFunction(func)) {
          EventEmitter.trace('***', 'exposing: ' + name);
          this.functions[name] = func;

          if (scope) {
            this.scopes[name] = scope;
          }
        } else {
          var funcs = [];

          for (var funcName in func) {
            if (Object.prototype.hasOwnProperty.call(func, funcName)) {
              var funcObj = func[funcName];
              if (_.isFunction(funcObj)) {
                this.functions[name + '.' + funcName] = funcObj;
                funcs.push(funcName);

                if (scope) {
                  this.scopes[name + '.' + funcName] = scope;
                }
              }
            }
          }

          EventEmitter.trace('***', 'exposing module: ' + name + ' [funs: ' + funcs.join(', ') + ']');
        }
        return func;
      },
      handleCall: function (decoded, conn, callback){
        EventEmitter.trace('<--', 'Request (id ' + decoded.id + '): ' +
          decoded.method + '(' + JSON.stringify(decoded.params) + ')');

        if (!this.functions.hasOwnProperty(decoded.method)) {
          callback(new Error.MethodNotFound('Unknown RPC call "' + decoded.method + '"'));
          return;
        }

        var method = this.functions[decoded.method];
        var scope = this.scopes[decoded.method] || this.defaultScope;

        // Try to call the method, but intercept errors and call our
        // error handler.
        try {
          method.call(scope, decoded.params, conn, callback);
        } catch (err) {
          callback(err);
        }
      }
    });

  return Endpoint;
};
