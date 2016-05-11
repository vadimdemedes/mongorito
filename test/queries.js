'use strict';

/**
 * Dependencies
 */

const setup = require('./_setup');
const test = require('ava');

const Comment = require('./fixtures/models/comment');
const Post = require('./fixtures/models/post');

const commentFixture = require('./fixtures/comment');
const postFixture = require('./fixtures/post');


/**
 * Tests
 */

setup(test);

test('find all documents', async t => {
	t.plan(5);

	let savedPosts = [];
	let n = 4;

	while (n--) {
		let post = new Post();
		await post.save();

		savedPosts.push(post);
	}

	let posts = await Post.all();
	t.is(posts.length, 4);

	posts.forEach((post, index) => {
		let actualId = post.get('_id').toString();
		let expectedId = savedPosts[index].get('_id').toString();

		t.is(actualId, expectedId);
	});
});

test('count all documents', async t => {
	let posts = await Post.count();
	t.is(posts, 0);

	await new Post().save();
	await new Post().save();

	posts = await Post.count();
	t.is(posts, 2);
});

test('count by criteria', async t => {
	let posts = await Post.count();
	t.is(posts, 0);

	await new Post({ awesome: true }).save();
	await new Post({ awesome: false }).save();

	posts = await Post.count({ awesome: true });
	t.is(posts, 1);
});

test('find one document', async t => {
	let createdPost = new Post();
	await createdPost.save();

	let posts = await Post.count();
	t.is(posts, 1);

	let post = await Post.findOne();
	let actualId = post.get('_id').toString();
	let expectedId = createdPost.get('_id').toString();

	t.is(actualId, expectedId);
});

test('find one document by id', async t => {
	let data = postFixture();
	let createdPost = new Post(data);
	await createdPost.save();

	let posts = await Post.count();
	t.is(posts, 1);

	let post = await Post.findById(createdPost.get('_id'));
	t.is(post.get('title'), data.title);
});

test('find one document by id string', async t => {
	let data = postFixture();
	let createdPost = new Post(data);
	await createdPost.save();

	let posts = await Post.count();
	t.is(posts, 1);

	let post = await Post.findById(createdPost.get('_id').toString());
	t.is(post.get('title'), data.title);
});

test('find a document with .where()', async t => {
	let data = postFixture();
	let post = new Post(data);
	await post.save();

	let posts = await Post.where('title', data.title).find();
	t.is(posts.length, 1);

	let actualId = posts[0].get('_id').toString();
	let expectedId = post.get('_id').toString();
	t.is(actualId, expectedId);
});

test('find a document with .where() matching sub-properties', async t => {
	let data = postFixture();
	let post = new Post(data);
	await post.save();

	let posts = await Post.where('author.name', data.author.name).find();
	t.is(posts.length, 1);

	let actualId = posts[0].get('_id').toString();
	let expectedId = post.get('_id').toString();
	t.is(actualId, expectedId);
});

test('find a document with .where() matching sub-documents using $elemMatch', async t => {
	let data = postFixture();
	let post = new Post(data);
	await post.save();

	let posts = await Post.where('comments').matches({ body: data.comments[0].body }).find();
	t.is(posts.length, 1);

	let actualId = posts[0].get('_id').toString();
	let expectedId = post.get('_id').toString();
	t.is(actualId, expectedId);
});

test('find a document with .where() matching with regex', async t => {
	let data = postFixture({ title: 'Something' });
	let post = new Post(data);
	await post.save();

	let posts = await Post.where('title', /something/i).find();
	t.is(posts.length, 1);

	let actualId = posts[0].get('_id').toString();
	let expectedId = post.get('_id').toString();
	t.is(actualId, expectedId);
});

test('find documents with .limit()', async t => {
	t.plan(3);

	let createdPosts = [];
	let n = 4;

	while (n--) {
		let post = new Post();
		await post.save();

		createdPosts.push(post);
	}

	let posts = await Post.limit(2).find();
	t.is(posts.length, 2);

	posts.forEach((post, index) => {
		let actualId = post.get('_id').toString();
		let expectedId = createdPosts[index].get('_id').toString();
		t.is(actualId, expectedId);
	});
});

test('find documents with .limit() and .skip()', async t => {
	t.plan(3);

	let createdPosts = [];
	let n = 4;

	while (n--) {
		let post = new Post();
		await post.save();

		createdPosts.push(post);
	}

	let posts = await Post.limit(2).skip(1).find();
	t.is(posts.length, 2);

	posts.forEach((post, index) => {
		let actualId = post.get('_id').toString();
		let expectedId = createdPosts[1 + index].get('_id').toString();
		t.is(actualId, expectedId);
	});
});

