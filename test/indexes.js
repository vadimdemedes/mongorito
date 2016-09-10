'use strict';

const test = require('ava');
const setup = require('./_setup');

const Post = require('./fixtures/models/post');
const Task = require('./fixtures/models/task');

setup(test);

test('setup an index', async t => {
	await Post.drop();
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
});

test('setup a unique index', async t => {
	await Task.drop();
	await Task.index('name', { unique: true });

	const indexes = await Task.indexes();
	t.deepEqual(indexes.pop(), {
		v: 1,
		unique: true,
		key: {
			name: 1
		},
		name: 'name_1',
		ns: 'mongorito_test.tasks'
	});

	await new Task({ name: 'first' }).save();
	t.throws(new Task({ name: 'first' }).save(), 'E11000 duplicate key error index: mongorito_test.tasks.$name_1 dup key: { : "first" }');
});
