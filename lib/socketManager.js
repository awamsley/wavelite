'use strict';

const mqtt = require('mqtt');
const util = require('./util');
const SocketWrapper = require('./SocketWrapper');

class SocketManager {

	constructor(config) {
		this._sockets = new Map();
		this._config = config;
		this._namespace = config.NAMESPACE;
	}

	handleConnection(socket) {
		// First, send client information about its own identity, including default text
		const id = util.generateGUID();
		const identity = {
			id: id,
			defaultData: this._config.INIT_TEXT
		};
		console.log(`Creating connection for id ${id}`);
		socket.emit('identity', identity);

		// Create MQTT client and add event listeners to it and websocket from front end
		const client = mqtt.connect(this._config.URL);
		this._configureConnections(id, client, socket);

		this._sockets.set(id, new SocketWrapper(id, socket, client));
	}

	_configureConnections(clientId, client, socket) {

		// On error or offline event, disconnect client and send error message
		client.on('error', (err) => {
			console.log(`Problem was encountered attempting to connect for client ${clientId}`);
			console.log(err);
			socket.emit('contents', 'There was a problem. Please try again. If issue persists, contact administrator.');
			socket.disconnect();
			client.end();
		});

		client.on('offline', () => {
			console.log(`Problem was encountered attempting to connect for client ${clientId}`);
			socket.emit('contents', 'There was a problem. Please try again. If issue persists, contact administrator.');
			socket.disconnect();
			client.end();
		});

		client.on('connect', () => {
			console.log(`Connected for client ${clientId}`);
		});

		client.subscribe(this._namespace, {qos: 1});

		client.on('message', (topic, message) => {
			message = JSON.parse(message);

			// Ignore messages sent by self
			if (message.clientId === clientId) {
				return;
			}
			message = message.content.toString();
			socket.emit('contents', message);
		});

		socket.on('change', (message) => {
			client.publish(this._namespace, JSON.stringify(message), {qos: 1, retain: true});
		});

		socket.on('disconnect', () => {
			console.log(`Destroying connection for id ${clientId}`);
			this._sockets.delete(clientId);
		});

		// Let front end know that configuration is complete, show default message if it hasn't received most recent
		socket.emit('connectionComplete');

	}

}

module.exports = (config) => {
	return new SocketManager(config);
};