test('find documents with .exists()', async t => {
	let n = 5;

	while (n--) {
		let data = postFixture();
		if (n < 2) {
			delete data.body;
		}

		let post = new Post(data);
		await post.save();
	}

	let posts = await Post.exists('body').find();
	t.is(posts.length, 3);

	posts = await Post.where('body').exists().find();
	t.is(posts.length, 3);

	posts = await Post.exists('body', false).find();
	t.is(posts.length, 2);

	posts = await Post.where('body').exists(false).find();
	t.is(posts.length, 2);
});

test('find documents with .lt(), .lte(), .gt(), .gte()', async t => {
	let n = 10;

	while (n--) {
		let data = postFixture({ index: n });
		let post = new Post(data);
		await post.save();
	}

	let posts = await Post.where('index').lt(5).find();
	t.is(posts.length, 5);

	posts = await Post.where('index').lte(5).find();
	t.is(posts.length, 6);

	posts = await Post.where('index').gt(7).find();
	t.is(posts.length, 2);

	posts = await Post.where('index').gte(7).find();
	t.is(posts.length, 3);
});

test('find documents with .or()', async t => {
	let firstPost = new Post({
		isPublic: true,
		author: {
			name: 'user1'
		}
	});

	let secondPost = new Post({
		isPublic: false,
		author: {
			name: 'user2'
		}
	});

	let thirdPost = new Post({
		isPublic: false,
		author: {
			name: 'user3'
		}
	});

	await firstPost.save();
	await secondPost.save();
	await thirdPost.save();

	let posts = await Post.or({ isPublic: true }, { 'author.name': 'user2' }).find();
	t.is(posts.length, 2);
	t.is(posts[0].get('author.name'), 'user1');
	t.is(posts[1].get('author.name'), 'user2');
});

test('find documents with .and()', async t => {
	let firstPost = new Post({
		isPublic: true,
		author: {
			name: 'user1'
		}
	});

	let secondPost = new Post({
		isPublic: false,
		author: {
			name: 'user2'
		},
		title: 'second'
	});

	let thirdPost = new Post({
		isPublic: false,
		author: {
			name: 'user2'
		},
		title: 'third'
	});

	await firstPost.save();
	await secondPost.save();
	await thirdPost.save();

	let posts = await Post.and({ isPublic: false }, { 'author.name': 'user2' }).find();
	t.is(posts.length, 2);
	t.is(posts[0].get('title'), 'second');
	t.is(posts[1].get('title'), 'third');
});

test('find documents with .in()', async t => {
	let n = 10;

	while (n--) {
		let data = postFixture({ index: n });
		let post = new Post(data);
		await post.save();
	}

	let posts = await Post.where('index').in([4, 5]).find();
	t.is(posts.length, 2);
});

test('sort documents', async t => {
	let n = 4;

	while (n--) {
		let post = new Post({ index: n });
		await post.save();
	}

	let posts = await Post.sort({ _id: -1 }).find();
	t.is(posts.length, 4);

	n = 4;

	while (n--) {
		let post = posts[n];
		t.is(post.get('index'), n);
	}

	posts = await Post.sort({ _id: 1 }).find();
	t.is(posts.length, 4);

	n = 4;

	while (n--) {
		let post = posts[n];
		t.is(post.get('index'), 3 - n);
	}
});

test('populate the response', async t => {
	let n = 3;
	let comments = [];

	while (n--) {
		let data = commentFixture();
		let comment = new Comment(data);
		await comment.save();

		comments.push(comment);
	}

	let data = postFixture({
		comments: comments.map(comment => comment.get('_id'))
	});

	let createdPost = new Post(data);
	await createdPost.save();

	let post = await Post.populate('comments', Comment).findOne();

	post.get('comments').forEach((comment, index) => {
		let actualId = comment.get('_id').toString();
		let expectedId = comments[index].get('_id').toString();
		t.is(actualId, expectedId);

		let attrs = comment.toJSON();
		let keys = Object.keys(attrs);
		t.same(keys, ['_id', 'email', 'body', 'created_at', 'updated_at']);
	});

	// now confirm that populated documents
	// don't get saved to database
	await post.save();

	post = await Post.findOne();
	post.get('comments').forEach((id, index) => {
		let expectedId = comments[index].get('_id').toString();
		let actualId = id.toString();
		t.is(actualId, expectedId);
	});
});

