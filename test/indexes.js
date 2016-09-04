'use strict';

/**
 * Dependencies
 */

const setup = require('./_setup');
const test = require('ava');

const Post = require('./fixtures/models/post');
const Task = require('./fixtures/models/task');


/**
 * Tests
 */

setup(test);

test('setup an index', async t => {
	await Post.index('title');

	let indexes = await Post.indexes();
	let lastIndex = indexes[indexes.length - 1];
	t.deepEqual(lastIndex, {
		v: 1,
		key: {
			title: 1
		},
		name: 'title_1',
		ns: 'mongorito_test.posts'
	});
});

test('setup a unique index', async t => {
	await Task.index('name', { unique: true });

	let indexes = await Task.indexes();
	let lastIndex = indexes[indexes.length - 1];
	t.deepEqual(lastIndex, {
		v: 1,
		unique: true,
		key: {
			name: 1
		},
		name: 'name_1',
		ns: 'mongorito_test.tasks'
	});

	await new Task({ name: 'first' }).save();

	let err;

	try {
		await new Task({ name: 'first' }).save();
	} catch (e) {
		err = e;
	}

	t.truthy(err);
	t.is(err.name, 'MongoError');
});
