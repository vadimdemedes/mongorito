'use strict';

const test = require('ava');
const mongorito = require('../');

const setup = require('./_setup');

const Model = mongorito.Model;

setup(test);

test('instance - execute create hooks', async t => {
	const hooks = [];

	class Post extends Model {
		configure() {
			this.before('create', 'beforeCreate');
			this.before('create', () => {
				hooks.push(2);
			});

			this.after('create', 'afterCreate');
			this.after('create', () => {
				hooks.push(4);
			});
		}

		beforeCreate() {
			hooks.push(1);
		}

		afterCreate() {
			hooks.push(3);
		}
	}

	const { db } = t.context;
	db.register(Post);

	const post = new Post();
	await post.save();
	t.deepEqual(hooks, [1, 2, 3, 4]);
});

test('instance - execute update hooks', async t => {
	const hooks = [];

	class Post extends Model {
		configure() {
			this.before('update', 'beforeUpdate');
			this.before('update', () => {
				hooks.push(2);
			});

			this.after('update', 'afterUpdate');
			this.after('update', () => {
				hooks.push(4);
			});
		}

		beforeUpdate() {
			hooks.push(1);
		}

		afterUpdate() {
			hooks.push(3);
		}
	}

	const { db } = t.context;
	db.register(Post);

	const post = new Post();
	await post.save();
	t.deepEqual(hooks, []);

	await post.save();
	t.deepEqual(hooks, [1, 2, 3, 4]);
});

test('instance - execute save hooks', async t => {
	const hooks = [];

	class Post extends Model {
		configure() {
			this.before('save', 'beforeSave');
			this.before('save', () => {
				hooks.push(2);
			});

			this.after('save', 'afterSave');
			this.after('save', () => {
				hooks.push(4);
			});
		}

		beforeSave() {
			hooks.push(1);
		}

		afterSave() {
			hooks.push(3);
		}
	}

	const { db } = t.context;
	db.register(Post);

	const post = new Post();
	await post.save();
	t.deepEqual(hooks, [1, 2, 3, 4]);

	await post.save();
	t.deepEqual(hooks, [1, 2, 3, 4, 1, 2, 3, 4]);
});

test('instance - execute remove hooks', async t => {
	const hooks = [];

	class Post extends Model {
		configure() {
			this.before('remove', 'beforeRemove');
			this.before('remove', () => {
				hooks.push(2);
			});

			this.after('remove', 'afterRemove');
			this.after('remove', () => {
				hooks.push(4);
			});
		}

		beforeRemove() {
			hooks.push(1);
		}

		afterRemove() {
			hooks.push(3);
		}
	}

	const { db } = t.context;
	db.register(Post);

	const post = new Post();
	await post.save();
	t.deepEqual(hooks, []);

	await post.remove();
	t.deepEqual(hooks, [1, 2, 3, 4]);
});

test('instance - execution order of create, update and save hooks', async t => {
	let hooks = [];

	class Post extends Model {
		configure() {
			this.before('create', 'beforeCreate');
			this.before('update', 'beforeUpdate');
			this.before('save', 'beforeSave');
			this.after('create', 'afterCreate');
			this.after('update', 'afterUpdate');
			this.after('save', 'afterSave');
		}

		beforeCreate() {
			hooks.push('before:create');
		}

		afterCreate() {
			hooks.push('after:create');
		}

		beforeUpdate() {
			hooks.push('before:update');
		}

		afterUpdate() {
			hooks.push('after:update');
		}

		beforeSave() {
			hooks.push('before:save');
		}

		afterSave() {
			hooks.push('after:save');
		}
	}

	const { db } = t.context;
	db.register(Post);

	const post = new Post();

	// test create hooks
	await post.save();
	t.deepEqual(hooks, [
		'before:save',
		'before:create',
		'after:create',
		'after:save'
	]);

	// test update hooks
	hooks = [];

	await post.save();
	t.deepEqual(hooks, [
		'before:save',
		'before:update',
		'after:update',
		'after:save'
	]);
});

test('instance - execute per-model hooks', async t => {
	let hooks = [];

	class Post extends Model {}

	const { db } = t.context;
	db.register(Post);

	Post.before('create', () => hooks.push('before:create'));
	Post.before('update', () => hooks.push('before:update'));
	Post.before('remove', () => hooks.push('before:remove'));
	Post.before('save', () => hooks.push('before:save'));
	Post.after('create', () => hooks.push('after:create'));
	Post.after('update', () => hooks.push('after:update'));
	Post.after('remove', () => hooks.push('after:remove'));
	Post.after('save', () => hooks.push('after:save'));

	const post = new Post();

	// test create
	await post.save();
	t.deepEqual(hooks, [
		'before:save',
		'before:create',
		'after:create',
		'after:save'
	]);

	// test update
	hooks = [];
	await post.save();
	t.deepEqual(hooks, [
		'before:save',
		'before:update',
		'after:update',
		'after:save'
	]);

	// test remove
	hooks = [];
	await post.remove();
	t.deepEqual(hooks, [
		'before:remove',
		'after:remove'
	]);
});

