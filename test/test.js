'use strict';

/**
 * Dependencies
 */

const mongorito = require('../');
const test = require('ava');

const Comment = require('./models/comment');
const Account = require('./models/account');
const Post = require('./models/post');
const Task = require('./models/task');

const commentFixture = require('./fixtures/comment');
const postFixture = require('./fixtures/post');

const Model = mongorito.Model;

const beforeEach = test.beforeEach;
const before = test.before;
const after = test.after;


/**
 * Tests
 */

before(function * () {
	yield mongorito.connect('localhost/mongorito_test');
});

after(function * () {
	yield mongorito.disconnect();
});

beforeEach(function * () {
	yield* Account.remove();
	yield* Comment.remove();
	yield* Post.remove();
	yield* Task.remove();
});

test('expose mongodb properties', function (t) {
	const mongodb = require('mongodb');

	let excludedKeys = [
		'connect',
		'MongoClient',
		'Db',
		'db'
	];

	Object.keys(mongodb).forEach(function (key) {
		if (excludedKeys.indexOf(key) === -1) {
			t.is(mongorito[key], mongodb[key]);
		}
	});
});

test('initialize and manage attributes', function (t) {
	let data = postFixture();
	let post = new Post(data);
	let attrs = post.get();
	t.same(attrs, data);

	data = postFixture();
	post.set(data);
	attrs = post.get();
	t.same(attrs, data);
});

test('get property', function (t) {
	let data = postFixture();
	let post = new Post(data);

	let author = post.get('author.name');
	t.is(author, data.author.name);
});

test('set property', function (t) {
	let data = postFixture();
	let post = new Post(data);

	post.set('author.name', 'John Doe');

	let author = post.get('author.name');
	t.is(author, 'John Doe');
});

test('unset property', function * (t) {
	let data = { awesome: true };
	let post = new Post(data);
	yield* post.save();

	t.true(post.get('awesome'));

	post.unset('awesome');
	yield* post.save();

	t.notOk(post.get('awesome'));

	post = yield* Post.findOne();
	t.notOk(post.get('awesome'));
});

test('increment property', function * (t) {
	let post = new Post({ views: 1 });
	yield* post.save();

	t.is(post.get('views'), 1);

	yield* post.inc({ views: 1 });

	t.is(post.get('views'), 2);
});

test('fail if incrementing property on unsaved document', function * (t) {
	let post = new Post({ views: 1 });

	let isFailed = false;

	try {
		yield* post.inc({ views: 1 });
	} catch (_) {
		isFailed = true;
	}

	t.true(isFailed);
});

test('convert to JSON', function (t) {
	let data = postFixture();
	let post = new Post(data);
	let attrs = post.get();

	let json = JSON.stringify(post);
	let parsed = JSON.parse(json);
	t.same(parsed, attrs);
});

test('remember previous attributes', function (t) {
	let post = new Post({ title: 'Sad title' });
	t.is(post.get('title'), 'Sad title');

	post.set('title', 'Happy title');
	t.is(post.previous.title, 'Sad title');
	t.is(post.get('title'), 'Happy title');
	t.true(post.changed.title);
});

test('if nothing changed, no previous value stored', function (t) {
	let post = new Post({ title: 'Sad title' });
	t.is(post.get('title'), 'Sad title');

	post.set('title', 'Sad title');
	t.notOk(post.previous.title);
	t.notOk(post.changed.title);
	t.is(post.get('title'), 'Sad title');
});

