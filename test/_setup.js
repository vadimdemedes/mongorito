'use strict';

const Mongorito = require('../');

const Comment = require('./fixtures/models/comment');
const Account = require('./fixtures/models/account');
const Post = require('./fixtures/models/post');
const Task = require('./fixtures/models/task');

function setup (test) {
	let db;

	test.before(() => {
		const url = process.env.MONGO_URL || 'localhost/mongorito_test';

		db = new Mongorito(url);
		db.register(Comment);
		db.register(Account);
		db.register(Post);
		db.register(Task);

		return db.connect();
	});

	test.beforeEach(t => {
		t.context.db = db;
	});

	test.beforeEach(() => Account.remove());
	test.beforeEach(() => Comment.remove());
	test.beforeEach(() => Post.remove());
	test.beforeEach(() => Task.remove());

	test.after(() => db.disconnect());
}

module.exports = setup;
