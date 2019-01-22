var rpc = require('../src/jsonrpc');
var events = require('events');

var server = rpc.Server.$create();

server.on('error', function (err){
  console.log(err.toString());
});

// Create a message bus with random events on it
var firehose = new events.EventEmitter();
(function emitFirehoseEvent(){
  firehose.emit('foobar', {data: 'random ' + Math.random()});
  setTimeout(emitFirehoseEvent, 200 + Math.random() * 3000);
})();

var listen = function (args, opts, callback){
  var handleFirehoseEvent = function (event){
    opts.call('event', event.data);
  };

  firehose.on('foobar', handleFirehoseEvent);
  opts.stream(function (){
    console.log('connection ended');
    firehose.removeListener('foobar', handleFirehoseEvent);
  });
  callback(null);
};

server.expose('listen', listen);

/* HTTP server on port 8088 */
server.listen(8088, 'localhost');

/* Raw socket server on port 8089 */
server.listenRaw(8089, 'localhost');
