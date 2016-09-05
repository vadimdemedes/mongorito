'use strict';

const mongorito = require('../');
const test = require('ava');

const postFixture = require('./fixtures/post');
const Account = require('./fixtures/models/account');
const setup = require('./_setup');
const Post = require('./fixtures/models/post');

const Model = mongorito.Model;

setup(test);

test('create', async t => {
	const post = new Post();
	await post.save();

	const posts = await Post.find();
	t.is(posts.length, 1);

	const createdPost = posts[0];
	t.is(createdPost.get('_id').toString(), post.get('_id').toString());
	t.truthy(createdPost.get('created_at'));
	t.truthy(createdPost.get('updated_at'));
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
	t.is(Account.collection(), 'accounts');
});
