'use strict';

const testConfig = require('./testConfig');
const EventEmitter = require('events');
const chai = require('chai');
const expect = chai.expect;
const mqtt = require('mqtt');
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();
let socketManager;

class MockMqttClient {
	constructor() {
		this._emitter = new EventEmitter();
	}

	on(eventName, callback) {
		this._emitter.on(eventName, callback);
	}

	subscribe() {}

	end() {}

	publish() {}
}

class MockSocket {
	constructor() {
		this._emitter = new EventEmitter();
	}

	on(eventName, callback) {
		this._emitter.on(eventName, callback);
	}

	emit() {}

	disconnect() {}
}

describe('SocketManager', () => {

	let mockSocket;
	let mockClient;

	beforeEach(() => {
		socketManager = require('../lib/socketManager')(testConfig.mqttConfig);

		mockSocket = new MockSocket();
		mockClient = new MockMqttClient();
		sandbox.stub(mqtt, 'connect', () => {
			return mockClient;
		});
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('has a map of sockets', (done) => {
		expect(socketManager._sockets).to.exist;
		expect(socketManager._sockets.size).to.be.equal(0);
		done();
	});

	describe('handleConnection', () => {

		it('emits an identity event', (done) => {
			sandbox.stub(mockSocket, 'emit', (topic, message) => {
				if (topic !== 'identity') {
					return;
				}
				expect(message.id).to.be.ok;
				expect(message.defaultData).to.be.equal(testConfig.mqttConfig.INIT_TEXT);
				done();
			});

			socketManager.handleConnection(mockSocket);
		});

		it('stores sockets correctly', (done) => {
			socketManager.handleConnection(mockSocket);
			expect(socketManager._sockets.size).to.be.equal(1);
			done();
		});

		it('handles error event from mqtt', (done) => {
			sandbox.stub(mockSocket, 'emit');
			sandbox.stub(mockSocket, 'disconnect');
			sandbox.stub(mockClient, 'end');

			socketManager.handleConnection(mockSocket);
			mockClient._emitter.emit('error');
			expect(mockSocket.emit.called).to.be.ok;
			expect(mockSocket.disconnect.called).to.be.ok;
			expect(mockClient.end.called).to.be.ok;
			done();
		});

		it('handles offline event from mqtt', (done) => {
			sandbox.stub(mockSocket, 'emit');
			sandbox.stub(mockSocket, 'disconnect');
			sandbox.stub(mockClient, 'end');

			socketManager.handleConnection(mockSocket);
			mockClient._emitter.emit('offline');
			expect(mockSocket.emit.called).to.be.ok;
			expect(mockSocket.disconnect.called).to.be.ok;
			expect(mockClient.end.called).to.be.ok;
			done();
		});

		it('subscribes client with correct arguments', (done) => {
			sandbox.stub(mockClient, 'subscribe', (namespace, options) => {
				expect(namespace).to.be.equal(testConfig.mqttConfig.NAMESPACE);
				expect(options.qos).to.be.equal(1);
				done();
			});
			socketManager.handleConnection(mockSocket);
		});

		it('ignores messages sent by itself', (done) => {
			const mockMessage = {
				clientId: null
			};
			sandbox.stub(mockSocket, 'emit', (topic, message) => {
				if (topic !== 'identity') {
					return;
				}
				mockMessage.clientId = message.id;
			});

			socketManager.handleConnection(mockSocket);
			mockClient._emitter.emit('message', 'topic', JSON.stringify(mockMessage));
			expect(mockSocket.emit.calledWith('contents')).to.be.false;
			done();
		});

		it('processes messages not sent by itself', (done) => {
			const mockMessage = {
				clientId: 'clientId',
				content: 'message content'
			};
			sandbox.stub(mockSocket, 'emit', (topic, message) => {
				if (topic === 'contents') {
					expect(message).to.be.equal(mockMessage.content);
					done();
				}
			});
			socketManager.handleConnection(mockSocket);
			mockClient._emitter.emit('message', 'contents', JSON.stringify(mockMessage));
		});

		it('publishes to mqtt on change from front end', (done) => {
			const testMessage = "testMessage";
			sandbox.stub(mockClient, 'publish', (namespace, message, options) => {
				expect(namespace).to.be.equal(testConfig.mqttConfig.NAMESPACE);
				expect(message).to.be.equal(JSON.stringify(testMessage));
				expect(options.qos).to.be.equal(1);
				expect(options.retain).to.be.ok;
				done();
			});
			socketManager.handleConnection(mockSocket);
			mockSocket._emitter.emit('change', testMessage);
		});

		it('removes sockets on disconnect event', (done) => {
			socketManager.handleConnection(mockSocket);
			expect(socketManager._sockets.size).to.be.equal(1);
			mockSocket._emitter.emit('disconnect');
			expect(socketManager._sockets.size).to.be.equal(0);
			done();
		});

		it('emits connectionComplete event', (done) => {
			sandbox.stub(mockSocket, 'emit', (topic) => {
				if (topic === 'connectionComplete') {
					done();
				}
			});
			socketManager.handleConnection(mockSocket);
		})
	});
});