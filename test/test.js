'use strict';

/**
 * Dependencies
 */

const mongorito = require('../');
const test = require('ava');

const Comment = require('./fixtures/models/comment');
const Account = require('./fixtures/models/account');
const Post = require('./fixtures/models/post');
const Task = require('./fixtures/models/task');

const commentFixture = require('./fixtures/comment');
const postFixture = require('./fixtures/post');

const Model = mongorito.Model;

const beforeEach = test.beforeEach;
const before = test.before;
const after = test.after;


/**
 * Tests
 */

before(async () => {
	await mongorito.connect('localhost/mongorito_test');
});

after(async () => {
	await mongorito.disconnect();
});

beforeEach(async () => {
	await Account.remove();
	await Comment.remove();
	await Post.remove();
	await Task.remove();
});

test('expose mongodb properties', t => {
	const mongodb = require('mongodb');

	let excludedKeys = [
		'connect',
		'MongoClient',
		'Db',
		'db'
	];

	Object.keys(mongodb).forEach(key => {
		if (excludedKeys.indexOf(key) === -1) {
			t.is(mongorito[key], mongodb[key]);
		}
	});
});

test('initialize and manage attributes', t => {
	let data = postFixture();
	let post = new Post(data);
	let attrs = post.get();
	t.same(attrs, data);

	data = postFixture();
	post.set(data);
	attrs = post.get();
	t.same(attrs, data);
});

test('get property', t => {
	let data = postFixture();
	let post = new Post(data);

	let author = post.get('author.name');
	t.is(author, data.author.name);
});

test('set property', t => {
	let data = postFixture();
	let post = new Post(data);

	post.set('author.name', 'John Doe');

	let author = post.get('author.name');
	t.is(author, 'John Doe');
});

test('unset property', async t => {
	let data = { awesome: true };
	let post = new Post(data);
	await post.save();

	t.true(post.get('awesome'));

	post.unset('awesome');
	await post.save();

	t.notOk(post.get('awesome'));

	post = await Post.findOne();
	t.notOk(post.get('awesome'));
});

test('increment property', async t => {
	let post = new Post({ views: 1 });
	await post.save();

	t.is(post.get('views'), 1);

	await post.inc({ views: 1 });

	t.is(post.get('views'), 2);
});

test('fail if incrementing property on unsaved document', async t => {
	let post = new Post({ views: 1 });

	let isFailed = false;

	try {
		await post.inc({ views: 1 });
	} catch (_) {
		isFailed = true;
	}

	t.true(isFailed);
});

test('convert to JSON', t => {
	let data = postFixture();
	let post = new Post(data);
	let attrs = post.get();

	let json = JSON.stringify(post);
	let parsed = JSON.parse(json);
	t.same(parsed, attrs);
});

test('remember previous attributes', t => {
	let post = new Post({ title: 'Sad title' });
	t.is(post.get('title'), 'Sad title');

	post.set('title', 'Happy title');
	t.is(post.previous.title, 'Sad title');
	t.is(post.get('title'), 'Happy title');
	t.true(post.changed.title);
});

test('if nothing changed, no previous value stored', t => {
	let post = new Post({ title: 'Sad title' });
	t.is(post.get('title'), 'Sad title');

	post.set('title', 'Sad title');
	t.notOk(post.previous.title);
	t.notOk(post.changed.title);
	t.is(post.get('title'), 'Sad title');
});

