'use strict';

const test = require('ava');
const setup = require('./_setup');

const Comment = require('./fixtures/models/comment');
const Post = require('./fixtures/models/post');

const commentFixture = require('./fixtures/comment');
const postFixture = require('./fixtures/post');

function getId(model) {
	return String(model.get('_id'));
}

setup(test);

test('find all documents', async t => {
	const savedPosts = [];
	let n = 4;

	while (n--) {
		const post = new Post();
		await post.save();

		savedPosts.push(post);
	}

	const posts = await Post.find();
	t.is(posts.length, 4);
	t.deepEqual(posts.map(getId), savedPosts.map(getId));
});

test('count all documents', async t => {
	t.is(await Post.count(), 0);

	await new Post().save();
	await new Post().save();

	t.is(await Post.count(), 2);
});

test('count by criteria', async t => {
	t.is(await Post.count(), 0);

	await new Post({ awesome: true }).save();
	await new Post({ awesome: false }).save();

	t.is(await Post.count({ awesome: true }), 1);
});

test('find one document', async t => {
	const createdPost = new Post();
	await createdPost.save();

	const posts = await Post.count();
	t.is(posts, 1);

	const post = await Post.findOne();
	t.is(getId(post), getId(createdPost));
});

test('find one document by id', async t => {
	const data = postFixture();
	const createdPost = new Post(data);
	await createdPost.save();

	const posts = await Post.count();
	t.is(posts, 1);

	const post = await Post.findById(createdPost.get('_id'));
	t.is(post.get('title'), data.title);
});

test('find one document by id string', async t => {
	const data = postFixture();
	const createdPost = new Post(data);
	await createdPost.save();

	const posts = await Post.count();
	t.is(posts, 1);

	const post = await Post.findById(getId(createdPost));
	t.is(post.get('title'), data.title);
});

test('find a document with .where()', async t => {
	const data = postFixture();
	const post = new Post(data);
	await post.save();

	const posts = await Post.where('title', data.title).find();
	t.is(posts.length, 1);
	t.is(getId(posts[0]), getId(post));
});

test('find a document with .where() matching sub-properties', async t => {
	const data = postFixture();
	const post = new Post(data);
	await post.save();

	const posts = await Post.where('author.name', data.author.name).find();
	t.is(posts.length, 1);
	t.is(getId(posts[0]), getId(post));
});

test('find a document with .where() matching sub-documents using $elemMatch', async t => {
	const data = postFixture();
	const post = new Post(data);
	await post.save();

	const posts = await Post.where('comments').elemMatch({ body: data.comments[0].body }).find();
	t.is(posts.length, 1);
	t.is(getId(posts[0]), getId(post));
});

test('find a document with .where() matching with regex', async t => {
	const data = postFixture({ title: 'Something' });
	const post = new Post(data);
	await post.save();

	const posts = await Post.where('title', /something/i).find();
	t.is(posts.length, 1);
	t.is(getId(posts[0]), getId(post));
});

test('find documents with .limit()', async t => {
	const createdPosts = [];
	let n = 4;

	while (n--) {
		const post = new Post();
		await post.save();

		createdPosts.push(post);
	}

	const posts = await Post.limit(2).find();
	t.is(posts.length, 2);
	t.deepEqual(posts.map(getId), createdPosts.slice(0, 2).map(getId));
});

test('find documents with .limit() and .skip()', async t => {
	const createdPosts = [];
	let n = 4;

	while (n--) {
		const post = new Post();
		await post.save();

		createdPosts.push(post);
	}

	const posts = await Post.limit(2).skip(1).find();
	t.is(posts.length, 2);
	t.deepEqual(posts.map(getId), createdPosts.slice(1, 3).map(getId));
});