test('instance - execute hooks assigned via model plugin', async t => {
	let hooks = [];

	class Post extends Model {}

	Post.use(model => {
		model.before('create', () => hooks.push('before:create'));
		model.before('update', () => hooks.push('before:update'));
		model.before('remove', () => hooks.push('before:remove'));
		model.before('save', () => hooks.push('before:save'));
		model.after('create', () => hooks.push('after:create'));
		model.after('update', () => hooks.push('after:update'));
		model.after('remove', () => hooks.push('after:remove'));
		model.after('save', () => hooks.push('after:save'));
	});

	const { db } = t.context;
	db.register(Post);

	const post = new Post();

	// test create
	await post.save();
	t.deepEqual(hooks, [
		'before:save',
		'before:create',
		'after:create',
		'after:save'
	]);

	// test update
	hooks = [];
	await post.save();
	t.deepEqual(hooks, [
		'before:save',
		'before:update',
		'after:update',
		'after:save'
	]);

	// test remove
	hooks = [];
	await post.remove();
	t.deepEqual(hooks, [
		'before:remove',
		'after:remove'
	]);
});

test('instance - execute hooks assigned via database plugin before model register', async t => {
	let hooks = [];

	class Post extends Model {}

	const { db } = t.context;

	db.use(model => {
		model.before('create', () => hooks.push('before:create'));
		model.before('update', () => hooks.push('before:update'));
		model.before('remove', () => hooks.push('before:remove'));
		model.before('save', () => hooks.push('before:save'));
		model.after('create', () => hooks.push('after:create'));
		model.after('update', () => hooks.push('after:update'));
		model.after('remove', () => hooks.push('after:remove'));
		model.after('save', () => hooks.push('after:save'));
	});

	db.register(Post);

	const post = new Post();

	// test create
	await post.save();
	t.deepEqual(hooks, [
		'before:save',
		'before:create',
		'after:create',
		'after:save'
	]);

	// test update
	hooks = [];
	await post.save();
	t.deepEqual(hooks, [
		'before:save',
		'before:update',
		'after:update',
		'after:save'
	]);

	// test remove
	hooks = [];
	await post.remove();
	t.deepEqual(hooks, [
		'before:remove',
		'after:remove'
	]);
});

test('instance - execute hooks assigned via database plugin after model register', async t => {
	let hooks = [];

	class Post extends Model {}

	const { db } = t.context;
	db.register(Post);

	db.use(model => {
		model.before('create', () => hooks.push('before:create'));
		model.before('update', () => hooks.push('before:update'));
		model.before('remove', () => hooks.push('before:remove'));
		model.before('save', () => hooks.push('before:save'));
		model.after('create', () => hooks.push('after:create'));
		model.after('update', () => hooks.push('after:update'));
		model.after('remove', () => hooks.push('after:remove'));
		model.after('save', () => hooks.push('after:save'));
	});

	const post = new Post();

	// test create
	await post.save();
	t.deepEqual(hooks, [
		'before:save',
		'before:create',
		'after:create',
		'after:save'
	]);

	// test update
	hooks = [];
	await post.save();
	t.deepEqual(hooks, [
		'before:save',
		'before:update',
		'after:update',
		'after:save'
	]);

	// test remove
	hooks = [];
	await post.remove();
	t.deepEqual(hooks, [
		'before:remove',
		'after:remove'
	]);
});

test('class - execute find hooks on find()', async t => {
	class Post extends Model {}

	Post.before('find', function () {
		this.where('cool', true);
	});

	Post.after('find', docs => {
		return docs.map(doc => Object.assign({}, doc, { awesome: true }));
	});

	const { db } = t.context;
	db.register(Post);

	const post = new Post({ cool: true });
	await post.save();

	const posts = await Post.where('cool', false).find();
	t.true(posts[0].get('cool', true));
	t.true(posts[0].get('awesome'));
});

test('class - execute find hooks on findOne()', async t => {
	class Post extends Model {}

	Post.before('find', function () {
		this.where('cool', true);
	});

	Post.after('find', docs => {
		return docs.map(doc => Object.assign({}, doc, { awesome: true }));
	});

	const { db } = t.context;
	db.register(Post);

	await new Post({ cool: true }).save();

	const post = await Post.where('cool', false).findOne();
	t.true(post.get('cool', true));
	t.true(post.get('awesome'));
});
