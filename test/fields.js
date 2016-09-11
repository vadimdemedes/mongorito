'use strict';

const test = require('ava');

const postFixture = require('./fixtures/post');
const setup = require('./_setup');
const Post = require('./fixtures/models/post');

setup(test);

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
	const data = { awesome: true };
	const post = new Post(data);
	await post.save();

	t.true(post.get('awesome'));

	post.unset('awesome');
	await post.save();

	t.falsy(post.get('awesome'));
});

test('increment fields', async t => {
	const post = new Post({ views: 1, total: 0 });
	await post.save();

	t.is(post.get('views'), 1);
	t.is(post.get('total'), 0);

	await post.inc({ views: 1, total: 3 });

	t.is(post.get('views'), 2);
	t.is(post.get('total'), 3);
});

test('fail if incrementing fields on unsaved document', async t => {
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

test('remember previous fields', t => {
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
