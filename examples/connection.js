'use strict';

const mongorito = require('../');
const run = require('./run');

run(function * () {
	// connect to a database named "examples" on localhost
	yield mongorito.connect('localhost/examples');

	// connected
	console.log('connected');

	// and disconnect
	yield mongorito.disconnect();

	// disconnected
	console.log('disconnected');
});
