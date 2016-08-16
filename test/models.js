'use strict';

/**
 * Dependencies
 */

const mongorito = require('../');
const setup = require('./_setup');
const test = require('ava');

const Account = require('./fixtures/models/account');
const Post = require('./fixtures/models/post');

const postFixture = require('./fixtures/post');

const Model = mongorito.Model;


/**
 * Tests
 */

setup(test);

test('create', async t => {
	let post = new Post();
	await post.save();

	let posts = await Post.all();
	t.is(posts.length, 1);

	let createdPost = posts[0];
	t.is(createdPost.get('_id').toString(), post.get('_id').toString());
	t.ok(createdPost.get('created_at'));
	t.ok(createdPost.get('updated_at'));
});

test('create with default values', async t => {
	let data = postFixture();
	delete data.title;

	let post = new Post(data);
	await post.save();

	t.is(post.get('title'), 'Default title');
});

test('update', async t => {
	let post = new Post({ awesome: true });
	await post.save();

	post = await Post.findOne();
	t.true(post.get('awesome'));

	post.set('awesome', false);
	await post.save();

	post = await Post.findOne();
	t.false(post.get('awesome'));
});

test('update `updated_at` attribute', async t => {
	let post = new Post();
	await post.save();

	let prevDate = post.get('updated_at').getTime();

	post.set('awesome', true);
	await post.save();

	let nextDate = post.get('updated_at').getTime();

	t.not(prevDate, nextDate);
});

test('remove', async t => {
	let post = new Post();
	await post.save();

	let posts = await Post.count();
	t.is(posts, 1);

	await post.remove();

	posts = await Post.count();
	t.is(posts, 0);
});

test('remove by criteria', async t => {
	await new Post({ awesome: true }).save();
	await new Post({ awesome: false }).save();

	let posts = await Post.find();
	t.is(posts.length, 2);

	await Post.remove({ awesome: false });

	posts = await Post.find();
	t.is(posts.length, 1);
	t.true(posts[0].get('awesome'));
});

test('remove all documents', async t => {
	await new Post().save();
	await new Post().save();

	let posts = await Post.count();
	t.is(posts, 2);

	await Post.remove();

	posts = await Post.count();
	t.is(posts, 0);
});

test('automatically set collection name', async t => {
	let account = new Account();
	await account.save();

	t.is(account.collection, 'accounts');

	let accounts = await Account.find();
	t.is(accounts.length, 1);
});

test('use multiple databases', async t => {
	// Post1 will be stored in first database
	// Post2 will be stored in second database
	class Post1 extends Model {
		collection () {
			return 'posts';
		}
	}

	let secondaryDb = await mongorito.connect((process.env.MONGO_URL ? process.env.MONGO_URL + '_2' : 'localhost/mongorito_test_2'));

	class Post2 extends Model {
		db () {
			return secondaryDb;
		}

		collection () {
			return 'posts';
		}
	}

	await Post1.remove();
	await Post2.remove();

	await new Post1({ title: 'Post in first db' }).save();
	await new Post2({ title: 'Post in second db' }).save();

	let posts = await Post1.all();
	t.is(posts.length, 1);
	t.is(posts[0].get('title'), 'Post in first db');

	posts = await Post2.all();
	t.is(posts.length, 1);
	t.is(posts[0].get('title'), 'Post in second db');

	await secondaryDb.close();
});
