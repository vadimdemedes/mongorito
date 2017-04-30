'use strict';

const test = require('ava');

const postFixture = require('./fixtures/post');
const Post = require('./fixtures/models/post');
const setup = require('./_setup');

function getId(model) {
	return String(model.get('_id'));
}

setup(test);

test('find all documents', async t => {
	const savedPosts = [];
	let n = 4;

	while (n--) {
		const post = new Post();
		await post.save(); // eslint-disable-line babel/no-await-in-loop

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

	await new Post({awesome: true}).save();
	await new Post({awesome: false}).save();

	t.is(await Post.count({awesome: true}), 1);
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

	const posts = await Post.where('comments').elemMatch({body: data.comments[0].body}).find();
	t.is(posts.length, 1);
	t.is(getId(posts[0]), getId(post));
});

test('find a document with .where() matching with regex', async t => {
	const data = postFixture({title: 'Something'});
	const post = new Post(data);
	await post.save();

	const posts = await Post.where('title', /something/i).find();
	t.is(posts.length, 1);
	t.is(getId(posts[0]), getId(post));
});

test('sort documents', async t => {
	let n = 4;

	while (n--) {
		const post = new Post({index: n});
		await post.save(); // eslint-disable-line babel/no-await-in-loop
	}

	let posts = await Post.sort({_id: -1}).find();
	t.is(posts.length, 4);

	n = 4;

	while (n--) {
		const post = posts[n];
		t.is(post.get('index'), n);
	}

	posts = await Post.sort({_id: 1}).find();
	t.is(posts.length, 4);

	n = 4;

	while (n--) {
		const post = posts[n];
		t.is(post.get('index'), 3 - n);
	}
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
	t.deepEqual(keys.sort(), ['_id', 'title', 'published'].sort());
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
	t.deepEqual(keys.sort(), ['_id', 'title'].sort());
});

test('include and exclude at the same time', async t => {
	const post = new Post({
		title: 'San Francisco',
		featured: true,
		published: false
	});

	await post.save();

	const posts = await Post.include({featured: 1, published: 1}).find();
	const keys = Object.keys(posts[0].get());
	t.deepEqual(keys.sort(), ['_id', 'featured', 'published']);
});
