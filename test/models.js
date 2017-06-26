'use strict';

const test = require('ava');
const mongorito = require('../');

const postFixture = require('./fixtures/post');
const setup = require('./_setup');
const Post = require('./fixtures/models/post');

setup(test);

test('expose mongodb properties', t => {
	const mongodb = require('mongodb');

	t.is(mongorito.Timestamp, mongodb.Timestamp);
	t.is(mongorito.ObjectId, mongodb.ObjectId);
	t.is(mongorito.MinKey, mongodb.MinKey);
	t.is(mongorito.MaxKey, mongodb.MaxKey);
	t.is(mongorito.DBRef, mongodb.DBRef);
	t.is(mongorito.Long, mongodb.Long);
});

test('initialize and manage fields', t => {
	let data = postFixture();
	const post = new Post(data);
	let attrs = post.get();
	t.deepEqual(attrs, data);

	data = postFixture();
	post.set(data);
	attrs = post.get();
	t.deepEqual(attrs, data);
});

test('set & get fields', t => {
	const data = postFixture();
	const post = new Post(data);
	post.set('author.name', 'John Doe');

	t.is(post.get('author.name'), 'John Doe');
});

test('unset fields', async t => {
	const data = {awesome: true};
	const post = new Post(data);
	await post.save();

	t.true(post.get('awesome'));

	post.unset('awesome');
	await post.save();

	t.falsy(post.get('awesome'));
});

test('unset nested fields', async t => {
	const data = {awesome: true, author: {name: 'Steve'}};
	const post = new Post(data);
	await post.save();

	post.unset('author.name');
	await post.save();

	t.deepEqual(post.get(), {awesome: true, _id: post.get('_id'), author: {}});
});

test('empty object fields', async t => {
	const data = {awesome: true, empty: {}, embed: {good: true}};
	const post = new Post(data);
	await post.save();

	t.true(post.get('awesome'));
	t.deepEqual(post.get('empty'), {});
	t.true(post.get('embed.good'));

	post.unset('empty');
	await post.save();

	t.is(post.get('empty'), undefined);
});

test('increment field', async t => {
	const post = new Post({views: 1});
	await post.save();
	await post.increment('views');

	t.is(post.get('views'), 2);
});

test('increment multiple fields', async t => {
	const post = new Post({views: 1, total: 0});
	await post.save();

	t.is(post.get('views'), 1);
	t.is(post.get('total'), 0);

	await post.increment({views: 1, total: 3});

	t.is(post.get('views'), 2);
	t.is(post.get('total'), 3);
});

test('fail if incrementing fields on unsaved document', t => {
	const post = new Post({views: 1});

	t.throws(() => post.increment({views: 1}), 'Can\'t execute an increment on unsaved model');
});

test('convert to JSON', t => {
	const data = postFixture();
	const post = new Post(data);
	const attrs = post.get();

	const json = JSON.stringify(post);
	const parsed = JSON.parse(json);

	t.deepEqual(parsed, attrs);
});

test('create', async t => {
	const post = new Post();
	await post.save();

	const posts = await Post.find();
	t.is(posts.length, 1);

	const createdPost = posts[0];
	t.is(createdPost.get('_id').toString(), post.get('_id').toString());
});

test('create with default values', async t => {
	const data = postFixture();
	delete data.title;

	Post.defaultFields = {
		title: 'Default title'
	};

	const post = new Post(data);
	await post.save();

	t.is(post.get('title'), 'Default title');
});

test('update', async t => {
	let post = new Post({awesome: true});
	await post.save();

	post = await Post.findOne();
	t.true(post.get('awesome'));

	post.set('awesome', false);
	await post.save();

	post = await Post.findOne();
	t.false(post.get('awesome'));
});

test('unset', async t => {
	let post = new Post({a: 1, b: 2});
	await post.save();

	post.unset('a');
	await post.save();

	post = await Post.findOne();
	const keys = Object.keys(post.get()).sort();
	t.deepEqual(keys, ['_id', 'title', 'b'].sort());
});

test('refresh', async t => {
	const postA = new Post({a: 1});
	await postA.save();

	const postB = await Post.findOne();
	postB.set('a', 2);
	await postB.save();

	await postA.refresh();
	t.deepEqual(postA.get(), postB.get());
});

test('remove', async t => {
	const post = new Post();
	await post.save();

	let posts = await Post.count();
	t.is(posts, 1);

	await post.remove();

	posts = await Post.count();
	t.is(posts, 0);
});

test('remove by criteria', async t => {
	await new Post({awesome: true}).save();
	await new Post({awesome: false}).save();

	let posts = await Post.find();
	t.is(posts.length, 2);

	await Post.remove({awesome: false});

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
	t.is(Post.prototype.collection(), 'posts');
});

test('override collection name', async t => {
	const {db} = t.context;

	class CustomPost extends mongorito.Model {
		collection() {
			return 'awesome_posts';
		}
	}

	db.register(CustomPost);

	const post = new CustomPost({title: 'Greatness'});
	await post.save();

	const allCollections = await db._connection.collections();
	const collections = allCollections
		.map(c => c.collectionName)
		.filter(name => !name.includes('system'))
		.sort();

	t.deepEqual(collections, ['posts', 'awesome_posts'].sort());
});
