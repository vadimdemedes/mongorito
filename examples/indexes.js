'use strict';

const mongorito = require('../');
const run = require('./run');

const Model = mongorito.Model;

// a sample model
class Post extends Model {

}


run(function * () {
	yield mongorito.connect('localhost/examples');

	// set up an index
	yield Post.index('title');

	// index set
	console.log('Index on `title` is set');

	// set up a unique index
	yield Post.index('slug', { unique: true });

	// index set
	console.log('Unique index on `slug` is set');

	// list all indexes
	let indexes = yield Post.indexes();
	console.log('All indexes:\n', indexes);

	yield mongorito.disconnect();
});
