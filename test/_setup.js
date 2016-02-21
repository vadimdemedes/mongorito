'use strict';

/**
 * Dependencies
 */

const mongorito = require('../');

const Comment = require('./fixtures/models/comment');
const Account = require('./fixtures/models/account');
const Post = require('./fixtures/models/post');
const Task = require('./fixtures/models/task');


/**
 * Setup hooks
 */

function setup (test) {
	test.before(() => mongorito.connect('localhost/mongorito_test'));

	test.beforeEach(() => Account.remove());
	test.beforeEach(() => Comment.remove());
	test.beforeEach(() => Post.remove());
	test.beforeEach(() => Task.remove());

	test.after(() => mongorito.disconnect());
}


/**
 * Expose fn
 */

module.exports = setup;