test('setup an index', function * (t) {
	yield* Post.index('title');

	let indexes = yield* Post.indexes();
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

test('setup a unique index', function * (t) {
	yield* Task.index('name', { unique: true });

	let indexes = yield* Task.indexes();
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

	yield* new Task({ name: 'first' }).save();

	let err;

	try {
		yield* new Task({ name: 'first' }).save();
	} catch (e) {
		err = e;
	}

	t.ok(err);
	t.is(err.name, 'MongoError');
});

test('create', function * (t) {
	let post = new Post();
	yield* post.save();

	let posts = yield* Post.all();
	t.is(posts.length, 1);

	let createdPost = posts[0];
	t.is(createdPost.get('_id').toString(), post.get('_id').toString());
	t.ok(createdPost.get('created_at'));
	t.ok(createdPost.get('updated_at'));
});

test('create with default values', function * (t) {
	let data = postFixture();
	delete data.title;

	let post = new Post(data);
	yield* post.save();

	t.is(post.get('title'), 'Default title');
});

test('update', function * (t) {
	let post = new Post({ awesome: true });
	yield* post.save();

	post = yield* Post.findOne();
	t.true(post.get('awesome'));

	post.set('awesome', false);
	yield* post.save();

	post = yield* Post.findOne();
	t.false(post.get('awesome'));
});

test('remove', function * (t) {
	let post = new Post();
	yield* post.save();

	let posts = yield* Post.count();
	t.is(posts, 1);

	yield* post.remove();

	posts = yield* Post.count();
	t.is(posts, 0);
});

test('remove by criteria', function * (t) {
	yield* new Post({ awesome: true }).save();
	yield* new Post({ awesome: false }).save();

	let posts = yield* Post.find();
	t.is(posts.length, 2);

	yield* Post.remove({ awesome: false });

	posts = yield* Post.find();
	t.is(posts.length, 1);
	t.true(posts[0].get('awesome'));
});

test('remove all documents', function * (t) {
	yield* new Post().save();
	yield* new Post().save();

	let posts = yield* Post.count();
	t.is(posts, 2);

	yield* Post.remove();

	posts = yield* Post.count();
	t.is(posts, 0);
});

test('find all documents', function * (t) {
	t.plan(5);

	let savedPosts = [];
	let n = 4;

	while (n--) {
		let post = new Post();
		yield* post.save();

		savedPosts.push(post);
	}

	let posts = yield* Post.all();
	t.is(posts.length, 4);

	posts.forEach(function (post, index) {
		let actualId = post.get('_id').toString();
		let expectedId = savedPosts[index].get('_id').toString();

		t.is(actualId, expectedId);
	});
});

test('count all documents', function * (t) {
	let posts = yield* Post.count();
	t.is(posts, 0);

	yield* new Post().save();
	yield* new Post().save();

	posts = yield* Post.count();
	t.is(posts, 2);
});

test('count by criteria', function * (t) {
	let posts = yield* Post.count();
	t.is(posts, 0);

	yield* new Post({ awesome: true }).save();
	yield* new Post({ awesome: false }).save();

	posts = yield* Post.count({ awesome: true });
	t.is(posts, 1);
});

test('find one document', function * (t) {
	let createdPost = new Post();
	yield* createdPost.save();

	let posts = yield* Post.count();
	t.is(posts, 1);

	let post = yield* Post.findOne();
	let actualId = post.get('_id').toString();
	let expectedId = createdPost.get('_id').toString();

	t.is(actualId, expectedId);
});

test('find one document by id', function * (t) {
	let data = postFixture();
	let createdPost = new Post(data);
	yield* createdPost.save();

	let posts = yield* Post.count();
	t.is(posts, 1);

	let post = yield* Post.findById(createdPost.get('_id'));
	t.is(post.get('title'), data.title);
});

test('find one document by id string', function * (t) {
	let data = postFixture();
	let createdPost = new Post(data);
	yield* createdPost.save();

	let posts = yield* Post.count();
	t.is(posts, 1);

	let post = yield* Post.findById(createdPost.get('_id').toString());
	t.is(post.get('title'), data.title);
});

test('find a document with .where()', function * (t) {
	let data = postFixture();
	let post = new Post(data);
	yield* post.save();

	let posts = yield* Post.where('title', data.title).find();
	t.is(posts.length, 1);

	let actualId = posts[0].get('_id').toString();
	let expectedId = post.get('_id').toString();
	t.is(actualId, expectedId);
});

test('find a document with .where() matching sub-properties', function * (t) {
	let data = postFixture();
	let post = new Post(data);
	yield* post.save();

	let posts = yield* Post.where('author.name', data.author.name).find();
	t.is(posts.length, 1);

	let actualId = posts[0].get('_id').toString();
	let expectedId = post.get('_id').toString();
	t.is(actualId, expectedId);
});

test('find a document with .where() matching sub-documents using $elemMatch', function * (t) {
	let data = postFixture();
	let post = new Post(data);
	yield* post.save();

	let posts = yield* Post.where('comments').matches({ body: data.comments[0].body }).find();
	t.is(posts.length, 1);

	let actualId = posts[0].get('_id').toString();
	let expectedId = post.get('_id').toString();
	t.is(actualId, expectedId);
});

test('find a document with .where() matching with regex', function * (t) {
	let data = postFixture({ title: 'Something' });
	let post = new Post(data);
	yield* post.save();

	let posts = yield* Post.where('title', /something/i).find();
	t.is(posts.length, 1);

	let actualId = posts[0].get('_id').toString();
	let expectedId = post.get('_id').toString();
	t.is(actualId, expectedId);
});

test('find documents with .limit()', function * (t) {
	t.plan(3);

	let createdPosts = [];
	let n = 4;

	while (n--) {
		let post = new Post();
		yield* post.save();

		createdPosts.push(post);
	}

	let posts = yield* Post.limit(2).find();
	t.is(posts.length, 2);

	posts.forEach(function (post, index) {
		let actualId = post.get('_id').toString();
		let expectedId = createdPosts[index].get('_id').toString();
		t.is(actualId, expectedId);
	});
});

test('find documents with .limit() and .skip()', function * (t) {
	t.plan(3);

	let createdPosts = [];
	let n = 4;

	while (n--) {
		let post = new Post();
		yield* post.save();

		createdPosts.push(post);
	}

	let posts = yield* Post.limit(2).skip(1).find();
	t.is(posts.length, 2);

	posts.forEach(function (post, index) {
		let actualId = post.get('_id').toString();
		let expectedId = createdPosts[1 + index].get('_id').toString();
		t.is(actualId, expectedId);
	});
});

test('find documents with .exists()', function * (t) {
	let n = 5;

	while (n--) {
		let data = postFixture();
		if (n < 2) {
			delete data.body;
		}

		let post = new Post(data);
		yield* post.save();
	}

	let posts = yield* Post.exists('body').find();
	t.is(posts.length, 3);

	posts = yield* Post.where('body').exists().find();
	t.is(posts.length, 3);

	posts = yield* Post.exists('body', false).find();
	t.is(posts.length, 2);

	posts = yield* Post.where('body').exists(false).find();
	t.is(posts.length, 2);
});

test('find documents with .lt(), .lte(), .gt(), .gte()', function * (t) {
	let n = 10;

	while (n--) {
		let data = postFixture({ index: n });
		let post = new Post(data);
		yield* post.save();
	}

	let posts = yield* Post.where('index').lt(5).find();
	t.is(posts.length, 5);

	posts = yield* Post.where('index').lte(5).find();
	t.is(posts.length, 6);

	posts = yield* Post.where('index').gt(7).find();
	t.is(posts.length, 2);

	posts = yield* Post.where('index').gte(7).find();
	t.is(posts.length, 3);
});

test('find documents with .or()', function * (t) {
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

	yield* firstPost.save();
	yield* secondPost.save();
	yield* thirdPost.save();

	let posts = yield* Post.or({ isPublic: true }, { 'author.name': 'user2' }).find();
	t.is(posts.length, 2);
	t.is(posts[0].get('author.name'), 'user1');
	t.is(posts[1].get('author.name'), 'user2');
});

test('find documents with .and()', function * (t) {
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

	yield* firstPost.save();
	yield* secondPost.save();
	yield* thirdPost.save();

	let posts = yield* Post.and({ isPublic: false }, { 'author.name': 'user2' }).find();
	t.is(posts.length, 2);
	t.is(posts[0].get('title'), 'second');
	t.is(posts[1].get('title'), 'third');
});

test('find documents with .in()', function * (t) {
	let n = 10;

	while (n--) {
		let data = postFixture({ index: n });
		let post = new Post(data);
		yield* post.save();
	}

	let posts = yield* Post.where('index').in([4, 5]).find();
	t.is(posts.length, 2);
});

test('sort documents', function * (t) {
	let n = 4;

	while (n--) {
		let post = new Post({ index: n });
		yield* post.save();
	}

	let posts = yield* Post.sort({ _id: -1 }).find();
	t.is(posts.length, 4);

	n = 4;

	while (n--) {
		let post = posts[n];
		t.is(post.get('index'), n);
	}

	posts = yield* Post.sort({ _id: 1 }).find();
	t.is(posts.length, 4);

	n = 4;

	while (n--) {
		let post = posts[n];
		t.is(post.get('index'), 3 - n);
	}
});

test('populate the response', function * (t) {
	let n = 3;
	let comments = [];

	while (n--) {
		let data = commentFixture();
		let comment = new Comment(data);
		yield* comment.save();

		comments.push(comment);
	}

	let data = postFixture({
		comments: comments.map(function (comment) {
			return comment.get('_id');
		})
	});

	let createdPost = new Post(data);
	yield* createdPost.save();

	let post = yield* Post.populate('comments', Comment).findOne();

	post.get('comments').forEach(function (comment, index) {
		let actualId = comment.get('_id').toString();
		let expectedId = comments[index].get('_id').toString();
		t.is(actualId, expectedId);
	});

	// now confirm that populated documents
	// don't get saved to database
	yield* post.save();

	post = yield* Post.findOne();
	post.get('comments').forEach(function (id, index) {
		let expectedId = comments[index].get('_id').toString();
		let actualId = id.toString();
		t.is(actualId, expectedId);
	});
});

test('find documents and include only selected fields', function * (t) {
	let post = new Post({
		title: 'San Francisco',
		featured: true
	});

	yield* post.save();

	let posts = yield* Post.include('title').find();
	let attrs = posts[0].toJSON();
	let keys = Object.keys(attrs);
	t.same(keys, ['_id', 'title']);
});

test('find documents and exclude selected fields', function * (t) {
	let post = new Post({
		title: 'San Francisco',
		featured: true
	});

	yield* post.save();

	let posts = yield* Post.exclude('title').find();
	let attrs = posts[0].toJSON();
	let keys = Object.keys(attrs);
	t.same(keys, ['_id', 'featured', 'created_at', 'updated_at']);
});

test('search documents using text index', function * (t) {
	try {
		yield* Post.drop();
	} catch (_) {}

	yield* new Post({ title: 'San Francisco' }).save();
	yield* new Post({ title: 'New York' }).save();
	yield* new Post({ title: 'San Fran' }).save();

	yield* Post.index({ title: 'text' });

	let posts = yield* Post.search('San').sort('score', {
		'$meta': 'textScore'
	}).include('score', {
		'$meta': 'textScore'
	}).find();

	t.is(posts.length, 2);
	t.is(posts[0].get('title'), 'San Francisco');
	t.is(posts[1].get('title'), 'San Fran');
});

test('execute all hooks', function * (t) {
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
		* beforeSave (next) {
			hooks.push('before:save');

			yield* next;
		}

		* afterSave (next) {
			hooks.push('after:save');

			yield* next;
		}

		* aroundSave (next) {
			hooks.push('around:save');

			yield* next;
		}

		// Create hooks
		* beforeCreate (next) {
			hooks.push('before:create');

			yield* next;
		}

		* afterCreate (next) {
			hooks.push('after:create');

			yield* next;
		}

		* aroundCreate (next) {
			hooks.push('around:create');

			yield* next;
		}

		// Update hooks
		* beforeUpdate (next) {
			hooks.push('before:update');

			yield* next;
		}

		* afterUpdate (next) {
			hooks.push('after:update');

			yield* next;
		}

		* aroundUpdate (next) {
			hooks.push('around:update');

			yield* next;
		}

		// Remove hooks
		* beforeRemove (next) {
			hooks.push('before:remove');

			yield* next;
		}

		* afterRemove (next) {
			hooks.push('after:remove');

			yield* next;
		}

		* aroundRemove (next) {
			hooks.push('around:remove');

			yield* next;
		}
	}

	let data = postFixture();
	let post = new Post(data);
	yield* post.save();

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
	yield* post.save();

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

	yield* post.remove();

	t.same(hooks, [
		'before:remove',
		'around:remove',
		'around:remove',
		'after:remove'
	]);
});

test('abort if a hook throws an error', function * (t) {
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

		* secondBeforeSave (next) {
			hooks.push('secondBeforeSave');

			yield* next;
		}
	}

	let posts = yield* Post.all();
	t.is(posts.length, 0);

	let data = postFixture();
	let post = new Post(data);

	try {
		yield* post.save();
	} catch (e) {
		t.same(hooks, ['firstBeforeSave']);
	} finally {
		posts = yield* Post.all();
		t.is(posts.length, 0);
	}
});

