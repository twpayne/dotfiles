var rpc = require('../src/jsonrpc');

/*
 Each uses a different syntax
 Responses can not be assigned to a source request if the socket version
 ... it sucks
 Moreover jsonrpc2 knows no stream ... it may be helpful, but it is not JSON-RPC2

 Michal <misablaha@gmail.com>
 */

/*
 Connect to HTTP server
 */
var client = rpc.Client.$create(8088, 'localhost');

client.stream('listen', [], function (err, connection){
  if (err) {
    return printError(err);
  }
  var counter = 0;
  connection.expose('event', function (params){
    console.log('Streaming #' + counter + ': ' + params[0]);
    counter++;
    if (counter > 4) {
      connection.end();
    }
  });
  console.log('start listening');
});

/*
 Connect to Raw socket server
 */
var socketClient = rpc.Client.$create(8089, 'localhost');

socketClient.connectSocket(function (err, conn){
  if (err) {
    return printError(err);
  }
  var counter = 0;
  socketClient.expose('event', function (params){
    console.log('Streaming (socket) #' + counter + ': ' + params[0]);
    counter++;
    if (counter > 4) {
      conn.end();
    }
  });

  conn.call('listen', [], function (err){
    if (err) {
      return printError(err);
    }
  });
});

function printError(err){
  console.error('RPC Error: ' + err.toString());
}
