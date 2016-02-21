'use strict';

const mongorito = require('../');
const run = require('./run');

const Model = mongorito.Model;

// a sample model
class Post extends Model {

}

run(function * () {
	// create a new model with initial attributes
	let post = new Post({
		title: 'Great title',
		author: {
			name: 'John Doe',
			email: 'john@doe.com'
		},
		awesome: true
	});

	// get all attributes
	let attrs = post.get();
	console.log('Attributes:\n', attrs);
	console.log();

	// get specific attributes
	let title = post.get('title');
	let author = post.get('author.name');

	console.log('Title: ', title);
	console.log('Author: ', author);
	console.log();

	// set specific attributes
	post.set('title', 'Awesome title');
	post.set('author.name', 'Rick Doe');

	console.log('Title: ', post.get('title'));
	console.log('Author: ', post.get('author'));
	console.log();

	// remove attribute
	post.unset('awesome');

	console.log('New attributes:\n', post.get());
});
