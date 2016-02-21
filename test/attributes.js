'use strict';

/**
 * Dependencies
 */

const mongorito = require('../');
const setup = require('./_setup');
const test = require('ava');

const Post = require('./fixtures/models/post');

const postFixture = require('./fixtures/post');


/**
 * Tests
 */

setup(test);

test('expose mongodb properties', t => {
	const mongodb = require('mongodb');

	let excludedKeys = [
		'connect',
		'MongoClient',
		'Db',
		'db'
	];

	Object.keys(mongodb).forEach(key => {
		if (excludedKeys.indexOf(key) === -1) {
			t.is(mongorito[key], mongodb[key]);
		}
	});
});

test('initialize and manage attributes', t => {
	let data = postFixture();
	let post = new Post(data);
	let attrs = post.get();
	t.same(attrs, data);

	data = postFixture();
	post.set(data);
	attrs = post.get();
	t.same(attrs, data);
});

test('get property', t => {
	let data = postFixture();
	let post = new Post(data);

	let author = post.get('author.name');
	t.is(author, data.author.name);
});

test('set property', t => {
	let data = postFixture();
	let post = new Post(data);

	post.set('author.name', 'John Doe');

	let author = post.get('author.name');
	t.is(author, 'John Doe');
});

test('unset property', async t => {
	let data = { awesome: true };
	let post = new Post(data);
	await post.save();

	t.true(post.get('awesome'));

	post.unset('awesome');
	await post.save();

	t.notOk(post.get('awesome'));

	post = await Post.findOne();
	t.notOk(post.get('awesome'));
});

test('increment property', async t => {
	let post = new Post({ views: 1 });
	await post.save();

	t.is(post.get('views'), 1);

	await post.inc({ views: 1 });

	t.is(post.get('views'), 2);
});

test('fail if incrementing property on unsaved document', async t => {
	let post = new Post({ views: 1 });

	let isFailed = false;

	try {
		await post.inc({ views: 1 });
	} catch (_) {
		isFailed = true;
	}

	t.true(isFailed);
});

test('convert to JSON', t => {
	let data = postFixture();
	let post = new Post(data);
	let attrs = post.get();

	let json = JSON.stringify(post);
	let parsed = JSON.parse(json);
	t.same(parsed, attrs);
});

test('remember previous attributes', t => {
	let post = new Post({ title: 'Sad title' });
	t.is(post.get('title'), 'Sad title');

	post.set('title', 'Happy title');
	t.is(post.previous.title, 'Sad title');
	t.is(post.get('title'), 'Happy title');
	t.true(post.changed.title);
});

test('if nothing changed, no previous value stored', t => {
	let post = new Post({ title: 'Sad title' });
	t.is(post.get('title'), 'Sad title');

	post.set('title', 'Sad title');
	t.notOk(post.previous.title);
	t.notOk(post.changed.title);
	t.is(post.get('title'), 'Sad title');
});