test('setup an index', async t => {
	await Post.index('title');

	let indexes = await Post.indexes();
	let lastIndex = indexes[indexes.length - 1];
	t.same(lastIndex, {
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
	t.same(lastIndex, {
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

	t.ok(err);
	t.is(err.name, 'MongoError');
});

test('create', async t => {
	let post = new Post();
	await post.save();

	let posts = await Post.all();
	t.is(posts.length, 1);

	let createdPost = posts[0];
	t.is(createdPost.get('_id').toString(), post.get('_id').toString());
	t.ok(createdPost.get('created_at'));
	t.ok(createdPost.get('updated_at'));
});

test('create with default values', async t => {
	let data = postFixture();
	delete data.title;

	let post = new Post(data);
	await post.save();

	t.is(post.get('title'), 'Default title');
});

test('update', async t => {
	let post = new Post({ awesome: true });
	await post.save();

	post = await Post.findOne();
	t.true(post.get('awesome'));

	post.set('awesome', false);
	await post.save();

	post = await Post.findOne();
	t.false(post.get('awesome'));
});

test('update `updated_at` attribute', async t => {
	let post = new Post();
	await post.save();

	let prevDate = post.get('updated_at').getTime();

	post.set('awesome', true);
	await post.save();

	let nextDate = post.get('updated_at').getTime();

	t.not(prevDate, nextDate);
});

test('remove', async t => {
	let post = new Post();
	await post.save();

	let posts = await Post.count();
	t.is(posts, 1);

	await post.remove();

	posts = await Post.count();
	t.is(posts, 0);
});

test('remove by criteria', async t => {
	await new Post({ awesome: true }).save();
	await new Post({ awesome: false }).save();

	let posts = await Post.find();
	t.is(posts.length, 2);

	await Post.remove({ awesome: false });

	posts = await Post.find();
	t.is(posts.length, 1);
	t.true(posts[0].get('awesome'));
});

test('remove all documents', async t => {
	await new Post().save();
	await new Post().save();

	let posts = await Post.count();
	t.is(posts, 2);

	await Post.remove();

	posts = await Post.count();
	t.is(posts, 0);
});

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

test('find documents and include only selected fields', async t => {
	let post = new Post({
		title: 'San Francisco',
		featured: true
	});

	await post.save();

	let posts = await Post.include('title').find();
	let attrs = posts[0].toJSON();
	let keys = Object.keys(attrs);
	t.same(keys, ['_id', 'title']);
});

test('find documents and exclude selected fields', async t => {
	let post = new Post({
		title: 'San Francisco',
		featured: true
	});

	await post.save();

	let posts = await Post.exclude('title').find();
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

test('execute all hooks', async t => {
	let hooks = [];

	class Post extends Model {
		collection () {
			return 'posts';
		}

		configure () {
			this.before('save', 'beforeSave');
			this.after('save', 'afterSave');
			this.around('save', 'aroundSave');

			this.before('create', 'beforeCreate');
			this.after('create', 'afterCreate');
			this.around('create', 'aroundCreate');

			this.before('update', 'beforeUpdate');
			this.after('update', 'afterUpdate');
			this.around('update', 'aroundUpdate');

			this.before('remove', 'beforeRemove');
			this.after('remove', 'afterRemove');
			this.around('remove', 'aroundRemove');
		}

		// Save hooks
		* beforeSave () {
			hooks.push('before:save');
		}

		* afterSave () {
			hooks.push('after:save');
		}

		* aroundSave () {
			hooks.push('around:save');
		}

		// Create hooks
		* beforeCreate () {
			hooks.push('before:create');
		}

		* afterCreate () {
			hooks.push('after:create');
		}

		* aroundCreate () {
			hooks.push('around:create');
		}

		// Update hooks
		* beforeUpdate () {
			hooks.push('before:update');
		}

		* afterUpdate () {
			hooks.push('after:update');
		}

		* aroundUpdate () {
			hooks.push('around:update');
		}

		// Remove hooks
		* beforeRemove () {
			hooks.push('before:remove');
		}

		* afterRemove () {
			hooks.push('after:remove');
		}

		* aroundRemove () {
			hooks.push('around:remove');
		}
	}

	let data = postFixture();
	let post = new Post(data);
	await post.save();

	t.same(hooks, [
		'before:create',
		'around:create',
		'before:save',
		'around:save',
		'around:create',
		'after:create',
		'around:save',
		'after:save'
	]);

	hooks = [];

	post.set('title', 'New title');
	await post.save();

	t.same(hooks, [
		'before:update',
		'around:update',
		'before:save',
		'around:save',
		'around:update',
		'after:update',
		'around:save',
		'after:save'
	]);

	hooks = [];

	await post.remove();

	t.same(hooks, [
		'before:remove',
		'around:remove',
		'around:remove',
		'after:remove'
	]);
});

test('abort if a hook throws an error', async t => {
	let hooks = [];

	class Post extends Model {
		collection () {
			return 'posts';
		}

		configure () {
			this.before('save', 'firstBeforeSave');
			this.before('save', 'secondBeforeSave');
		}

		* firstBeforeSave () {
			hooks.push('firstBeforeSave');

			throw new Error('firstBeforeSave failed.');
		}

		* secondBeforeSave () {
			hooks.push('secondBeforeSave');
		}
	}

	let posts = await Post.all();
	t.is(posts.length, 0);

	let data = postFixture();
	let post = new Post(data);

	try {
		await post.save();
	} catch (e) {
		t.same(hooks, ['firstBeforeSave']);
	} finally {
		posts = await Post.all();
		t.is(posts.length, 0);
	}
});

test('allow registration of hooks through an object, or with an array of methods', async t => {
	let hooks = [];

	class Post extends Model {
		collection () {
			return 'posts';
		}

		configure () {
			this.hooks({
				'before:save': 'beforeSave',
				'before:create': ['firstBeforeCreate', 'secondBeforeCreate'],
				'after:save': 'afterSave',
				'after:create': 'firstAfterCreate',
				'around:create': ['firstAroundCreate', 'secondAroundCreate']
			});

			this.after('create', ['secondAfterCreate', 'thirdAfterCreate']);
		}

		* beforeSave () {
			hooks.push('beforeSave');
		}

		* firstBeforeCreate () {
			hooks.push('firstBeforeCreate');
		}

		* secondBeforeCreate () {
			hooks.push('secondBeforeCreate');
		}

		* afterSave () {
			hooks.push('afterSave');
		}

		* firstAfterCreate () {
			hooks.push('firstAfterCreate');
		}

		* firstAroundCreate () {
			hooks.push('firstAroundCreate');
		}

		* secondAroundCreate () {
			hooks.push('secondAroundCreate');
		}

		* secondAfterCreate () {
			hooks.push('secondAfterCreate');
		}

		* thirdAfterCreate () {
			hooks.push('thirdAfterCreate');
		}
	}

	let data = postFixture();
	let post = new Post(data);
	await post.save();

	t.same(hooks, [
		'firstBeforeCreate',
		'secondBeforeCreate',
		'firstAroundCreate',
		'secondAroundCreate',
		'beforeSave',
		'secondAroundCreate',
		'firstAroundCreate',
		'firstAfterCreate',
		'secondAfterCreate',
		'thirdAfterCreate',
		'afterSave'
	]);
});

test('skip selected middleware', async t => {
	let middlewareTriggered = false;

	class Post extends Model {
		configure () {
			this.before('save', 'beforeSave');
		}

		* beforeSave () {
			middlewareTriggered = true;
		}
	}

	let data = postFixture();
	let post = new Post(data);
	await post.save();

	t.true(middlewareTriggered);
	middlewareTriggered = false;

	await post.save({ skip: 'beforeSave' });

	t.false(middlewareTriggered);
});

test('automatically set collection name', async t => {
	let account = new Account();
	await account.save();

	t.is(account.collection, 'accounts');

	let accounts = await Account.find();
	t.is(accounts.length, 1);
});

test('use multiple databases', async t => {
	// Post1 will be stored in first database
	// Post2 will be stored in second database
	class Post1 extends Model {
		collection () {
			return 'posts';
		}
	}

	let secondaryDb = await mongorito.connect('localhost/mongorito_test_2');

	class Post2 extends Model {
		db () {
			return secondaryDb;
		}

		collection () {
			return 'posts';
		}
	}

	await Post1.remove();
	await Post2.remove();

	await new Post1({ title: 'Post in first db' }).save();
	await new Post2({ title: 'Post in second db' }).save();

	let posts = await Post1.all();
	t.is(posts.length, 1);
	t.is(posts[0].get('title'), 'Post in first db');

	posts = await Post2.all();
	t.is(posts.length, 1);
	t.is(posts[0].get('title'), 'Post in second db');

	await secondaryDb.close();
});
