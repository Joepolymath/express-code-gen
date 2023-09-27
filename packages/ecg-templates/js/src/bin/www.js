#!/usr/bin/env node

const http = require('http');
const debugLib = require('debug');
const app = require('../index.js');
const { PORT, NODE_ENV, HOST_NAME } = require('../config/env.js');

const debug = debugLib('<you app name>:server');

// Normalize a port into a number, string or false.
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (Number.isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }
  return false;
}

// Event listener for http server 'error' event.

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  //   handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
    case 'EADDRINUSE':
      console.log(`${bind} is already in use`);
      process.exit(1);
    default:
      throw error;
  }
}

// Event listener for http server 'listening' event
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}

// Get port from environment and store in express
const port = normalizePort(PORT);
app.set('port', port);

// Create HTTP server
const server = http.createServer(app);

// Listen on provided port on all network interfaces

server.listen(port, (err) => {
  if (err) {
    console.error(`ERROR - Unable to start server.`);
  } else {
    console.info(
      `INFO - Server Spitting 🔥 🔥 🔥 🔥 🔥 🔥 on - ${HOST_NAME}:${port} [${NODE_ENV}]`
    );
  }
});

server.on('error', onError);
server.on('listening', onListening);