test('allow registration of hooks through an object, or with an array of methods', function * (t) {
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

		* beforeSave (next) {
			hooks.push('beforeSave');

			yield* next;
		}

		* firstBeforeCreate (next) {
			hooks.push('firstBeforeCreate');

			yield* next;
		}

		* secondBeforeCreate (next) {
			hooks.push('secondBeforeCreate');

			yield* next;
		}

		* afterSave (next) {
			hooks.push('afterSave');

			yield* next;
		}

		* firstAfterCreate (next) {
			hooks.push('firstAfterCreate');

			yield* next;
		}

		* firstAroundCreate (next) {
			hooks.push('firstAroundCreate');

			yield* next;
		}

		* secondAroundCreate (next) {
			hooks.push('secondAroundCreate');

			yield* next;
		}

		* secondAfterCreate (next) {
			hooks.push('secondAfterCreate');

			yield* next;
		}

		* thirdAfterCreate (next) {
			hooks.push('thirdAfterCreate');

			yield* next;
		}
	}

	let data = postFixture();
	let post = new Post(data);
	yield* post.save();

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

test('skip selected middleware', function * (t) {
	let middlewareTriggered = false;

	class Post extends Model {
		configure () {
			this.before('save', 'beforeSave');
		}

		* beforeSave (next) {
			middlewareTriggered = true;

			yield* next;
		}
	}

	let data = postFixture();
	let post = new Post(data);
	yield* post.save();

	t.true(middlewareTriggered);
	middlewareTriggered = false;

	yield* post.save({ skip: 'beforeSave' });

	t.false(middlewareTriggered);
});

test('automatically set collection name', function * (t) {
	let account = new Account();
	yield* account.save();

	t.is(account.collection, 'accounts');

	let accounts = yield* Account.find();
	t.is(accounts.length, 1);
});

test('use multiple databases', function * (t) {
	// Post1 will be stored in first database
	// Post2 will be stored in second database
	class Post1 extends Model {
		collection () {
			return 'posts';
		}
	}

	let secondaryDb = yield mongorito.connect('localhost/mongorito_test_2');

	class Post2 extends Model {
		db () {
			return secondaryDb;
		}

		collection () {
			return 'posts';
		}
	}

	yield* Post1.remove();
	yield* Post2.remove();

	yield* new Post1({ title: 'Post in first db' }).save();
	yield* new Post2({ title: 'Post in second db' }).save();

	let posts = yield* Post1.all();
	t.is(posts.length, 1);
	t.is(posts[0].get('title'), 'Post in first db');

	posts = yield* Post2.all();
	t.is(posts.length, 1);
	t.is(posts[0].get('title'), 'Post in second db');

	yield secondaryDb.close();
});
