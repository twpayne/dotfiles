module.exports = function (classes){
  'use strict';

  var
    Connection = classes.Connection,

    /**
     * Socket connection.
     *
     * Socket connections are mostly symmetric, so we are using a single class for
     * representing both the server and client perspective.
     */
      SocketConnection = Connection.$define('SocketConnection', {
      construct: function ($super, endpoint, conn){
        var self = this;

        $super(endpoint);

        self.conn = conn;
        self.autoReconnect = true;
        self.ended = true;

        self.conn.on('connect', function socketConnect(){
          self.emit('connect');
        });

        self.conn.on('end', function socketEnd(){
          self.emit('end');
        });

        self.conn.on('error', function socketError(event){
          self.emit('error', event);
        });

        self.conn.on('close', function socketClose(hadError){
          self.emit('close', hadError);

          if (
            self.endpoint.$className === 'Client' &&
              self.autoReconnect && !self.ended
            ) {
            if (hadError) {
              // If there was an error, we'll wait a moment before retrying
              setTimeout(function reconnectTimeout(){
                self.reconnect();
              }, 200);
            } else {
              self.reconnect();
            }
          }
        });
      },
      write    : function (data){
        if (!this.conn.writable) {
          // Other side disconnected, we'll quietly fail
          return;
        }

        this.conn.write(data);
      },

      end: function (){
        this.ended = true;
        this.conn.end();
      },

      reconnect: function (){
        this.ended = false;
        if (this.endpoint.$className === 'Client') {
          this.conn.connect(this.endpoint.port, this.endpoint.host);
        } else {
          throw new Error('Cannot reconnect a connection from the server-side.');
        }
      }
    });

  return SocketConnection;
};