module.exports = function (classes){
  'use strict';

  var
    Connection = classes.Connection,
    HttpServerConnection = Connection.$define('HttpServerConnection', {
    construct: function ($super, server, req, res){
      var self = this;

      $super(server);

      this.req = req;
      this.res = res;
      this.isStreaming = false;

      this.res.on('finish', function responseEnd(){
        self.emit('end');
      });

      this.res.on('close', function responseEnd(){
        self.emit('end');
      });
    },

    /**
     * Can be called before the response callback to keep the connection open.
     */
    stream: function ($super, onend){
      $super(onend);

      this.isStreaming = true;
    },

    /**
     * Send the client additional data.
     *
     * An HTTP connection can be kept open and additional RPC calls sent through if
     * the client supports it.
     */
    write: function (data){
      if (!this.isStreaming) {
        throw new Error('Cannot send extra messages via non - streaming HTTP');
      }

      if (!this.res.connection.writable) {
        // Client disconnected, we'll quietly fail
        return;
      }

      this.res.write(data);
    }
  });

  return HttpServerConnection;
};