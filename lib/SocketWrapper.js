'use strict';

class SocketWrapper {

	constructor(id, socket, mqttClient) {
		this.id = id;
		this.socket = socket;
		this.mqttClient = mqttClient;
	}

}

module.exports = SocketWrapper;