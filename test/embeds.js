'use strict';

const test = require('ava');
const Post = require('./fixtures/models/post');
const Comment = require('./fixtures/models/comment');
const User = require('./fixtures/models/user');
const setup = require('./_setup');

Post.embeds('comments', Comment);
Post.embeds('author', User);
Post.embeds('sub.author', User);
Comment.embeds('author', User);

setup(test);

test('serialize embedded models', async t => {
	const post = new Post({
		title: 'Embedding',
		comments: [
			new Comment({
				author: new User({name: 'Sebastian'}),
				body: 'WOW'
			}),
			new Comment({
				body: 'Anonymous comment'
			})
		],
		author: new User({name: 'Steve'}),
		sub: {
			author: new User({name: 'Ax'})
		}
	});

	await post.save();

	const collection = await post.getCollection();
	const savedPost = await collection.findOne();
	t.deepEqual(savedPost, {
		_id: post.get('_id'),
		title: 'Embedding',
		comments: [
			{
				author: {name: 'Sebastian'},
				body: 'WOW'
			},
			{
				body: 'Anonymous comment'
			}
		],
		author: {name: 'Steve'},
		sub: {
			author: {name: 'Ax'}
		}
	});
});

test('deserialize embedded models', async t => {
	const post = new Post({
		title: 'Embedding',
		comments: [
			new Comment({
				author: new User({name: 'Sebastian'}),
				body: 'WOW'
			}),
			new Comment({
				body: 'Anonymous comment'
			})
		],
		author: new User({name: 'Steve'}),
		sub: {
			author: new User({name: 'Ax'})
		}
	});

	await post.save();

	const foundPost = await Post.findOne();
	t.deepEqual(foundPost.get('_id'), post.get('_id'));

	t.true(foundPost.get('author') instanceof User);
	t.deepEqual(foundPost.get('author').get(), {name: 'Steve'});

	t.true(foundPost.get('sub.author') instanceof User);
	t.deepEqual(foundPost.get('sub.author').get(), {name: 'Ax'});

	t.true(foundPost.get('comments')[0] instanceof Comment);
	t.true(foundPost.get('comments')[0].get('author') instanceof User);
	t.deepEqual(foundPost.get('comments')[0].get('author').get(), {name: 'Sebastian'});
	t.is(foundPost.get('comments')[0].get('body'), 'WOW');

	t.true(foundPost.get('comments')[1] instanceof Comment);
	t.true(foundPost.get('comments')[1].get('author') === undefined);
	t.is(foundPost.get('comments')[1].get('body'), 'Anonymous comment');
});

test('should not affect unecessary fields', t => {
	const post = new Post({
		title: 'Will update later',
		author: new User({name: 'Steve'})
	});

	post.set('title', 'Updated'); // Used to trigger unexpected behavior

	t.is(post.get('title'), 'Updated');

	t.true(post.get('author') instanceof User);
	t.deepEqual(post.get('author').get(), {name: 'Steve'});
	t.true(post.get('comments') === undefined);
});
