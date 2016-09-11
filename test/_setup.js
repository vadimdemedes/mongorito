'use strict';

const Mongorito = require('../');

const Post = require('./fixtures/models/post');

function setup (test) {
	let db;

	test.before(() => {
		const url = process.env.MONGODB_URL || 'localhost/mongorito_test';

		db = new Mongorito(url);
		db.register(Post);

		return db.connect();
	});

	test.beforeEach(t => {
		t.context.db = db;
	});

	test.beforeEach(() => Post.remove());

	test.after(() => db.disconnect());
}

module.exports = setup;
