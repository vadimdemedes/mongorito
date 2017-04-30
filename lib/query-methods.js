'use strict';

const mquery = require('mquery');

const ignore = [
	'setTraceFunction',
	'toConstructor',
	'setOptions',
	'collection',
	'findOne',
	'remove',
	'count',
	'thunk',
	'then',
	'exec',
	'find',
	'sort'
];

const methods = Object.keys(mquery.prototype)
	.filter(name => name[0] !== '_')
	.filter(name => ignore.indexOf(name) < 0);

module.exports = methods;
