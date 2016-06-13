## Introduction

Wavelite is a distributed text editor that uses mqtt for message transport. The editor is available at host/editor. All servers that share the same appId as defined in the config file will share the same messages.

## Installation
```sh
git clone https://github.com/awamsley/wavelite.git
cd wavelite
npm install
```

## How to run

Wavelite can be run using the command
```sh
node server.js CONFIG_FILE PORT
```
where CONFIG_FILE is the path to the configuration file and PORT is the port to run the server on.

The unit tests can be run using the command
```sh
npm test
```

## Configuration

A configuration file is required for Wavelite to run. An example is provided here as example-config.json.
The following properties are required to be in the configuration file:

* initialText: This is what the editor is populated with for a new application
* appId: This is the id for your application. Replace this with a UUID to define your own application
* url: This is the URL for the MQTT broker you will be using
