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

test('find documents with .limit()', async t => {
	const createdPosts = [];
	let n = 4;

	while (n--) {
		const post = new Post();
		await post.save(); // eslint-disable-line babel/no-await-in-loop

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
		await post.save(); // eslint-disable-line babel/no-await-in-loop

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
		await post.save(); // eslint-disable-line babel/no-await-in-loop
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
		const data = postFixture({index: n});
		const post = new Post(data);
		await post.save(); // eslint-disable-line babel/no-await-in-loop
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

	const posts = await Post.or([{isPublic: true}, {'author.name': 'user2'}]).find();
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

	const posts = await Post.and({isPublic: false}, {'author.name': 'user2'}).find();
	t.deepEqual(posts.map(getId), [getId(secondPost), getId(thirdPost)]);
});

test('find documents with .in()', async t => {
	let n = 10;

	while (n--) {
		const data = postFixture({index: n});
		const post = new Post(data);
		await post.save(); // eslint-disable-line babel/no-await-in-loop
	}

	const posts = await Post.where('index').in([4, 5]).find();
	t.deepEqual(posts.map(post => post.get('index')), [5, 4]);
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

test('include and exlude at the same time', async t => {
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

test('search documents using text index', async t => {
	await Post.drop();

	await new Post({title: 'San Francisco'}).save();
	await new Post({title: 'New York'}).save();
	await new Post({title: 'San Fran'}).save();

	await Post.index({title: 'text'});

	const posts = await Post.search('San').sort('score', {
		$meta: 'textScore'
	}).include('score', {
		$meta: 'textScore'
	}).find();

	t.deepEqual(posts.map(post => post.get('title')), ['San Francisco', 'San Fran']);
});
