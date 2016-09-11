'use strict';

const Mongorito = require('../');

const Account = require('./fixtures/models/account');
const Post = require('./fixtures/models/post');

function setup (test) {
	let db;

	test.before(() => {
		const url = process.env.MONGO_URL || 'localhost/mongorito_test';

		db = new Mongorito(url);
		db.register(Account);
		db.register(Post);

		return db.connect();
	});

	test.beforeEach(t => {
		t.context.db = db;
	});

	test.beforeEach(() => Account.remove());
	test.beforeEach(() => Post.remove());

	test.after(() => db.disconnect());
}

module.exports = setup;
