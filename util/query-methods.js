'use strict';

const mquery = require('mquery');

const ignore = [
	'setTraceFunction',
	'toConstructor',
	'setOptions',
	'collection',
	'remove',
	'thunk',
	'then',
	'exec',
	'find'
];

const methods = Object.keys(mquery.prototype)
	.filter(name => name[0] !== '_')
	.filter(name => ignore.indexOf(name) < 0);

module.exports = methods;
