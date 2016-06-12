'use strict';

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const config = require('./lib/config')(process.argv.slice(2));
const socketManager = require('./lib/socketManager')(config.MQTT_CONFIG);

app.get('/editor', (req, res) => {
	res.sendFile(path.join(`${__dirname}/lib/editor.html`));
});

io.on('connection', (socket) => {
	socketManager.handleConnection(socket);
});

app.use((req, res, next) => {
	res.status(404).send("Resource not found");
});

server.listen(config.PORT);
console.log(`Now listening on port ${config.PORT}`);