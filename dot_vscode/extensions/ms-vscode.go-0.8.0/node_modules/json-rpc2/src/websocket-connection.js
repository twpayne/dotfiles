module.exports = function (classes){
  'use strict';

  var
    Connection = classes.Connection,

    /**
     * Websocket connection.
     *
     * Socket connections are mostly symmetric, so we are using a single class for
     * representing both the server and client perspective.
     */
      WebSocketConnection = Connection.$define('WebSocketConnection', {
      construct: function ($super, endpoint, conn){
        var self = this;

        $super(endpoint);

        self.conn = conn;
        self.ended = false;

        self.conn.on('close', function websocketClose(hadError){
          self.emit('close', hadError);
        });
      },
      write: function(data){
        if (!this.conn.writable) {
          // Other side disconnected, we'll quietly fail
          return;
        }

        this.conn.write(data);
      },
      end: function(){
        this.conn.close();
        this.ended = true;
      }
    });

  return WebSocketConnection;
};