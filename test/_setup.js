'use strict';

/**
 * Dependencies
 */

const Mongorito = require('../');

const Comment = require('./fixtures/models/comment');
const Account = require('./fixtures/models/account');
const Post = require('./fixtures/models/post');
const Task = require('./fixtures/models/task');


/**
 * Setup hooks
 */

function setup (test) {
	let db;

	test.before(() => {
		db = new Mongorito();
		db.register(Comment);
		db.register(Account);
		db.register(Post);
		db.register(Task);

		return db.connect(process.env.MONGO_URL || 'localhost/mongorito_test');
	});

	test.beforeEach(() => Account.remove());
	test.beforeEach(() => Comment.remove());
	test.beforeEach(() => Post.remove());
	test.beforeEach(() => Task.remove());

	test.after(() => db.disconnect());
}


/**
 * Expose fn
 */

module.exports = setup;