test('find documents with .exists()', async t => {
	let n = 5;

	while (n--) {
		const data = postFixture();
		if (n < 2) {
			delete data.body;
		}

		const post = new Post(data);
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
		const data = postFixture({ index: n });
		const post = new Post(data);
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
	const firstPost = new Post({
		isPublic: true,
		author: {
			name: 'user1'
		}
	});

	const secondPost = new Post({
		isPublic: false,
		author: {
			name: 'user2'
		}
	});

	const thirdPost = new Post({
		isPublic: false,
		author: {
			name: 'user3'
		}
	});

	await firstPost.save();
	await secondPost.save();
	await thirdPost.save();

	const posts = await Post.or([{ isPublic: true }, { 'author.name': 'user2' }]).find();
	t.deepEqual(posts.map(getId), [getId(firstPost), getId(secondPost)]);
});

test('find documents with .and()', async t => {
	const firstPost = new Post({
		isPublic: true,
		author: {
			name: 'user1'
		}
	});

	const secondPost = new Post({
		isPublic: false,
		author: {
			name: 'user2'
		},
		title: 'second'
	});

	const thirdPost = new Post({
		isPublic: false,
		author: {
			name: 'user2'
		},
		title: 'third'
	});

	await firstPost.save();
	await secondPost.save();
	await thirdPost.save();

	const posts = await Post.and({ isPublic: false }, { 'author.name': 'user2' }).find();
	t.deepEqual(posts.map(getId), [getId(secondPost), getId(thirdPost)]);
});

test('find documents with .in()', async t => {
	let n = 10;

	while (n--) {
		const data = postFixture({ index: n });
		const post = new Post(data);
		await post.save();
	}

	const posts = await Post.where('index').in([4, 5]).find();
	t.deepEqual(posts.map(post => post.get('index')), [5, 4]);
});

test('sort documents', async t => {
	let n = 4;

	while (n--) {
		const post = new Post({ index: n });
		await post.save();
	}

	let posts = await Post.sort({ _id: -1 }).find();
	t.is(posts.length, 4);

	n = 4;

	while (n--) {
		const post = posts[n];
		t.is(post.get('index'), n);
	}

	posts = await Post.sort({ _id: 1 }).find();
	t.is(posts.length, 4);

	n = 4;

	while (n--) {
		const post = posts[n];
		t.is(post.get('index'), 3 - n);
	}
});

test.skip('populate the response', async t => {
	let n = 3;
	const comments = [];

	while (n--) {
		const data = commentFixture();
		const comment = new Comment(data);
		await comment.save();

		comments.push(comment);
	}

	const data = postFixture({
		comments: comments.map(comment => comment.get('_id'))
	});

	const createdPost = new Post(data);
	await createdPost.save();

	let post = await Post.populate('comments', Comment).findOne();

	post.get('comments').forEach((comment, index) => {
		const actualId = comment.get('_id').toString();
		const expectedId = comments[index].get('_id').toString();
		t.is(actualId, expectedId);

		const attrs = comment.toJSON();
		const keys = Object.keys(attrs);
		t.deepEqual(keys, ['_id', 'email', 'body', 'created_at', 'updated_at']);
	});

	// now confirm that populated documents
	// don't get saved to database
	await post.save();

	post = await Post.findOne();
	post.get('comments').forEach((id, index) => {
		const expectedId = comments[index].get('_id').toString();
		const actualId = id.toString();
		t.is(actualId, expectedId);
	});
});

test.skip('populate the response excluding one selected field from the child model', async t => {
	let n = 3;
	const comments = [];

	while (n--) {
		const data = commentFixture();
		const comment = new Comment(data);
		await comment.save();

		comments.push(comment);
	}

	const data = postFixture({
		comments: comments.map(comment => comment.get('_id'))
	});

	const createdPost = new Post(data);
	await createdPost.save();

	let post = await Post.populate('comments', Comment.exclude('email')).findOne();

	post.get('comments').forEach((comment, index) => {
		const actualId = comment.get('_id').toString();
		const expectedId = comments[index].get('_id').toString();
		t.is(actualId, expectedId);

		const attrs = comment.toJSON();
		const keys = Object.keys(attrs);
		t.deepEqual(keys, ['_id', 'body', 'created_at', 'updated_at']);
	});

	// now confirm that populated documents
	// don't get saved to database
	await post.save();

	post = await Post.findOne();
	post.get('comments').forEach((id, index) => {
		const expectedId = comments[index].get('_id').toString();
		const actualId = id.toString();
		t.is(actualId, expectedId);
	});
});

test('find documents and include only one selected field', async t => {
	const post = new Post({
		title: 'San Francisco',
		featured: true,
		published: false
	});

	await post.save();

	const posts = await Post.include('title').find();
	const keys = Object.keys(posts[0].get());
	t.deepEqual(keys.sort(), ['_id', 'title'].sort());
});

test('find documents and include only two selected fields', async t => {
	const post = new Post({
		title: 'San Francisco',
		featured: true,
		published: false
	});

	await post.save();

	const posts = await Post.include(['title', 'featured']).find();
	const keys = Object.keys(posts[0].get());
	t.deepEqual(keys.sort(), ['_id', 'title', 'featured'].sort());
});

test('find documents and exclude one selected field', async t => {
	const post = new Post({
		title: 'San Francisco',
		featured: true,
		published: false
	});

	await post.save();

	const posts = await Post.exclude('featured').find();
	const keys = Object.keys(posts[0].get());
	t.deepEqual(keys.sort(), ['_id', 'title', 'published', 'created_at', 'updated_at'].sort());
});

test('find documents and exclude two selected fields', async t => {
	const post = new Post({
		title: 'San Francisco',
		featured: true,
		published: false
	});

	await post.save();

	const posts = await Post.exclude(['featured', 'published']).find();
	const keys = Object.keys(posts[0].get());
	t.deepEqual(keys.sort(), ['_id', 'title', 'created_at', 'updated_at'].sort());
});

test('search documents using text index', async t => {
	await Post.drop();

	await new Post({ title: 'San Francisco' }).save();
	await new Post({ title: 'New York' }).save();
	await new Post({ title: 'San Fran' }).save();

	await Post.index({ title: 'text' });

	const posts = await Post.search('San').sort('score', {
		'$meta': 'textScore'
	}).include('score', {
		'$meta': 'textScore'
	}).find();

	t.deepEqual(posts.map(post => post.get('title')), ['San Francisco', 'San Fran']);
});

test.failing('get distinct', async t => {
	await Post.drop();

	await new Post({ title: 'San Francisco', value: 'distinctVal' }).save();
	await new Post({ title: 'New York', value: 'distinctVal' }).save();
	await new Post({ title: 'San Fran', value: 'nondistinctVal' }).save();
	const distincts = await Post.distinct('value');
	t.is(distincts.length, 2);
});

test.failing('get distinct with query', async t => {
	await Post.drop();

	await new Post({ title: 'San Francisco', value: 'distinctVal' }).save();
	await new Post({ title: 'San Francisco', value: 'distinctVal' }).save();
	await new Post({ title: 'New York', value: 'distinctVal' }).save();
	await new Post({ title: 'San Fran', value: 'nondistinctVal' }).save();
	const distincts = await Post.distinct({ title: 'San Francisco' }, 'value').find();
	t.is(distincts.length, 1);
});

test.failing('get aggregate', async t => {
	await Post.drop();

	await new Post({ title: 'San Francisco', value: 'distinctVal' }).save();
	await new Post({ title: 'San Francisco', value: 'distinctVal' }).save();
	await new Post({ title: 'San Francisco', value: 'nondistinctVal' }).save();
	await new Post({ title: 'New York', value: 'distinctVal' }).save();
	await new Post({ title: 'San Fran', value: 'nondistinctVal' }).save();
	const distincts = await Post.aggregate([{ $match: { 'title': 'San Francisco' } }, { $group: { '_id': '$title' } }, { $sort: { 'title': -1 } }, { $limit: 1 }, { $project: { 'projectName': 1 } }]);
	t.is(distincts.length, 1);
});
