'use strict';

/**
 * Dependencies
 */

const mongorito = require('../');
const setup = require('./_setup');
const test = require('ava');

const postFixture = require('./fixtures/post');

const Model = mongorito.Model;


/**
 * Tests
 */

setup(test);

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
	await post.create();
	await post.update();

	t.deepEqual(hooks, [
		'before:create',
		'around:create',
		'before:save',
		'around:save',
		'around:create',
		'after:create',
		'around:save',
		'after:save',
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

	post.set('title', 'New title');
	await post.save();

	t.deepEqual(hooks, [
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

	t.deepEqual(hooks, [
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
		t.deepEqual(hooks, ['firstBeforeSave']);
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

	t.deepEqual(hooks, [
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