test('populate the response excluding one selected field from the child model', async t => {
	let n = 3;
	let comments = [];

	while (n--) {
		let data = commentFixture();
		let comment = new Comment(data);
		await comment.save();

		comments.push(comment);
	}

	let data = postFixture({
		comments: comments.map(comment => comment.get('_id'))
	});

	let createdPost = new Post(data);
	await createdPost.save();

	let post = await Post.populate('comments', Comment.exclude('email')).findOne();

	post.get('comments').forEach((comment, index) => {
		let actualId = comment.get('_id').toString();
		let expectedId = comments[index].get('_id').toString();
		t.is(actualId, expectedId);

		let attrs = comment.toJSON();
		let keys = Object.keys(attrs);
		t.same(keys, ['_id', 'body', 'created_at', 'updated_at']);
	});

	// now confirm that populated documents
	// don't get saved to database
	await post.save();

	post = await Post.findOne();
	post.get('comments').forEach((id, index) => {
		let expectedId = comments[index].get('_id').toString();
		let actualId = id.toString();
		t.is(actualId, expectedId);
	});
});

test('find documents and include only one selected field', async t => {
	let post = new Post({
		title: 'San Francisco',
		featured: true,
		published: false
	});

	await post.save();

	let posts = await Post.include('title').find();
	let attrs = posts[0].toJSON();
	let keys = Object.keys(attrs);
	t.same(keys, ['_id', 'title']);
});

test('find documents and include only two selected fields', async t => {
	let post = new Post({
		title: 'San Francisco',
		featured: true,
		published: false
	});

	await post.save();

	let posts = await Post.include(['title', 'featured']).find();
	let attrs = posts[0].toJSON();
	let keys = Object.keys(attrs);
	t.same(keys, ['_id', 'title', 'featured']);
});

test('find documents and exclude one selected field', async t => {
	let post = new Post({
		title: 'San Francisco',
		featured: true,
		published: false
	});

	await post.save();

	let posts = await Post.exclude('title').find();
	let attrs = posts[0].toJSON();
	let keys = Object.keys(attrs);
	t.same(keys, ['_id', 'featured', 'published', 'created_at', 'updated_at']);
});

test('find documents and exclude two selected fields', async t => {
	let post = new Post({
		title: 'San Francisco',
		featured: true,
		published: false
	});

	await post.save();

	let posts = await Post.exclude(['title', 'published']).find();
	let attrs = posts[0].toJSON();
	let keys = Object.keys(attrs);
	t.same(keys, ['_id', 'featured', 'created_at', 'updated_at']);
});

test('search documents using text index', async t => {
	try {
		await Post.drop();
	} catch (_) {}

	await new Post({ title: 'San Francisco' }).save();
	await new Post({ title: 'New York' }).save();
	await new Post({ title: 'San Fran' }).save();

	await Post.index({ title: 'text' });

	let posts = await Post.search('San').sort('score', {
		'$meta': 'textScore'
	}).include('score', {
		'$meta': 'textScore'
	}).find();

	t.is(posts.length, 2);
	t.is(posts[0].get('title'), 'San Francisco');
	t.is(posts[1].get('title'), 'San Fran');
});

test('get distinct', async t => {
	try {
		await Post.drop();
	} catch (_) {}

	await new Post({ title: 'San Francisco', value: 'distinctVal' }).save();
	await new Post({ title: 'New York', value: 'distinctVal' }).save();
	await new Post({ title: 'San Fran', value: 'nondistinctVal' }).save();
	let distincts = await Post.distinct('value');
	t.is(distincts.length, 2);
});

test('get distinct with query', async t => {
	try {
		await Post.drop();
	} catch (_) {}

	await new Post({ title: 'San Francisco', value: 'distinctVal' }).save();
	await new Post({ title: 'San Francisco', value: 'distinctVal' }).save();
	await new Post({ title: 'New York', value: 'distinctVal' }).save();
	await new Post({ title: 'San Fran', value: 'nondistinctVal' }).save();
	let distincts = await Post.distinct('value', { title: 'San Francisco' });
	t.is(distincts.length, 1);
});

test('get aggregate', async t => {
	try {
		await Post.drop();
	} catch (_) {}

	await new Post({ title: 'San Francisco', value: 'distinctVal' }).save();
	await new Post({ title: 'San Francisco', value: 'distinctVal' }).save();
	await new Post({ title: 'San Francisco', value: 'nondistinctVal' }).save();
	await new Post({ title: 'New York', value: 'distinctVal' }).save();
	await new Post({ title: 'San Fran', value: 'nondistinctVal' }).save();
	let distincts = await Post.aggregate([{ $match: { 'title': 'San Francisco' } }, { $group: { '_id': '$title' } }, { $sort: { 'title': -1 } }, { $limit: 1 }, { $project: { 'projectName': 1 } }]);
	t.is(distincts.length, 1);
});
