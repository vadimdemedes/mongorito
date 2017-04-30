'use strict';

const test = require('ava');
const omit = require('lodash.omit');

const Post = require('./fixtures/models/post');
const setup = require('./_setup');

setup(test);

test('setup an index', async t => {
	await Post.createIndex('title');

	const indexes = await Post.listIndexes();
	t.deepEqual(omit(indexes.pop(), 'v'), {
		key: {
			title: 1
		},
		name: 'title_1',
		ns: 'mongorito_test.posts'
	});

	await Post.dropIndex('title_1');
});

test('setup a unique index', async t => {
	await Post.createIndex('name', {unique: true});

	const indexes = await Post.listIndexes();
	t.deepEqual(omit(indexes.pop(), 'v'), {
		unique: true,
		key: {
			name: 1
		},
		name: 'name_1',
		ns: 'mongorito_test.posts'
	});

	await new Post({name: 'first'}).save();
	await t.throws(new Post({name: 'first'}).save());
	await Post.dropIndex('name_1');
});

test('drop index', async t => {
	await Post.createIndex('name', {unique: true});

	await new Post({name: 'first'}).save();
	await t.throws(new Post({name: 'first'}).save());

	await Post.dropIndex('name_1');
	await new Post({name: 'first'}).save();
});
