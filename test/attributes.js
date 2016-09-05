'use strict';

const mongorito = require('../');
const test = require('ava');

const postFixture = require('./fixtures/post');
const setup = require('./_setup');
const Post = require('./fixtures/models/post');

setup(test);

test.skip('expose mongodb properties', t => {
	const mongodb = require('mongodb');

	const excludedKeys = [
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

test('set and get mongodb driver', t => {
	const mockDriver = {
		'MongoClient': true
	};

	mongorito.setDriver(mockDriver);

	t.is(mongorito.getDriver(), mockDriver);
});

test('set mock mongodb driver and connect', t => {
	const mockDriver = {
		'MongoClient': {
			'connect': () => {
				return Promise.resolve('ok');
			}
		}
	};

	mongorito.setDriver(mockDriver);

	// If setDriver was not successful, Mongorito would use a real driver here, which would fail on the invalid connect
	// URL. This means: If this connect is successful, setDriver was successful, as the mockDriver that was used always
	// fulfills.
	t.ok(mongorito.connect('THIS:IS:AN:INVALID:MONGO_URL'));
});

test('initialize and manage attributes', t => {
	let data = postFixture();
	const post = new Post(data);
	let attrs = post.get();
	t.deepEqual(attrs, data);

	data = postFixture();
	post.set(data);
	attrs = post.get();
	t.deepEqual(attrs, data);
});

test('set & get property', t => {
	const data = postFixture();
	const post = new Post(data);
	post.set('author.name', 'John Doe');

	t.is(post.get('author.name'), 'John Doe');
});

test('unset property', async t => {
	const data = { awesome: true };
	const post = new Post(data);
	await post.save();

	t.true(post.get('awesome'));

	post.unset('awesome');
	await post.save();

	t.falsy(post.get('awesome'));
});

test('increment property', async t => {
	const post = new Post({ views: 1, total: 0 });
	await post.save();

	t.is(post.get('views'), 1);
	t.is(post.get('total'), 0);

	await post.inc({ views: 1, total: 3 });

	t.is(post.get('views'), 2);
	t.is(post.get('total'), 3);
});

test('fail if incrementing property on unsaved document', async t => {
	const post = new Post({ views: 1 });

	await t.throws(post.inc({ views: 1 }));
});

test('convert to JSON', t => {
	const data = postFixture();
	const post = new Post(data);
	const attrs = post.get();

	const json = JSON.stringify(post);
	const parsed = JSON.parse(json);

	t.deepEqual(parsed, attrs);
});

test('remember previous attributes', t => {
	const post = new Post({ title: 'Sad title' });
	t.is(post.get('title'), 'Sad title');

	post.set('title', 'Happy title');
	t.is(post.previous.get('title'), 'Sad title');
	t.is(post.get('title'), 'Happy title');
	t.true(post.changed('title'));
});

test('no previous value stored initially', t => {
	const post = new Post({ title: 'Sad title' });
	t.is(post.get('title'), 'Sad title');

	post.set('title', 'Sad title');
	t.falsy(post.previous.get('title'));
	t.true(post.changed('title'));
	t.is(post.get('title'), 'Sad title');
});
