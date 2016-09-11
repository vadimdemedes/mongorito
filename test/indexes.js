'use strict';

const test = require('ava');

const Post = require('./fixtures/models/post');
const setup = require('./_setup');

setup(test);

test('setup an index', async t => {
	await Post.index('title');

	const indexes = await Post.indexes();
	t.deepEqual(indexes.pop(), {
		v: 1,
		key: {
			title: 1
		},
		name: 'title_1',
		ns: 'mongorito_test.posts'
	});

	await Post.dropIndex('title_1');
});

test('setup a unique index', async t => {
	await Post.index('name', { unique: true });

	const indexes = await Post.indexes();
	t.deepEqual(indexes.pop(), {
		v: 1,
		unique: true,
		key: {
			name: 1
		},
		name: 'name_1',
		ns: 'mongorito_test.posts'
	});

	await new Post({ name: 'first' }).save();
	await t.throws(new Post({ name: 'first' }).save());
	await Post.dropIndex('name_1');
});

test('drop index', async t => {
	await Post.index('name', { unique: true });

	await new Post({ name: 'first' }).save();
	await t.throws(new Post({ name: 'first' }).save());

	await Post.dropIndex('name_1');
	await new Post({ name: 'first' }).save();
});
