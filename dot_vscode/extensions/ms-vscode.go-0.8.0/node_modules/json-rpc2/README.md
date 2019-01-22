[![Build Status](https://travis-ci.org/pocesar/node-jsonrpc2.svg?branch=master)](https://travis-ci.org/pocesar/node-jsonrpc2)

[![NPM](https://nodei.co/npm/json-rpc2.svg?downloads=true)](https://nodei.co/npm/json-rpc2/)

# node-jsonrpc2

JSON-RPC 2.0 server and client library, with `HTTP` (with `Websocket` support) and `TCP` endpoints

This fork is a rewrite with proper testing framework, linted code, compatible with node 0.8.x and 0.10.x, class inheritance, and added functionalities

## Tools

Check [jsonrpc2-tools](https://www.npmjs.org/package/jsonrpc2-tools) for some nice additions to this module.

## Install

To install node-jsonrpc2 in the current directory, run:

```bash
npm install json-rpc2 --save
```

## Changes from 0.x

Before, the `id` member was permissive and wouldn't actually adhere to the RFC, allowing anything besides `undefined`.
If your application relied on weird id constructs other than `String`, `Number` or `null`, it might break if you update to 1.x

## Usage

Firing up an efficient JSON-RPC server becomes extremely simple:

```js
var rpc = require('json-rpc2');

var server = rpc.Server.$create({
    'websocket': true, // is true by default
    'headers': { // allow custom headers is empty by default
        'Access-Control-Allow-Origin': '*'
    }
});

function add(args, opt, callback) {
  callback(null, args[0] + args[1]);
}

server.expose('add', add);

// you can expose an entire object as well:

server.expose('namespace', {
    'function1': function(){},
    'function2': function(){},
    'function3': function(){}
});
// expects calls to be namespace.function1, namespace.function2 and namespace.function3

// listen creates an HTTP server on localhost only
server.listen(8000, 'localhost');
```

And creating a client to speak to that server is easy too:

```js
var rpc = require('json-rpc2');

var client = rpc.Client.$create(8000, 'localhost');

// Call add function on the server

client.call('add', [1, 2], function(err, result) {
    console.log('1 + 2 = ' + result);
});
```

Create a raw (socket) server using:

```js
var rpc = require('json-rpc2');

var server = rpc.Server.$create();

// non-standard auth for RPC, when using this module using both client and server, works out-of-the-box
server.enableAuth('user', 'pass');

// Listen on socket
server.listenRaw(8080, 'localhost');
```

## Extend, overwrite, overload

Any class can be extended, or used as a mixin for new classes, since it uses [ES5Class](http://github.com/pocesar/ES5-Class) module.

For example, you may extend the `Endpoint` class, that automatically extends `Client` and `Server` classes.
Extending `Connection` automatically extends `SocketConnection` and `HttpServerConnection`.

```js
var rpc = require('json-rpc2');

rpc.Endpoint.$include({
    'newFunction': function(){

    }
});

var
    server = rpc.Server.$create(),
    client = rpc.Client.$create();

server.newFunction(); // already available
client.newFunction(); // already available
```

To implement a new class method (that can be called without an instance, like `rpc.Endpoint.newFunction`):

```js
var rpc = require('json-rpc2');

rpc.Endpoint.$implement({
    'newFunction': function(){
    }
});

rpc.Endpoint.newFunction(); // available
rpc.Client.newFunction(); // every
rpc.Server.newFunction(); // where
```

Don't forget, when you are overloading an existing function, you can call the original function using `$super`

```js
var rpc = require('json-rpc2');

rpc.Endpoint.$implement({
    'trace': function($super, direction, message){
        $super(' (' + direction + ')', message); //call the last defined function
    }
});
```

And you can start your classes directly from any of the classes

```js
var MyCoolServer = require('json-rpc2').Server.$define('MyCoolServer', {
    myOwnFunction: function(){
    },
}, {
    myOwnClassMethod: function(){
    }
}); // MyCoolServer will contain all class and instance functions from Server

MyCoolServer.myOwnClassMethod(); // class function
MyCoolServer.$create().myOwnFunction(); // instance function
```

## Debugging

This module uses the [debug](http://github.com/visionmedia/debug) package, to debug it, you need to set the Node
environment variable to jsonrpc, by setting it in command line as `set DEBUG=jsonrpc` or `export DEBUG=jsonrpc`

## Examples

To learn more, see the `examples` directory, peruse `test/jsonrpc-test.js`, or
simply "Use The Source, Luke".

More documentation and development is on its way.

